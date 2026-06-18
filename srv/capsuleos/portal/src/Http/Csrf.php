<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Http;

final class Csrf
{
    private const SESSION_KEY = 'capsule_portal_csrf';

    public static function token(): string
    {
        if (empty($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = bin2hex(random_bytes(32));
        }
        return (string) $_SESSION[self::SESSION_KEY];
    }

    public static function fieldName(): string
    {
        return '_csrf';
    }

    public static function validate(?string $token): bool
    {
        $expected = $_SESSION[self::SESSION_KEY] ?? '';
        if ($expected === '' || $token === null || $token === '') {
            return false;
        }
        return hash_equals($expected, $token);
    }

    public static function input(): string
    {
        $name = self::fieldName();
        $value = htmlspecialchars(self::token(), ENT_QUOTES, 'UTF-8');
        return '<input type="hidden" name="' . $name . '" value="' . $value . '">';
    }
}
