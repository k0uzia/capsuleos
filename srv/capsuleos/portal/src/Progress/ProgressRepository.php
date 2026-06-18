<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Progress;

use CapsuleOS\Portal\Database;
use PDO;

final class ProgressRepository
{
    /** @return list<array<string, mixed>> */
    public static function listForUser(int $userId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM module_progress WHERE user_id = :uid ORDER BY updated_at DESC',
        );
        $stmt->execute(['uid' => $userId]);
        $rows = $stmt->fetchAll();
        return is_array($rows) ? $rows : [];
    }

    /** @return array<string, mixed>|null */
    public static function find(int $userId, string $mountId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM module_progress WHERE user_id = :uid AND mount_id = :mount LIMIT 1',
        );
        $stmt->execute(['uid' => $userId, 'mount' => $mountId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** @param array<string, bool> $state */
    public static function upsert(
        int $userId,
        string $mountId,
        string $registryId,
        string $storageKey,
        array $state,
        int $doneCount,
        int $totalCount,
    ): void {
        $json = json_encode($state, JSON_THROW_ON_ERROR);
        $pdo = Database::connection();
        $stmt = $pdo->prepare(<<<'SQL'
INSERT INTO module_progress (user_id, mount_id, registry_id, storage_key, progress_json, done_count, total_count, updated_at)
VALUES (:uid, :mount, :registry, :storage, :json, :done, :total, datetime('now'))
ON CONFLICT(user_id, mount_id) DO UPDATE SET
    registry_id = excluded.registry_id,
    storage_key = excluded.storage_key,
    progress_json = excluded.progress_json,
    done_count = excluded.done_count,
    total_count = excluded.total_count,
    updated_at = datetime('now')
SQL);
        $stmt->execute([
            'uid' => $userId,
            'mount' => $mountId,
            'registry' => $registryId,
            'storage' => $storageKey,
            'json' => $json,
            'done' => $doneCount,
            'total' => $totalCount,
        ]);
    }

    public static function delete(int $userId, string $mountId): bool
    {
        $stmt = Database::connection()->prepare(
            'DELETE FROM module_progress WHERE user_id = :uid AND mount_id = :mount',
        );
        $stmt->execute(['uid' => $userId, 'mount' => $mountId]);
        return $stmt->rowCount() > 0;
    }
}
