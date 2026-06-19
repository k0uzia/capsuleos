<?php

declare(strict_types=1);

require __DIR__ . '/../srv/capsuleos/portal/bootstrap.php';

use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\Classroom\ClassroomRepository;
use CapsuleOS\Portal\Http\Csrf;
use CapsuleOS\Portal\PortalContext;

$token = trim((string) ($_GET['token'] ?? ''));
$error = '';
$success = '';

if (AuthService::currentUserId() === null) {
    $_SESSION['portal_join_token'] = $token;
    portal_redirect('./login.php?join=1');
}

$userId = (int) AuthService::currentUserId();
$ctx = PortalContext::fromRequest('Rejoindre une classe — CapsuleOS');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!Csrf::validate($_POST[Csrf::fieldName()] ?? null)) {
        $error = 'Session expirée. Réessayez.';
    } elseif ($token === '') {
        $error = 'Lien d\'invitation invalide.';
    } else {
        $classroom = ClassroomRepository::findByInviteToken($token);
        if ($classroom === null) {
            $error = 'Invitation invalide.';
        } elseif (strtotime((string) ($classroom['invite_expires_at'] ?? '')) < time()) {
            $error = 'Invitation expirée.';
        } elseif ((int) ($classroom['teacher_id'] ?? 0) === $userId) {
            $error = 'Vous ne pouvez pas rejoindre votre propre classe.';
        } elseif (!ClassroomRepository::addMember((int) ($classroom['id'] ?? 0), $userId)) {
            $error = 'Impossible de rejoindre la classe.';
        } else {
            $success = 'Vous avez rejoint la classe « ' . (string) ($classroom['name'] ?? '') . ' ».';
        }
    }
}

portal_render('layout-auth.php', $ctx, [
    'heading' => 'Rejoindre une classe',
    'authPartial' => 'auth-join-class.php',
    'bodyClass' => 'portal-join-class-page',
    'token' => $token,
    'error' => $error,
    'success' => $success,
]);
