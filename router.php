<?php

declare(strict_types=1);

/**
 * Routeur PHP built-in server (make prod).
 * Usage : php -S 127.0.0.1:8080 -t . router.php
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$root = __DIR__;
$file = $root . $uri;

if ($uri === '/' || $uri === '/index.html') {
    require $root . '/index.php';
    return true;
}

if (is_file($file)) {
    return false;
}

if (str_ends_with($uri, '.php')) {
    $script = $root . $uri;
    if (is_file($script)) {
        require $script;
        return true;
    }
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo "404 — {$uri}\n";
return true;
