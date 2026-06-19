<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Http;

use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\Http\Csrf;

final class ApiJson
{
    public static function requireAuth(): int
    {
        header('Content-Type: application/json; charset=utf-8');
        $userId = AuthService::currentUserId();
        if ($userId === null) {
            http_response_code(401);
            echo json_encode(['error' => 'Non connecté'], JSON_THROW_ON_ERROR);
            exit;
        }
        return $userId;
    }

    /** @return array<string, mixed> */
    public static function readJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw !== false ? $raw : '', true);
        return is_array($payload) ? $payload : [];
    }

    public static function requireCsrf(?array $payload = null): void
    {
        if ($payload === null) {
            $payload = array_merge($_POST, self::readJsonBody());
        }
        $token = $payload[Csrf::fieldName()] ?? null;
        if ($token === null && isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
            $token = $_SERVER['HTTP_X_CSRF_TOKEN'];
        }
        if (!Csrf::validate($token)) {
            http_response_code(403);
            echo json_encode(['error' => 'CSRF invalide'], JSON_THROW_ON_ERROR);
            exit;
        }
    }

    /** @param array<string, mixed> $data */
    public static function ok(array $data, int $code = 200): never
    {
        http_response_code($code);
        echo json_encode($data, JSON_THROW_ON_ERROR);
        exit;
    }

    public static function error(string $message, int $code = 400): never
    {
        http_response_code($code);
        echo json_encode(['error' => $message], JSON_THROW_ON_ERROR);
        exit;
    }
}
