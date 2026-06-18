<?php

declare(strict_types=1);

$root = dirname(__DIR__, 3);

spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'CapsuleOS\\Portal\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $path = $root . '/srv/capsuleos/portal/src/' . $relative . '.php';
    if (is_file($path)) {
        require $path;
    }
});

use CapsuleOS\Portal\Config;
use CapsuleOS\Portal\Http\SecurityHeaders;

Config::load($root);

$securityPath = Config::contracts() . '/portal-security.json';
$security = is_file($securityPath)
    ? json_decode((string) file_get_contents($securityPath), true)
    : [];
$sessionCfg = is_array($security['session'] ?? null) ? $security['session'] : [];

ini_set('session.cookie_httponly', ($sessionCfg['cookieHttpOnly'] ?? true) ? '1' : '0');
ini_set('session.cookie_samesite', (string) ($sessionCfg['cookieSameSite'] ?? 'Lax'));
if (Config::isProd() && !empty($sessionCfg['cookieSecureProduction'])) {
    ini_set('session.cookie_secure', '1');
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

SecurityHeaders::apply();

define('CAPSULE_PORTAL_ROOT', $root);
define('CAPSULE_PORTAL_VIEWS', Config::views());
define('CAPSULE_PORTAL_PUBLIC', 'portal');

/** Chemin URL depuis la racine web du dépôt vers une entrée portail (ex. portal/login.php). */
function portal_entry(string $script): string
{
    return CAPSULE_PORTAL_PUBLIC . '/' . ltrim($script, './');
}

/** Ressource statique depuis la racine du dépôt (utiliser avec &lt;base href="../"&gt;). */
function portal_asset(string $path): string
{
    return ltrim($path, './');
}

function portal_render(string $view, \CapsuleOS\Portal\PortalContext $ctx, array $extra = []): void
{
    $ctx = new \CapsuleOS\Portal\PortalContext(
        $ctx->mode,
        $ctx->user,
        $ctx->entitlementLevel,
        $ctx->planLabel,
        $ctx->offers,
        $ctx->modulesCatalog,
        $ctx->csrfToken,
        $extra['pageTitle'] ?? $ctx->pageTitle,
        $extra,
    );
    include CAPSULE_PORTAL_VIEWS . '/' . $view;
}

function portal_redirect(string $path): never
{
    header('Location: ' . $path);
    exit;
}

/** Date ISO SQLite → libellé français (ex. 18 juin 2026). */
function portal_format_date_fr(string $iso): string
{
    $dt = date_create($iso);
    if ($dt === false) {
        return '-';
    }
    static $months = [
        1 => 'janvier', 2 => 'février', 3 => 'mars', 4 => 'avril',
        5 => 'mai', 6 => 'juin', 7 => 'juillet', 8 => 'août',
        9 => 'septembre', 10 => 'octobre', 11 => 'novembre', 12 => 'décembre',
    ];
    $month = (int) $dt->format('n');
    return (int) $dt->format('j') . ' ' . ($months[$month] ?? $dt->format('m')) . ' ' . $dt->format('Y');
}
