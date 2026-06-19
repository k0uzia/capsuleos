<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Skin;

use CapsuleOS\Portal\Database;

final class SkinSaveRepository
{
    /** @return list<array<string, mixed>> */
    public static function listForUser(int $userId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT registry_id, updated_at FROM skin_saves WHERE user_id = :uid ORDER BY updated_at DESC',
        );
        $stmt->execute(['uid' => $userId]);
        return array_values(array_filter($stmt->fetchAll(), 'is_array'));
    }

    /** @return array<string, mixed>|null */
    public static function find(int $userId, string $registryId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM skin_saves WHERE user_id = :uid AND registry_id = :rid LIMIT 1',
        );
        $stmt->execute(['uid' => $userId, 'rid' => $registryId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** @param array<string, mixed> $payload */
    public static function upsert(int $userId, string $registryId, array $payload): void
    {
        $stmt = Database::connection()->prepare(
            'INSERT INTO skin_saves (user_id, registry_id, payload_json, updated_at)
             VALUES (:uid, :rid, :json, datetime(\'now\'))
             ON CONFLICT(user_id, registry_id) DO UPDATE SET payload_json = :json2, updated_at = datetime(\'now\')',
        );
        $json = json_encode($payload, JSON_THROW_ON_ERROR);
        $stmt->execute(['uid' => $userId, 'rid' => $registryId, 'json' => $json, 'json2' => $json]);
    }

    public static function delete(int $userId, string $registryId): void
    {
        $stmt = Database::connection()->prepare(
            'DELETE FROM skin_saves WHERE user_id = :uid AND registry_id = :rid',
        );
        $stmt->execute(['uid' => $userId, 'rid' => $registryId]);
    }
}
