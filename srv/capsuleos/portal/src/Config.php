<?php

declare(strict_types=1);

namespace CapsuleOS\Portal;

final class Config
{
    /** @var array<string, mixed> */
    private static array $data = [];

    public static function load(string $root): void
    {
        $example = $root . '/srv/capsuleos/portal/config.example.php';
        $local = $root . '/srv/capsuleos/portal/config.php';
        $base = is_file($local) ? require $local : require $example;
        if (!is_array($base)) {
            throw new \RuntimeException('Configuration portail invalide');
        }
        self::$data = $base;
        self::$data['root'] = $root;
        self::$data['views'] = $root . '/usr/share/capsuleos/portal/views';
        self::$data['contracts'] = $root . '/etc/capsuleos/contracts';
    }

    /** @return mixed */
    public static function get(string $key, mixed $default = null): mixed
    {
        return self::$data[$key] ?? $default;
    }

    public static function root(): string
    {
        return (string) self::get('root', '');
    }

    public static function views(): string
    {
        return (string) self::get('views', '');
    }

    public static function contracts(): string
    {
        return (string) self::get('contracts', '');
    }

    public static function sqlite(): string
    {
        return (string) self::get('sqlite', '');
    }

    public static function mode(): string
    {
        return (string) self::get('mode', 'prod');
    }

    public static function isProd(): bool
    {
        return self::mode() === 'prod';
    }

    public static function isDev(): bool
    {
        return self::mode() === 'dev';
    }

    /** Profil local make prod-sub|prof|creator (CAPSULE_PORTAL_PROD_PROFILE). */
    public static function prodProfile(): ?string
    {
        $raw = getenv('CAPSULE_PORTAL_PROD_PROFILE');
        if (!is_string($raw) || trim($raw) === '') {
            return null;
        }
        return strtolower(trim($raw));
    }

    /** Grade simulé pour prod local (sub → abonne, prof → professeur, creator → createur). */
    public static function prodProfileGrade(): ?string
    {
        $profile = self::prodProfile();
        if ($profile === null) {
            return null;
        }
        $map = [
            'sub' => 'abonne',
            'abonne' => 'abonne',
            'prof' => 'professeur',
            'professeur' => 'professeur',
            'creator' => 'createur',
            'createur' => 'createur',
        ];
        return $map[$profile] ?? null;
    }

    /** Prévisualisation locale : identifiants test + simulation de grade. */
    public static function allowsLocalPreview(): bool
    {
        return self::isDev() || self::prodProfileGrade() !== null;
    }

    /** @return array{defaultUser: string, defaultPassword: string} */
    public static function devCredentials(): array
    {
        $path = self::contracts() . '/portal-security.json';
        $defaults = ['defaultUser' => 'test', 'defaultPassword' => 'test123456789'];
        if (!is_file($path)) {
            return $defaults;
        }
        $json = json_decode((string) file_get_contents($path), true);
        $dev = is_array($json['dev'] ?? null) ? $json['dev'] : [];
        return [
            'defaultUser' => (string) ($dev['defaultUser'] ?? $defaults['defaultUser']),
            'defaultPassword' => (string) ($dev['defaultPassword'] ?? $defaults['defaultPassword']),
        ];
    }
}
