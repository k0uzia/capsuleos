<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\User;

use CapsuleOS\Portal\Database;
use CapsuleOS\Portal\Auth\AuthService;

final class UserRepository
{
    /** @return array<string, mixed>|null */
    public static function findByEmail(string $email): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => strtolower(trim($email))]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** @return array<string, mixed>|null */
    public static function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function create(string $email, string $passwordHash, string $displayName = ''): int
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'INSERT INTO users (email, password_hash, display_name, email_verified) VALUES (:email, :hash, :name, 0)',
        );
        $stmt->execute([
            'email' => strtolower(trim($email)),
            'hash' => $passwordHash,
            'name' => trim($displayName),
        ]);
        $userId = (int) $pdo->lastInsertId();
        $sub = $pdo->prepare('INSERT INTO subscriptions (user_id, status) VALUES (:uid, :status)');
        $sub->execute(['uid' => $userId, 'status' => 'none']);
        $gam = $pdo->prepare('INSERT INTO user_gamification (user_id) VALUES (:uid)');
        $gam->execute(['uid' => $userId]);
        return $userId;
    }

    public static function updateDisplayName(int $userId, string $displayName): void
    {
        $stmt = Database::connection()->prepare('UPDATE users SET display_name = :name WHERE id = :id');
        $stmt->execute(['name' => trim($displayName), 'id' => $userId]);
    }

    public static function updateEmail(int $userId, string $email): bool
    {
        $email = strtolower(trim($email));
        if (self::findByEmail($email) !== null) {
            return false;
        }
        $stmt = Database::connection()->prepare('UPDATE users SET email = :email WHERE id = :id');
        $stmt->execute(['email' => $email, 'id' => $userId]);
        return true;
    }

    public static function updatePassword(int $userId, string $password): void
    {
        $hash = AuthService::hashPassword($password);
        $stmt = Database::connection()->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
        $stmt->execute(['hash' => $hash, 'id' => $userId]);
    }

    public static function deleteAccount(int $userId): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM users WHERE id = :id');
        $stmt->execute(['id' => $userId]);
    }

    /** @return array<string, mixed>|null */
    public static function subscription(int $userId): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM subscriptions WHERE user_id = :uid LIMIT 1');
        $stmt->execute(['uid' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function subscriptionStatus(int $userId): string
    {
        $row = self::subscription($userId);
        return is_array($row) ? (string) ($row['status'] ?? 'none') : 'none';
    }

    public static function entitlementLevel(int $userId): string
    {
        if (self::subscriptionStatus($userId) === 'active') {
            return 'subscriber';
        }
        return 'registered';
    }

    public static function setCancelAtPeriodEnd(int $userId, bool $cancel): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE subscriptions SET cancel_at_period_end = :val, updated_at = datetime(\'now\') WHERE user_id = :uid',
        );
        $stmt->execute(['val' => $cancel ? 1 : 0, 'uid' => $userId]);
    }
}
