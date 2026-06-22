<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Gamification;

use CapsuleOS\Portal\Config;
use CapsuleOS\Portal\Database;

final class GamificationRepository
{
    /** @return array<string, mixed> */
    public static function getOrCreate(int $userId): array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM user_gamification WHERE user_id = :uid LIMIT 1');
        $stmt->execute(['uid' => $userId]);
        $row = $stmt->fetch();
        if (is_array($row)) {
            return $row;
        }
        $ins = Database::connection()->prepare('INSERT INTO user_gamification (user_id) VALUES (:uid)');
        $ins->execute(['uid' => $userId]);
        return ['user_id' => $userId, 'xp' => 0, 'level' => 1, 'badges_json' => '[]'];
    }

    /** @return list<string> */
    public static function badges(int $userId): array
    {
        $row = self::getOrCreate($userId);
        $decoded = json_decode((string) ($row['badges_json'] ?? '[]'), true);
        return is_array($decoded) ? array_values(array_filter(array_map('strval', $decoded))) : [];
    }

    public static function addBadge(int $userId, string $badgeId): void
    {
        $badges = self::badges($userId);
        if (in_array($badgeId, $badges, true)) {
            return;
        }
        $badges[] = $badgeId;
        $stmt = Database::connection()->prepare(
            'UPDATE user_gamification SET badges_json = :json, updated_at = datetime(\'now\') WHERE user_id = :uid',
        );
        $stmt->execute(['json' => json_encode($badges, JSON_THROW_ON_ERROR), 'uid' => $userId]);
    }

    public static function addXp(int $userId, int $amount): array
    {
        $row = self::getOrCreate($userId);
        $xp = (int) ($row['xp'] ?? 0) + max(0, $amount);
        $level = self::levelFromXp($xp);
        $stmt = Database::connection()->prepare(
            'UPDATE user_gamification SET xp = :xp, level = :lvl, updated_at = datetime(\'now\') WHERE user_id = :uid',
        );
        $stmt->execute(['xp' => $xp, 'lvl' => $level, 'uid' => $userId]);
        return ['xp' => $xp, 'level' => $level];
    }

    public static function levelFromXp(int $xp): int
    {
        $contract = self::contract();
        $perLevel = (int) ($contract['xpPerLevel'] ?? 100);
        $maxLevel = (int) ($contract['maxLevel'] ?? 50);
        if ($perLevel <= 0) {
            return 1;
        }
        return min($maxLevel, max(1, (int) floor($xp / $perLevel) + 1));
    }

    public static function xpProgress(int $xp): array
    {
        $contract = self::contract();
        $perLevel = (int) ($contract['xpPerLevel'] ?? 100);
        $level = self::levelFromXp($xp);
        $base = ($level - 1) * $perLevel;
        $inLevel = $xp - $base;
        $percent = $perLevel > 0 ? (int) round(($inLevel / $perLevel) * 100) : 0;
        return [
            'level' => $level,
            'xp' => $xp,
            'xpInLevel' => $inLevel,
            'xpForLevel' => $perLevel,
            'percent' => min(100, max(0, $percent)),
        ];
    }

    /** @return array<string, mixed> */
    public static function contract(): array
    {
        $path = Config::contracts() . '/portal-gamification.json';
        if (!is_file($path)) {
            return [];
        }
        $json = json_decode((string) file_get_contents($path), true);
        return is_array($json) ? $json : [];
    }

    /** @return list<array<string, string>> */
    public static function badgeCatalog(): array
    {
        $contract = self::contract();
        $badges = $contract['badges'] ?? [];
        if (!is_array($badges)) {
            return [];
        }
        $out = [];
        foreach ($badges as $badge) {
            if (!is_array($badge)) {
                continue;
            }
            $out[] = [
                'id' => (string) ($badge['id'] ?? ''),
                'label' => (string) ($badge['label'] ?? ''),
                'description' => (string) ($badge['description'] ?? ''),
                'icon' => (string) ($badge['icon'] ?? 'award'),
                'iconFamily' => (string) ($badge['iconFamily'] ?? 'solid'),
                'tone' => (string) ($badge['tone'] ?? 'blue'),
            ];
        }
        return $out;
    }

    public static function badgeTotal(): int
    {
        $contract = self::contract();
        return (int) ($contract['badgeTotal'] ?? count(self::badgeCatalog()));
    }
}
