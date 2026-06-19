<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\User;

use CapsuleOS\Portal\Database;

final class RoleRepository
{
    /** @return list<string> */
    public static function rolesForUser(int $userId): array
    {
        $stmt = Database::connection()->prepare('SELECT role FROM user_roles WHERE user_id = :uid ORDER BY role');
        $stmt->execute(['uid' => $userId]);
        $roles = [];
        foreach ($stmt->fetchAll() as $row) {
            if (is_array($row) && ($row['role'] ?? '') !== '') {
                $roles[] = (string) $row['role'];
            }
        }
        return $roles;
    }

    public static function hasRole(int $userId, string $role): bool
    {
        return in_array($role, self::rolesForUser($userId), true);
    }

    public static function grant(int $userId, string $role, string $grantedBy = 'admin'): void
    {
        $stmt = Database::connection()->prepare(
            'INSERT OR IGNORE INTO user_roles (user_id, role, granted_by) VALUES (:uid, :role, :by)',
        );
        $stmt->execute(['uid' => $userId, 'role' => $role, 'by' => $grantedBy]);
    }

    public static function revoke(int $userId, string $role): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM user_roles WHERE user_id = :uid AND role = :role');
        $stmt->execute(['uid' => $userId, 'role' => $role]);
    }
}
