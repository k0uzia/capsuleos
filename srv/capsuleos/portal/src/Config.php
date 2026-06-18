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
}
