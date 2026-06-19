<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Store;

use CapsuleOS\Portal\Database;

final class PurchasedModuleRepository
{
    /** @return list<array<string, mixed>> */
    public static function listForUser(int $userId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT module_id, purchased_at FROM purchased_modules WHERE user_id = :uid ORDER BY purchased_at DESC',
        );
        $stmt->execute(['uid' => $userId]);
        return array_values(array_filter($stmt->fetchAll(), 'is_array'));
    }

    public static function hasModule(int $userId, string $moduleId): bool
    {
        $stmt = Database::connection()->prepare(
            'SELECT 1 FROM purchased_modules WHERE user_id = :uid AND module_id = :mid LIMIT 1',
        );
        $stmt->execute(['uid' => $userId, 'mid' => $moduleId]);
        return (bool) $stmt->fetch();
    }
}
