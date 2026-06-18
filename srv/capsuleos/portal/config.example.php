<?php

declare(strict_types=1);

return [
    'mode' => getenv('CAPSULE_PORTAL_MODE') ?: 'prod',
    'root' => dirname(__DIR__, 3),
    'views' => dirname(__DIR__, 3) . '/usr/share/capsuleos/portal/views',
    'contracts' => dirname(__DIR__, 3) . '/etc/capsuleos/contracts',
    'sqlite' => dirname(__DIR__, 3) . '/var/lib/capsuleos/portal/users.sqlite',
    'rateLimitFile' => dirname(__DIR__, 3) . '/var/lib/capsuleos/portal/rate-limit.json',
    'hmacSecret' => getenv('CAPSULE_PORTAL_HMAC_SECRET') ?: 'change-me-in-production',
    'baseUrl' => '',
];
