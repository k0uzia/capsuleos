<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Auth;

use CapsuleOS\Portal\Config;
use CapsuleOS\Portal\Http\Csrf;
use CapsuleOS\Portal\Http\RateLimiter;
use CapsuleOS\Portal\User\UserRepository;

final class AuthService
{
    private const SESSION_USER = 'capsule_portal_user_id';

    public static function minPasswordLength(): int
    {
        $path = Config::contracts() . '/portal-security.json';
        if (!is_file($path)) {
            return 12;
        }
        $json = json_decode((string) file_get_contents($path), true);
        return (int) ($json['password']['minLength'] ?? 12);
    }

    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_ARGON2ID);
    }

    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /** @return array{ok: bool, error?: string} */
    public static function register(string $email, string $password, string $passwordConfirm, ?string $csrf, bool $privacyConsent = false): array
    {
        if (!Csrf::validate($csrf)) {
            return ['ok' => false, 'error' => 'Session expirée. Réessayez.'];
        }
        if (!$privacyConsent) {
            return ['ok' => false, 'error' => 'Vous devez accepter la politique de confidentialité pour créer un compte.'];
        }
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!RateLimiter::check('register', $ip . ':' . strtolower($email))) {
            return ['ok' => false, 'error' => 'Trop de tentatives. Réessayez plus tard.'];
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['ok' => false, 'error' => 'Adresse e-mail invalide.'];
        }
        $min = self::minPasswordLength();
        if (strlen($password) < $min) {
            return ['ok' => false, 'error' => "Le mot de passe doit contenir au moins {$min} caractères."];
        }
        if ($password !== $passwordConfirm) {
            return ['ok' => false, 'error' => 'Les mots de passe ne correspondent pas.'];
        }
        if (UserRepository::findByEmail($email) !== null) {
            return ['ok' => false, 'error' => 'Identifiants incorrects.'];
        }
        $hash = self::hashPassword($password);
        $userId = UserRepository::create($email, $hash);
        self::loginUserId($userId);
        return ['ok' => true];
    }

    /** @return array{ok: bool, error?: string} */
    public static function login(string $email, string $password, ?string $csrf): array
    {
        if (!Csrf::validate($csrf)) {
            return ['ok' => false, 'error' => 'Session expirée. Réessayez.'];
        }
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        if (!RateLimiter::check('login', $ip . ':' . strtolower($email))) {
            return ['ok' => false, 'error' => 'Trop de tentatives. Réessayez plus tard.'];
        }
        $user = UserRepository::findByEmail($email);
        if ($user === null || !self::verifyPassword($password, (string) $user['password_hash'])) {
            return ['ok' => false, 'error' => 'Identifiants incorrects.'];
        }
        self::loginUserId((int) $user['id']);
        return ['ok' => true];
    }

    public static function loginUserId(int $userId): void
    {
        session_regenerate_id(true);
        $_SESSION[self::SESSION_USER] = $userId;
        $_SESSION['capsule_portal_login_at'] = time();
    }

    public static function logout(): void
    {
        unset($_SESSION[self::SESSION_USER], $_SESSION['capsule_portal_login_at']);
        session_regenerate_id(true);
    }

    public static function currentUserId(): ?int
    {
        $id = $_SESSION[self::SESSION_USER] ?? null;
        return is_int($id) ? $id : (is_numeric($id) ? (int) $id : null);
    }

    /** @return array<string, mixed>|null */
    public static function currentUser(): ?array
    {
        $id = self::currentUserId();
        if ($id === null) {
            return null;
        }
        return UserRepository::findById($id);
    }
}
