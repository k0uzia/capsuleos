<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$allTickets = is_array($ctx->extra['tickets'] ?? null) ? $ctx->extra['tickets'] : [];
$openTickets = [];
foreach ($allTickets as $ticket) {
    if (!is_array($ticket)) {
        continue;
    }
    if (portal_ticket_is_closed((string) ($ticket['status'] ?? ''))) {
        continue;
    }
    $openTickets[] = $ticket;
}
usort($openTickets, static function (array $a, array $b): int {
    return (int) ($a['id'] ?? 0) <=> (int) ($b['id'] ?? 0);
});
?>
<section class="portal-account-panel portal-account-settings-view" aria-labelledby="portal-account-settings-view-title">
    <h2 class="portal-account-panel-title portal-account-panel-title--visually-hidden" id="portal-account-settings-view-title">Paramètres</h2>
    <nav class="portal-account-subnav" aria-label="Paramètres du compte">
        <ul class="portal-account-subnav-list" role="tablist">
            <li class="portal-account-subnav-item" role="presentation">
                <button type="button" class="portal-account-subnav-link portal-account-subnav-link--active" role="tab"
                    id="portal-account-subnav-subscription" aria-controls="account-subview-subscription"
                    aria-selected="true" data-account-sub-nav="subscription">Abonnement</button>
            </li>
            <li class="portal-account-subnav-item" role="presentation">
                <button type="button" class="portal-account-subnav-link" role="tab"
                    id="portal-account-subnav-account" aria-controls="account-subview-account"
                    aria-selected="false" data-account-sub-nav="account" tabindex="-1">Compte</button>
            </li>
            <li class="portal-account-subnav-item" role="presentation">
                <button type="button" class="portal-account-subnav-link" role="tab"
                    id="portal-account-subnav-support" aria-controls="account-subview-support"
                    aria-selected="false" data-account-sub-nav="support" tabindex="-1">Support</button>
            </li>
            <?php foreach ($openTickets as $ticket) :
                $ticketId = (int) ($ticket['id'] ?? 0);
                $subId = portal_ticket_sub_id($ticketId);
                ?>
            <li class="portal-account-subnav-item" role="presentation" data-ticket-subnav-item>
                <button type="button" class="portal-account-subnav-link portal-account-subnav-link--ticket" role="tab"
                    id="portal-account-subnav-<?= $ctx->e($subId) ?>" aria-controls="account-subview-<?= $ctx->e($subId) ?>"
                    aria-selected="false" data-account-sub-nav="<?= $ctx->e($subId) ?>" tabindex="-1">Ticket <?= (int) $ticketId ?></button>
            </li>
            <?php endforeach; ?>
        </ul>
    </nav>
    <div class="portal-account-subviews">
        <div class="portal-account-subview" id="account-subview-subscription" data-account-sub-view="subscription"
            role="tabpanel" aria-labelledby="portal-account-subnav-subscription">
            <?php include CAPSULE_PORTAL_VIEWS . '/partials/auth-account-subscription-settings.php'; ?>
        </div>
        <div class="portal-account-subview" id="account-subview-account" data-account-sub-view="account" hidden
            role="tabpanel" aria-labelledby="portal-account-subnav-account">
            <section class="portal-account-panel" aria-labelledby="portal-account-account-settings-title">
                <h2 class="portal-account-panel-title" id="portal-account-account-settings-title">Compte</h2>
                <?php include CAPSULE_PORTAL_VIEWS . '/partials/auth-account-settings.php'; ?>
            </section>
        </div>
        <div class="portal-account-subview" id="account-subview-support" data-account-sub-view="support" hidden
            role="tabpanel" aria-labelledby="portal-account-subnav-support">
            <section class="portal-account-panel" aria-labelledby="portal-account-support-title">
                <h2 class="portal-account-panel-title" id="portal-account-support-title">Support</h2>
                <?php include CAPSULE_PORTAL_VIEWS . '/partials/auth-account-tickets.php'; ?>
            </section>
        </div>
        <?php foreach ($openTickets as $ticket) {
            include CAPSULE_PORTAL_VIEWS . '/partials/auth-account-ticket-thread.php';
        } ?>
    </div>
</section>
