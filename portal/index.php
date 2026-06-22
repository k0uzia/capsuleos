<?php

declare(strict_types=1);

require __DIR__ . '/../srv/capsuleos/portal/bootstrap.php';

use CapsuleOS\Portal\PortalContext;

$extra = [];
if (!empty($_SESSION['portal_login_error'])) {
    $extra['loginError'] = (string) $_SESSION['portal_login_error'];
    unset($_SESSION['portal_login_error']);
}
if (!empty($_SESSION['portal_login_email'])) {
    $extra['loginEmail'] = (string) $_SESSION['portal_login_email'];
    unset($_SESSION['portal_login_email']);
}
if (!empty($_SESSION['portal_register_error'])) {
    $extra['registerError'] = (string) $_SESSION['portal_register_error'];
    unset($_SESSION['portal_register_error']);
}
if (!empty($_SESSION['portal_register_email'])) {
    $extra['registerEmail'] = (string) $_SESSION['portal_register_email'];
    unset($_SESSION['portal_register_email']);
}
if (isset($_SESSION['portal_register_display_name'])) {
    $extra['registerDisplayName'] = (string) $_SESSION['portal_register_display_name'];
    unset($_SESSION['portal_register_display_name']);
}
if ($extra !== []) {
    $extra['openLoginModal'] = true;
    $extra['modalView'] = !empty($extra['registerError']) ? 'register' : 'login';
}

$ctx = PortalContext::fromRequest('CapsuleOS');
if ($extra !== []) {
    $ctx = PortalContext::withExtra($ctx, $extra);
}
include CAPSULE_PORTAL_VIEWS . '/layout.php';
