<?php

declare(strict_types=1);

require __DIR__ . '/../srv/capsuleos/portal/bootstrap.php';

use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\PortalContext;

if (AuthService::currentUserId() === null) {
    portal_redirect('./register.php');
}

$ctx = PortalContext::fromRequest('Capsule+ — CapsuleOS');
portal_render('layout-auth.php', $ctx, [
    'heading' => 'Capsule+',
    'authPartial' => 'auth-subscribe.php',
]);
