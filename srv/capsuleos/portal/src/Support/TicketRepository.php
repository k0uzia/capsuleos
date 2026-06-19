<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Support;

use CapsuleOS\Portal\Database;

final class TicketRepository
{
    /** @return list<array<string, mixed>> */
    public static function listForUser(int $userId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM support_tickets WHERE user_id = :uid ORDER BY created_at DESC',
        );
        $stmt->execute(['uid' => $userId]);
        return array_values(array_filter($stmt->fetchAll(), 'is_array'));
    }

    public static function create(int $userId, string $type, string $subject, string $body): int
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO support_tickets (user_id, type, subject, body) VALUES (:uid, :type, :sub, :body)',
        );
        $stmt->execute([
            'uid' => $userId,
            'type' => $type,
            'sub' => trim($subject),
            'body' => trim($body),
        ]);
        return (int) Database::connection()->lastInsertId();
    }
}
