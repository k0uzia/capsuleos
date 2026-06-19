<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Usage;

use CapsuleOS\Portal\Config;
use CapsuleOS\Portal\Database;

final class OsUsageRepository
{
    public static function subjectKey(?int $userId, ?string $anonFingerprint): string
    {
        if ($userId !== null && $userId > 0) {
            return 'user:' . $userId;
        }
        $fp = trim((string) $anonFingerprint);
        if ($fp === '') {
            $fp = 'unknown';
        }
        return 'anon:' . substr(hash('sha256', $fp), 0, 32);
    }

    public static function todayDate(): string
    {
        return date('Y-m-d');
    }

    public static function minutesUsed(string $subjectKey, string $registryId, ?string $date = null): float
    {
        $date = $date ?? self::todayDate();
        $stmt = Database::connection()->prepare(
            'SELECT minutes_used FROM os_usage_daily WHERE subject_key = :sk AND registry_id = :rid AND usage_date = :d LIMIT 1',
        );
        $stmt->execute(['sk' => $subjectKey, 'rid' => $registryId, 'd' => $date]);
        $row = $stmt->fetch();
        return is_array($row) ? (float) ($row['minutes_used'] ?? 0) : 0.0;
    }

    public static function addMinutes(string $subjectKey, string $registryId, float $minutes, ?string $date = null): float
    {
        $date = $date ?? self::todayDate();
        $pdo = Database::connection();
        $current = self::minutesUsed($subjectKey, $registryId, $date);
        $newTotal = $current + max(0.0, $minutes);
        $stmt = $pdo->prepare(
            'INSERT INTO os_usage_daily (subject_key, registry_id, usage_date, minutes_used)
             VALUES (:sk, :rid, :d, :m)
             ON CONFLICT(subject_key, registry_id, usage_date) DO UPDATE SET minutes_used = :m2',
        );
        $stmt->execute(['sk' => $subjectKey, 'rid' => $registryId, 'd' => $date, 'm' => $newTotal, 'm2' => $newTotal]);
        return $newTotal;
    }

    /** @return list<array{registryId: string, minutesUsed: float, minutesRemaining: float}> */
    public static function summaryForSubject(string $subjectKey, int $limitMinutes): array
    {
        $date = self::todayDate();
        $stmt = Database::connection()->prepare(
            'SELECT registry_id, minutes_used FROM os_usage_daily WHERE subject_key = :sk AND usage_date = :d',
        );
        $stmt->execute(['sk' => $subjectKey, 'd' => $date]);
        $out = [];
        foreach ($stmt->fetchAll() as $row) {
            if (!is_array($row)) {
                continue;
            }
            $used = (float) ($row['minutes_used'] ?? 0);
            $out[] = [
                'registryId' => (string) ($row['registry_id'] ?? ''),
                'minutesUsed' => $used,
                'minutesRemaining' => max(0.0, (float) $limitMinutes - $used),
            ];
        }
        return $out;
    }

    public static function resetsAt(): string
    {
        return date('Y-m-d') . 'T23:59:59';
    }

    public static function dailyLimit(): int
    {
        $path = Config::contracts() . '/portal-entitlements.json';
        if (!is_file($path)) {
            return 15;
        }
        $json = json_decode((string) file_get_contents($path), true);
        if (!is_array($json)) {
            return 15;
        }
        $anon = $json['osSession']['anonymous'] ?? [];
        return (int) ($anon['maxMinutesPerOsPerDay'] ?? $anon['maxMinutes'] ?? 15);
    }
}
