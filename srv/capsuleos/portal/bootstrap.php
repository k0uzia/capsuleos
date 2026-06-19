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
        $ctx->gradeContext,
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

/** Date de fin de période affichée dans l'abonnement (préfixe « fin le » si annulé). */
function portal_subscription_period_display(string $periodEndIso, bool $cancelAtEnd): string
{
    if ($periodEndIso === '') {
        return '-';
    }
    $formatted = portal_format_date_fr($periodEndIso);

    return $cancelAtEnd ? 'fin le ' . $formatted : $formatted;
}

/** Ticket support fermé (historique uniquement). */
function portal_ticket_is_closed(string $status): bool
{
    return in_array(strtolower($status), ['clos', 'ferme', 'fermé', 'closed'], true);
}

/** Identifiant sous-vue paramètres pour un ticket (ex. ticket-42). */
function portal_ticket_sub_id(int $ticketId): string
{
    return 'ticket-' . $ticketId;
}

/** Date et heure en français (ex. 19 juin 2026 à 14:32). */
function portal_format_datetime_fr(string $iso): string
{
    $dt = date_create($iso);
    if ($dt === false) {
        return '-';
    }

    return portal_format_date_fr($dt->format('Y-m-d')) . ' à ' . $dt->format('H:i');
}

/**
 * Badges affichés à côté du nom (forfait + grades secondaires).
 *
 * @return list<array{class: string, label: string}>
 */
function portal_account_author_badges(\CapsuleOS\Portal\PortalContext $ctx): array
{
    $badges = [[
        'class' => $ctx->isSubscriber() ? 'portal-account-badge--plus' : 'portal-account-badge--free',
        'label' => $ctx->planLabel,
    ]];
    $gradeBadges = is_array($ctx->extra['gradeBadges'] ?? null) ? $ctx->extra['gradeBadges'] : [];
    foreach ($gradeBadges as $grade) {
        if (in_array($grade, ['utilisateur', 'abonne', 'visiteur'], true)) {
            continue;
        }
        $badges[] = [
            'class' => 'portal-account-badge--' . preg_replace('/[^a-z0-9_]/', '', (string) $grade),
            'label' => ucfirst(str_replace('_', ' ', (string) $grade)),
        ];
    }

    return $badges;
}

/** Progression du cycle mensuel (0–100) jusqu'à current_period_end. */
function portal_subscription_cycle_progress(string $periodEndIso): int
{
    if ($periodEndIso === '') {
        return 0;
    }
    $end = strtotime($periodEndIso);
    if ($end === false) {
        return 0;
    }
    $start = strtotime('-1 month', $end);
    if ($start === false) {
        return 0;
    }
    $span = max(1, $end - $start);
    $elapsed = min($span, max(0, time() - $start));

    return (int) round(($elapsed / $span) * 100);
}

/**
 * Historique de facturation synthétique (en attente Stripe).
 *
 * @return list<array{date: string, amount: string}>
 */
function portal_subscription_billing_history(string $periodEndIso, string $amountDisplay = '15 €', int $count = 3): array
{
    if ($periodEndIso === '') {
        return [];
    }
    $end = date_create($periodEndIso);
    if ($end === false) {
        return [];
    }
    $out = [];
    for ($i = 0; $i < $count; $i++) {
        $anchor = clone $end;
        if ($i > 0) {
            $anchor->modify('-' . $i . ' month');
        }
        $out[] = [
            'date' => portal_format_date_fr($anchor->format('Y-m-d')),
            'amount' => $amountDisplay,
        ];
    }

    return $out;
}
