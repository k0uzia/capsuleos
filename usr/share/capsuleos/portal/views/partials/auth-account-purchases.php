<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$purchases = is_array($ctx->extra['purchases'] ?? null) ? $ctx->extra['purchases'] : [];
?>
<section class="portal-account-panel portal-account-purchases" aria-labelledby="portal-account-purchases-title">
    <h2 class="portal-account-panel-title" id="portal-account-purchases-title">Mes achats</h2>
    <?php if ($purchases === []) : ?>
        <p class="portal-account-empty">Aucun module store acheté pour le moment.</p>
    <?php else : ?>
        <ul class="portal-account-purchase-list">
            <?php foreach ($purchases as $purchase) :
                if (!is_array($purchase)) {
                    continue;
                }
                ?>
            <li class="portal-account-purchase-item">
                <span><?= $ctx->e((string) ($purchase['module_id'] ?? '')) ?></span>
                <span class="portal-account-purchase-date"><?= $ctx->e(portal_format_date_fr((string) ($purchase['purchased_at'] ?? ''))) ?></span>
            </li>
            <?php endforeach; ?>
        </ul>
    <?php endif; ?>
</section>
