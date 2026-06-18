<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\User;

use CapsuleOS\Portal\Database;
use PDO;

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

    public static function create(string $email, string $passwordHash): int
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, email_verified) VALUES (:email, :hash, 0)');
        $stmt->execute([
            'email' => strtolower(trim($email)),
            'hash' => $passwordHash,
        ]);
        $userId = (int) $pdo->lastInsertId();
        $sub = $pdo->prepare('INSERT INTO subscriptions (user_id, status) VALUES (:uid, :status)');
        $sub->execute(['uid' => $userId, 'status' => 'none']);
        return $userId;
    }

    public static function subscriptionStatus(int $userId): string
    {
        $stmt = Database::connection()->prepare('SELECT status FROM subscriptions WHERE user_id = :uid LIMIT 1');
        $stmt->execute(['uid' => $userId]);
        $row = $stmt->fetch();
        return is_array($row) ? (string) ($row['status'] ?? 'none') : 'none';
    }

    public static function entitlementLevel(int $userId): string
    {
        $status = self::subscriptionStatus($userId);
        if ($status === 'active') {
            return 'subscriber';
        }
        return 'registered';
    }
}
