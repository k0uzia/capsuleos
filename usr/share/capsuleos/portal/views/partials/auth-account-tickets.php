<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$tickets = is_array($ctx->extra['tickets'] ?? null) ? $ctx->extra['tickets'] : [];
$ticketTypes = is_array($ctx->extra['ticketTypes'] ?? null) ? $ctx->extra['ticketTypes'] : [];
$statusLabels = ['ouvert' => 'Ouvert', 'en_cours' => 'En cours', 'clos' => 'Clos'];
?>
<form class="portal-form portal-account-ticket-form" data-ticket-form>
    <label class="portal-field">
        <span class="portal-label">Type</span>
        <select class="portal-input" name="type" required>
            <?php foreach ($ticketTypes as $type) :
                if (!is_array($type)) {
                    continue;
                }
                ?>
            <option value="<?= $ctx->e((string) ($type['id'] ?? '')) ?>"<?php
                $defaultSubject = trim((string) ($type['defaultSubject'] ?? ''));
                if ($defaultSubject !== '') :
                    ?> data-default-subject="<?= $ctx->e($defaultSubject) ?>"<?php
                endif; ?>><?= $ctx->e((string) ($type['label'] ?? '')) ?></option>
            <?php endforeach; ?>
        </select>
    </label>
    <label class="portal-field">
        <span class="portal-label">Sujet</span>
        <input class="portal-input" type="text" name="subject" required maxlength="120">
    </label>
    <label class="portal-field">
        <span class="portal-label">Message</span>
        <textarea class="portal-input portal-textarea" name="body" rows="4" maxlength="2000" required></textarea>
    </label>
    <button type="submit" class="portal-submit">Envoyer</button>
</form>

<h3 class="portal-account-subtitle">Historique</h3>
<?php
$closedTickets = array_values(array_filter($tickets, static function ($ticket) {
    return is_array($ticket) && portal_ticket_is_closed((string) ($ticket['status'] ?? ''));
}));
?>
<?php if ($closedTickets === []) : ?>
    <p class="portal-account-empty" id="portal-account-tickets-empty">Aucun ticket fermé pour le moment.</p>
<?php else : ?>
    <ul class="portal-account-ticket-list" id="portal-account-ticket-list">
        <?php foreach ($closedTickets as $ticket) :
            if (!is_array($ticket)) {
                continue;
            }
            $status = (string) ($ticket['status'] ?? 'ouvert');
            ?>
        <li class="portal-account-ticket-item">
            <p class="portal-account-ticket-subject"><?= $ctx->e((string) ($ticket['subject'] ?? '')) ?></p>
            <p class="portal-account-ticket-meta">
                <span><?= $ctx->e((string) ($ticket['type'] ?? '')) ?></span> ·
                <span><?= $ctx->e($statusLabels[$status] ?? $status) ?></span> ·
                <span><?= $ctx->e(portal_format_date_fr((string) ($ticket['created_at'] ?? ''))) ?></span>
            </p>
        </li>
        <?php endforeach; ?>
    </ul>
<?php endif; ?>
