<?php

declare(strict_types=1);

namespace CapsuleOS\Portal;

use CapsuleOS\Portal\Auth\AuthService;
use PDO;

final class Database
{
    private static ?PDO $pdo = null;
    private static ?string $localPreviewSynced = null;

    public static function connection(): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }
        $path = Config::sqlite();
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }
        self::$pdo = new PDO('sqlite:' . $path);
        self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        self::migrate(self::$pdo);
        self::seedDevUser(self::$pdo);
        return self::$pdo;
    }

    private static function migrate(PDO $pdo): void
    {
        $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    email_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS subscriptions (
    user_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'none',
    stripe_customer_id TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS module_progress (
    user_id INTEGER NOT NULL,
    mount_id TEXT NOT NULL,
    registry_id TEXT NOT NULL DEFAULT '',
    storage_key TEXT NOT NULL DEFAULT '',
    progress_json TEXT NOT NULL DEFAULT '{}',
    done_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, mount_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    granted_at TEXT NOT NULL DEFAULT (datetime('now')),
    granted_by TEXT NOT NULL DEFAULT 'system',
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS os_usage_daily (
    subject_key TEXT NOT NULL,
    registry_id TEXT NOT NULL,
    usage_date TEXT NOT NULL,
    minutes_used REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (subject_key, registry_id, usage_date)
);
CREATE TABLE IF NOT EXISTS skin_saves (
    user_id INTEGER NOT NULL,
    registry_id TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, registry_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS user_gamification (
    user_id INTEGER PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    badges_json TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS class_benefits_retained (
    user_id INTEGER PRIMARY KEY,
    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'ouvert',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    max_slots INTEGER NOT NULL,
    invite_token TEXT NOT NULL UNIQUE,
    invite_expires_at TEXT NOT NULL,
    allowed_os_json TEXT NOT NULL DEFAULT '[]',
    allowed_modules_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS classroom_members (
    classroom_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (classroom_id, user_id),
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS purchased_modules (
    user_id INTEGER NOT NULL,
    module_id TEXT NOT NULL,
    purchased_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, module_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
SQL);

        self::migrateColumn($pdo, 'users', 'display_name', "TEXT NOT NULL DEFAULT ''");
        self::migrateColumn($pdo, 'subscriptions', 'current_period_end', 'TEXT');
        self::migrateColumn($pdo, 'subscriptions', 'cancel_at_period_end', 'INTEGER NOT NULL DEFAULT 0');
        self::migrateColumn($pdo, 'subscriptions', 'billing_json', 'TEXT');
    }

    private static function migrateColumn(PDO $pdo, string $table, string $column, string $definition): void
    {
        $stmt = $pdo->query('PRAGMA table_info(' . $table . ')');
        $cols = $stmt ? $stmt->fetchAll() : [];
        foreach ($cols as $col) {
            if (is_array($col) && ($col['name'] ?? '') === $column) {
                return;
            }
        }
        $pdo->exec('ALTER TABLE ' . $table . ' ADD COLUMN ' . $column . ' ' . $definition);
    }

    private static function seedDevUser(PDO $pdo): void
    {
        if (!Config::allowsLocalPreview()) {
            return;
        }
        $creds = Config::devCredentials();
        $email = strtolower(trim($creds['defaultUser']));
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        if (!$row) {
            $hash = AuthService::hashPassword($creds['defaultPassword']);
            $insert = $pdo->prepare(
                'INSERT INTO users (email, password_hash, display_name, email_verified) VALUES (:email, :hash, :name, 1)',
            );
            $insert->execute(['email' => $email, 'hash' => $hash, 'name' => 'Test']);
            $userId = (int) $pdo->lastInsertId();
            $sub = $pdo->prepare('INSERT INTO subscriptions (user_id, status) VALUES (:uid, :status)');
            $sub->execute(['uid' => $userId, 'status' => 'none']);
            $gam = $pdo->prepare('INSERT INTO user_gamification (user_id) VALUES (:uid)');
            $gam->execute(['uid' => $userId]);
        } else {
            $userId = (int) ($row['id'] ?? 0);
        }
        if ($userId <= 0) {
            $fallback = $pdo->query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
            $fallbackRow = $fallback ? $fallback->fetch() : false;
            $userId = is_array($fallbackRow) ? (int) ($fallbackRow['id'] ?? 0) : 0;
        }
        if ($userId > 0) {
            self::syncLocalPreviewUser($pdo, $userId);
        }
    }

    private static function syncLocalPreviewUser(PDO $pdo, int $userId): void
    {
        $profileKey = Config::prodProfile() ?? (Config::isDev() ? 'dev-default' : '');
        if ($profileKey === '') {
            return;
        }
        if (self::$localPreviewSynced === $profileKey) {
            return;
        }

        $sessionKey = 'portal_preview_profile';
        $profileChanged = (string) ($_SESSION[$sessionKey] ?? '') !== $profileKey;
        if ($profileChanged) {
            $_SESSION[$sessionKey] = $profileKey;
        }

        $subStmt = $pdo->prepare('SELECT status, current_period_end, billing_json FROM subscriptions WHERE user_id = :uid LIMIT 1');
        $subStmt->execute(['uid' => $userId]);
        $subRow = $subStmt->fetch();
        $status = is_array($subRow) ? (string) ($subRow['status'] ?? 'none') : 'none';
        $periodEnd = is_array($subRow) ? trim((string) ($subRow['current_period_end'] ?? '')) : '';
        $billingJson = is_array($subRow) ? trim((string) ($subRow['billing_json'] ?? '')) : '';

        if ($status !== 'active' || $periodEnd === '') {
            $periodEnd = (new \DateTimeImmutable('+30 days'))->format('Y-m-d H:i:s');
            $update = $pdo->prepare(
                'UPDATE subscriptions SET status = :status, current_period_end = :end, updated_at = datetime(\'now\') WHERE user_id = :uid',
            );
            $update->execute(['status' => 'active', 'end' => $periodEnd, 'uid' => $userId]);
        }

        if ($billingJson === '') {
            $defaultBilling = json_encode([
                'paymentMethod' => 'Carte Visa ···· 4242',
                'addressLine' => '12 rue de la Capsule',
                'postalCode' => '75001',
                'city' => 'Paris',
            ], JSON_THROW_ON_ERROR);
            $billingUpdate = $pdo->prepare(
                'UPDATE subscriptions SET billing_json = :billing, updated_at = datetime(\'now\') WHERE user_id = :uid',
            );
            $billingUpdate->execute(['billing' => $defaultBilling, 'uid' => $userId]);
        }

        if ($profileChanged) {
            $pdo->prepare('DELETE FROM user_roles WHERE user_id = :uid')->execute(['uid' => $userId]);
            $grade = Config::prodProfileGrade();
            if ($grade === null && Config::isDev()) {
                $grade = 'abonne';
            }
            if ($grade === 'professeur') {
                $grant = $pdo->prepare(
                    'INSERT OR IGNORE INTO user_roles (user_id, role, granted_by) VALUES (:uid, :role, :by)',
                );
                $grant->execute(['uid' => $userId, 'role' => 'professeur', 'by' => 'local-preview']);
            } elseif ($grade === 'createur') {
                $grant = $pdo->prepare(
                    'INSERT OR IGNORE INTO user_roles (user_id, role, granted_by) VALUES (:uid, :role, :by)',
                );
                $grant->execute(['uid' => $userId, 'role' => 'createur', 'by' => 'local-preview']);
            }
        } else {
            $grade = Config::prodProfileGrade();
            if ($grade === 'professeur' || $grade === 'createur') {
                $roleStmt = $pdo->prepare('SELECT 1 FROM user_roles WHERE user_id = :uid AND role = :role LIMIT 1');
                $roleStmt->execute(['uid' => $userId, 'role' => $grade]);
                if (!$roleStmt->fetch()) {
                    $grant = $pdo->prepare(
                        'INSERT OR IGNORE INTO user_roles (user_id, role, granted_by) VALUES (:uid, :role, :by)',
                    );
                    $grant->execute(['uid' => $userId, 'role' => $grade, 'by' => 'local-preview']);
                }
            }
        }

        self::$localPreviewSynced = $profileKey;
    }
}
