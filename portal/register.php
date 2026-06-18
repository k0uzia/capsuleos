<?php

declare(strict_types=1);

require __DIR__ . '/../srv/capsuleos/portal/bootstrap.php';

use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\Catalog\LegalCatalog;
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
    $result = AuthService::register(
        $email,
        (string) ($_POST['password'] ?? ''),
        (string) ($_POST['password_confirm'] ?? ''),
        (string) ($_POST[Csrf::fieldName()] ?? ''),
        !empty($_POST[LegalCatalog::consentRegisterField()]),
    );
    if ($result['ok']) {
        portal_redirect('./account.php');
    }
    $error = (string) ($result['error'] ?? 'Erreur lors de la création du compte.');
    if ($fromModal) {
        $_SESSION['portal_register_error'] = $error;
        $_SESSION['portal_register_email'] = $email;
        portal_redirect('./index.php');
    }
}

$ctx = PortalContext::fromRequest('Créer un compte — CapsuleOS');
portal_render('layout-auth.php', $ctx, [
    'heading' => 'Créer un compte',
    'error' => $error,
    'email' => $email,
    'authPartial' => 'auth-register-form.php',
]);
