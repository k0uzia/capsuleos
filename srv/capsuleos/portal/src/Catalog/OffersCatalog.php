<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Catalog;

use CapsuleOS\Portal\Config;

final class OffersCatalog
{
    /** @return array<string, mixed> */
    public static function load(): array
    {
        $path = Config::contracts() . '/portal-offers.json';
        if (!is_file($path)) {
            return ['plans' => [], 'currency' => 'EUR'];
        }
        $data = json_decode((string) file_get_contents($path), true);
        return is_array($data) ? $data : ['plans' => [], 'currency' => 'EUR'];
    }

    /** @return array<int, array<string, mixed>> */
    public static function plans(): array
    {
        $data = self::load();
        return is_array($data['plans'] ?? null) ? $data['plans'] : [];
    }

    /** @return array<string, mixed>|null */
    public static function planById(string $id): ?array
    {
        foreach (self::plans() as $plan) {
            if (($plan['id'] ?? '') === $id) {
                return $plan;
            }
        }
        return null;
    }
}
