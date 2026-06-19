<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Subscription;

use CapsuleOS\Portal\Config;

final class Entitlements
{
    /** @var array<string, mixed>|null */
    private static ?array $contract = null;

    /** @return array<string, mixed> */
    public static function contract(): array
    {
        if (self::$contract !== null) {
            return self::$contract;
        }
        $path = Config::contracts() . '/portal-entitlements.json';
        if (!is_file($path)) {
            self::$contract = [];
            return self::$contract;
        }
        $json = json_decode((string) file_get_contents($path), true);
        self::$contract = is_array($json) ? $json : [];
        return self::$contract;
    }

    public static function canAccessModule(string $entitlementLevel, string $moduleAccess): bool
    {
        $contract = self::contract();
        $map = is_array($contract['moduleAccess'] ?? null) ? $contract['moduleAccess'] : [];
        $allowed = $map[$moduleAccess] ?? [];
        if (!is_array($allowed)) {
            return false;
        }
        return in_array($entitlementLevel, $allowed, true);
    }

    public static function accessLabel(string $moduleAccess): string
    {
        return match ($moduleAccess) {
            'free' => 'Gratuit',
            'registered' => 'Compte requis',
            'subscriber' => 'Abonné',
            'free_store' => 'Store gratuit',
            'class' => 'Classe',
            default => ucfirst($moduleAccess),
        };
    }

    /** @return array<string, mixed> */
    public static function osSessionFor(string $entitlementLevel): array
    {
        $contract = self::contract();
        $osSession = is_array($contract['osSession'] ?? null) ? $contract['osSession'] : [];
        $row = is_array($osSession[$entitlementLevel] ?? null) ? $osSession[$entitlementLevel] : [];
        return $row;
    }
}
