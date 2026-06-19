<?php

declare(strict_types=1);

require __DIR__ . '/../../srv/capsuleos/portal/bootstrap.php';

use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\Config;
use CapsuleOS\Portal\Http\ApiJson;
use CapsuleOS\Portal\Http\Csrf;
use CapsuleOS\Portal\User\UserRepository;

header('Content-Type: application/json; charset=utf-8');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET' && ($_GET['action'] ?? '') === 'csrf') {
    ApiJson::ok(['csrf' => Csrf::token()]);
}

$userId = ApiJson::requireAuth();
$user = UserRepository::findById($userId);
if ($user === null) {
    ApiJson::error('Utilisateur introuvable', 404);
}

if ($method === 'GET') {
    $sub = UserRepository::subscription($userId);
    ApiJson::ok([
        'displayName' => (string) ($user['display_name'] ?? ''),
        'email' => (string) ($user['email'] ?? ''),
        'createdAt' => (string) ($user['created_at'] ?? ''),
        'subscription' => [
            'status' => is_array($sub) ? (string) ($sub['status'] ?? 'none') : 'none',
            'currentPeriodEnd' => is_array($sub) ? (string) ($sub['current_period_end'] ?? '') : '',
            'cancelAtPeriodEnd' => is_array($sub) && !empty($sub['cancel_at_period_end']),
        ],
    ]);
}

$payload = ApiJson::readJsonBody();
ApiJson::requireCsrf($payload);
$action = (string) ($payload['action'] ?? '');

if ($method === 'POST' && $action === 'update_profile') {
    $displayName = trim((string) ($payload['displayName'] ?? ''));
    if ($displayName !== '') {
        UserRepository::updateDisplayName($userId, $displayName);
    }
    ApiJson::ok(['ok' => true]);
}

if ($method === 'POST' && $action === 'update_email') {
    $email = trim((string) ($payload['email'] ?? ''));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        ApiJson::error('Adresse e-mail invalide');
    }
    if (!UserRepository::updateEmail($userId, $email)) {
        ApiJson::error('Cette adresse e-mail est déjà utilisée');
    }
    ApiJson::ok(['ok' => true]);
}

if ($method === 'POST' && $action === 'update_password') {
    $password = (string) ($payload['password'] ?? '');
    $minLen = 12;
    $securityPath = Config::contracts() . '/portal-security.json';
    if (is_file($securityPath)) {
        $sec = json_decode((string) file_get_contents($securityPath), true);
        if (is_array($sec)) {
            $minLen = (int) ($sec['password']['minLength'] ?? 12);
        }
    }
    if (strlen($password) < $minLen) {
        ApiJson::error('Mot de passe trop court (minimum ' . $minLen . ' caractères)');
    }
    UserRepository::updatePassword($userId, $password);
    ApiJson::ok(['ok' => true]);
}

if ($method === 'POST' && $action === 'cancel_renewal') {
    $cancel = !empty($payload['cancel']);
    UserRepository::setCancelAtPeriodEnd($userId, $cancel);
    ApiJson::ok(['ok' => true, 'cancelAtPeriodEnd' => $cancel]);
}

if ($method === 'POST' && $action === 'delete_account') {
    AuthService::logout();
    UserRepository::deleteAccount($userId);
    ApiJson::ok(['ok' => true]);
}

ApiJson::error('Action inconnue', 400);
