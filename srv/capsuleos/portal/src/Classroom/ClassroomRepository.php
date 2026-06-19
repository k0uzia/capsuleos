<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Classroom;

use CapsuleOS\Portal\Config;
use CapsuleOS\Portal\Database;

final class ClassroomRepository
{
    public static function inviteDays(): int
    {
        $path = Config::contracts() . '/portal-grades.json';
        if (!is_file($path)) {
            return 7;
        }
        $json = json_decode((string) file_get_contents($path), true);
        return is_array($json) ? (int) ($json['classInviteDays'] ?? 7) : 7;
    }

    /** @return array<string, mixed>|null */
    public static function findByTeacher(int $teacherId): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM classrooms WHERE teacher_id = :tid LIMIT 1');
        $stmt->execute(['tid' => $teacherId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** @return array<string, mixed>|null */
    public static function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM classrooms WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** @return array<string, mixed>|null */
    public static function findByInviteToken(string $token): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM classrooms WHERE invite_token = :tok LIMIT 1');
        $stmt->execute(['tok' => $token]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** @return array<string, mixed>|null */
    public static function membershipForUser(int $userId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT cm.*, c.name AS classroom_name, c.teacher_id, c.allowed_os_json, c.allowed_modules_json
             FROM classroom_members cm
             JOIN classrooms c ON c.id = cm.classroom_id
             WHERE cm.user_id = :uid LIMIT 1',
        );
        $stmt->execute(['uid' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function memberCount(int $classroomId): int
    {
        $stmt = Database::connection()->prepare(
            'SELECT COUNT(*) AS cnt FROM classroom_members WHERE classroom_id = :cid',
        );
        $stmt->execute(['cid' => $classroomId]);
        $row = $stmt->fetch();
        return is_array($row) ? (int) ($row['cnt'] ?? 0) : 0;
    }

    /** @return list<array<string, mixed>> */
    public static function members(int $classroomId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT cm.user_id, cm.joined_at, u.email, u.display_name
             FROM classroom_members cm
             JOIN users u ON u.id = cm.user_id
             WHERE cm.classroom_id = :cid
             ORDER BY cm.joined_at',
        );
        $stmt->execute(['cid' => $classroomId]);
        return array_values(array_filter($stmt->fetchAll(), 'is_array'));
    }

    public static function create(int $teacherId, string $name, int $maxSlots, array $allowedOs, array $allowedModules): int
    {
        $token = bin2hex(random_bytes(16));
        $expires = date('Y-m-d H:i:s', strtotime('+' . self::inviteDays() . ' days'));
        $stmt = Database::connection()->prepare(
            'INSERT INTO classrooms (teacher_id, name, max_slots, invite_token, invite_expires_at, allowed_os_json, allowed_modules_json)
             VALUES (:tid, :name, :slots, :tok, :exp, :os, :mod)',
        );
        $stmt->execute([
            'tid' => $teacherId,
            'name' => trim($name),
            'slots' => $maxSlots,
            'tok' => $token,
            'exp' => $expires,
            'os' => json_encode(array_values($allowedOs), JSON_THROW_ON_ERROR),
            'mod' => json_encode(array_values($allowedModules), JSON_THROW_ON_ERROR),
        ]);
        return (int) Database::connection()->lastInsertId();
    }

    public static function update(int $classroomId, int $teacherId, string $name, int $maxSlots, array $allowedOs, array $allowedModules): bool
    {
        $stmt = Database::connection()->prepare(
            'UPDATE classrooms SET name = :name, max_slots = :slots, allowed_os_json = :os, allowed_modules_json = :mod
             WHERE id = :id AND teacher_id = :tid',
        );
        $stmt->execute([
            'name' => trim($name),
            'slots' => $maxSlots,
            'os' => json_encode(array_values($allowedOs), JSON_THROW_ON_ERROR),
            'mod' => json_encode(array_values($allowedModules), JSON_THROW_ON_ERROR),
            'id' => $classroomId,
            'tid' => $teacherId,
        ]);
        return $stmt->rowCount() > 0;
    }

    public static function regenerateInvite(int $classroomId, int $teacherId): ?string
    {
        $token = bin2hex(random_bytes(16));
        $expires = date('Y-m-d H:i:s', strtotime('+' . self::inviteDays() . ' days'));
        $stmt = Database::connection()->prepare(
            'UPDATE classrooms SET invite_token = :tok, invite_expires_at = :exp WHERE id = :id AND teacher_id = :tid',
        );
        $stmt->execute(['tok' => $token, 'exp' => $expires, 'id' => $classroomId, 'tid' => $teacherId]);
        return $stmt->rowCount() > 0 ? $token : null;
    }

    public static function delete(int $classroomId, int $teacherId): void
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('DELETE FROM classrooms WHERE id = :id AND teacher_id = :tid');
        $stmt->execute(['id' => $classroomId, 'tid' => $teacherId]);
    }

    public static function addMember(int $classroomId, int $userId): bool
    {
        $classroom = self::findById($classroomId);
        if ($classroom === null) {
            return false;
        }
        if (strtotime((string) ($classroom['invite_expires_at'] ?? '')) < time()) {
            return false;
        }
        if (self::memberCount($classroomId) >= (int) ($classroom['max_slots'] ?? 0)) {
            return false;
        }
        if (self::membershipForUser($userId) !== null) {
            return false;
        }
        $stmt = Database::connection()->prepare(
            'INSERT INTO classroom_members (classroom_id, user_id) VALUES (:cid, :uid)',
        );
        $stmt->execute(['cid' => $classroomId, 'uid' => $userId]);
        return true;
    }

    public static function removeMember(int $classroomId, int $userId, int $teacherId): bool
    {
        $classroom = self::findById($classroomId);
        if ($classroom === null || (int) ($classroom['teacher_id'] ?? 0) !== $teacherId) {
            return false;
        }
        $stmt = Database::connection()->prepare(
            'DELETE FROM classroom_members WHERE classroom_id = :cid AND user_id = :uid',
        );
        $stmt->execute(['cid' => $classroomId, 'uid' => $userId]);
        return $stmt->rowCount() > 0;
    }

    /** @return list<string> */
    public static function decodeJsonList(?string $json): array
    {
        if ($json === null || $json === '') {
            return [];
        }
        $decoded = json_decode($json, true);
        if (!is_array($decoded)) {
            return [];
        }
        return array_values(array_filter(array_map('strval', $decoded)));
    }
}
