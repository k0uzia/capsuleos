<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$ticketTypes = is_array($ctx->extra['ticketTypes'] ?? null) ? $ctx->extra['ticketTypes'] : [];
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
