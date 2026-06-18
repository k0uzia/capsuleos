<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Catalog;

use CapsuleOS\Portal\Config;

final class LegalCatalog
{
    /** @var array<string, mixed>|null */
    private static ?array $cache = null;

    /** @return array<string, mixed> */
    public static function load(): array
    {
        if (self::$cache !== null) {
            return self::$cache;
        }
        $path = Config::contracts() . '/portal-legal.json';
        if (!is_file($path)) {
            self::$cache = [];
            return self::$cache;
        }
        $json = json_decode((string) file_get_contents($path), true);
        self::$cache = is_array($json) ? $json : [];
        return self::$cache;
    }

    /** @return list<array<string, mixed>> */
    public static function sections(): array
    {
        $sections = self::load()['sections'] ?? [];
        return is_array($sections) ? $sections : [];
    }

    /** @return list<array<string, mixed>> */
    public static function footerLinks(): array
    {
        $links = self::load()['footerLinks'] ?? [];
        return is_array($links) ? $links : [];
    }

    public static function consentPrivacyAnchor(): string
    {
        return (string) (self::load()['consent']['privacyAnchor'] ?? 'protection-donnees');
    }

    public static function consentRegisterLabel(): string
    {
        return (string) (self::load()['consent']['registerLabel'] ?? 'J\'accepte la politique de confidentialité.');
    }

    public static function consentRegisterField(): string
    {
        return (string) (self::load()['consent']['registerField'] ?? 'privacy_consent');
    }
}
