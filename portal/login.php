<?php

declare(strict_types=1);

require __DIR__ . '/../srv/capsuleos/portal/bootstrap.php';

use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\Http\Csrf;
use CapsuleOS\Portal\PortalContext;

if (AuthService::currentUserId() !== null) {
    portal_redirect('./account.php');
}

$error = '';
$email = '';
$fromModal = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = (string) ($_POST['email'] ?? '');
    $fromModal = !empty($_POST['from_modal']);
    $result = AuthService::login(
        $email,
        (string) ($_POST['password'] ?? ''),
        (string) ($_POST[Csrf::fieldName()] ?? ''),
    );
    if ($result['ok']) {
        portal_redirect('./account.php');
    }
    $error = (string) ($result['error'] ?? 'Erreur de connexion.');
    if ($fromModal) {
        $_SESSION['portal_login_error'] = $error;
        $_SESSION['portal_login_email'] = $email;
        portal_redirect('./index.php');
    }
}

$ctx = PortalContext::fromRequest('Connexion — CapsuleOS');
portal_render('layout-auth.php', $ctx, [
    'heading' => 'Connexion',
    'error' => $error,
    'email' => $email,
    'authPartial' => 'auth-login-form.php',
]);
