<?php

declare(strict_types=1);

namespace CapsuleOS\Portal\Http;

final class SecurityHeaders
{
    public static function apply(): void
    {
        $contracts = \CapsuleOS\Portal\Config::contracts();
        $path = $contracts . '/portal-security.json';
        if (!is_file($path)) {
            return;
        }
        $json = json_decode((string) file_get_contents($path), true);
        if (!is_array($json) || !isset($json['headers']) || !is_array($json['headers'])) {
            return;
        }
        $headers = $json['headers'];
        if (!empty($headers['csp'])) {
            header('Content-Security-Policy: ' . $headers['csp']);
        }
        if (!empty($headers['referrerPolicy'])) {
            header('Referrer-Policy: ' . $headers['referrerPolicy']);
        }
        if (!empty($headers['frameOptions'])) {
            header('X-Frame-Options: ' . $headers['frameOptions']);
        }
        header('X-Content-Type-Options: nosniff');
    }
}
