<?php

declare(strict_types=1);

namespace CapsuleOS\Portal;

use PDO;

final class Database
{
    private static ?PDO $pdo = null;

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
        return self::$pdo;
    }

    private static function migrate(PDO $pdo): void
    {
        $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS subscriptions (
    user_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'none',
    stripe_customer_id TEXT,
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
SQL);
    }
}
