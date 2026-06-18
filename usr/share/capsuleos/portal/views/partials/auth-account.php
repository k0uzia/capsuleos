<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$user = $ctx->user;
$email = is_array($user) ? (string) ($user['email'] ?? '') : '';
$createdAt = is_array($user) ? (string) ($user['created_at'] ?? '') : '';
$memberSince = $createdAt !== '' ? portal_format_date_fr($createdAt) : '-';
$isSubscriber = $ctx->isSubscriber();
$badgeClass = $isSubscriber ? 'portal-account-badge--plus' : 'portal-account-badge--free';

$plusPlan = null;
foreach ($ctx->offers['plans'] ?? [] as $plan) {
    if (is_array($plan) && ($plan['id'] ?? '') === 'subscriber') {
        $plusPlan = $plan;
        break;
    }
}
$plusPrice = is_array($plusPlan) ? (string) ($plusPlan['priceDisplay'] ?? '15 €') : '15 €';
$plusFeatures = is_array($plusPlan) && is_array($plusPlan['features'] ?? null) ? $plusPlan['features'] : [];
$indexBase = portal_entry('index.php');
$progressItems = is_array($ctx->extra['progressItems'] ?? null) ? $ctx->extra['progressItems'] : [];
?>
<div class="portal-account">
    <header class="portal-account-header">
        <p class="portal-account-eyebrow">Espace personnel</p>
        <p class="portal-account-email"><?= $ctx->e($email) ?></p>
        <span class="portal-account-badge <?= $badgeClass ?>"><?= $ctx->e($ctx->planLabel) ?></span>
    </header>

    <nav class="portal-account-actions" aria-label="Actions du compte">
        <a class="portal-account-btn portal-account-btn--primary" href="<?= $ctx->e($indexBase) ?>#choisir-os">Explorer les systèmes</a>
        <a class="portal-account-btn portal-account-btn--ghost" href="<?= $ctx->e(portal_entry('logout.php')) ?>">Se déconnecter</a>
        <a class="portal-account-btn portal-account-btn--link" href="<?= $ctx->e($indexBase) ?>">Retour à l'accueil</a>
    </nav>

    <div class="portal-account-grid">
        <section class="portal-account-panel" aria-labelledby="portal-account-profile-title">
            <h2 class="portal-account-panel-title" id="portal-account-profile-title">Profil</h2>
            <dl class="portal-account-dl">
                <div class="portal-account-dl-row">
                    <dt>Adresse e-mail</dt>
                    <dd><?= $ctx->e($email) ?></dd>
                </div>
                <div class="portal-account-dl-row">
                    <dt>Membre depuis</dt>
                    <dd><?= $ctx->e($memberSince) ?></dd>
                </div>
            </dl>
        </section>

        <section class="portal-account-panel" aria-labelledby="portal-account-plan-title">
            <h2 class="portal-account-panel-title" id="portal-account-plan-title">Formule</h2>
            <dl class="portal-account-dl">
                <div class="portal-account-dl-row">
                    <dt>Offre actuelle</dt>
                    <dd><?= $ctx->e($ctx->planLabel) ?></dd>
                </div>
                <div class="portal-account-dl-row">
                    <dt>Statut</dt>
                    <dd>
                        <?php if ($isSubscriber) : ?>
                            <span class="portal-account-status-dot portal-account-status-dot--active" aria-hidden="true"></span>
                            Abonnement actif
                        <?php else : ?>
                            <span class="portal-account-status-dot" aria-hidden="true"></span>
                            Compte gratuit
                        <?php endif; ?>
                    </dd>
                </div>
            </dl>
        </section>
    </div>

    <section class="portal-account-panel portal-account-progress" aria-labelledby="portal-account-progress-title">
        <h2 class="portal-account-panel-title" id="portal-account-progress-title">Mes parcours sauvegardés</h2>
        <p class="portal-account-progress-lead">Votre progression est enregistrée automatiquement pendant les quêtes. Reprenez un parcours ou supprimez une sauvegarde.</p>
        <?php if ($progressItems === []) : ?>
            <p class="portal-account-progress-empty" id="portal-account-progress-empty">Aucune progression enregistrée pour le moment. Lancez un parcours depuis la <a href="<?= $ctx->e($indexBase) ?>#parcours">section Parcours</a>.</p>
        <?php else : ?>
            <ul class="portal-account-progress-list" id="portal-account-progress-list">
                <?php foreach ($progressItems as $item) :
                    if (!is_array($item)) {
                        continue;
                    }
                    ?>
                <li class="portal-account-progress-item" data-progress-row>
                    <div class="portal-account-progress-main">
                        <p class="portal-account-progress-name"><?= $ctx->e((string) ($item['title'] ?? '')) ?></p>
                        <p class="portal-account-progress-meta">
                            <?php if ((string) ($item['levelLabel'] ?? '') !== '') : ?>
                                <span><?= $ctx->e((string) $item['levelLabel']) ?></span> ·
                            <?php endif; ?>
                            <span><?= (int) ($item['doneCount'] ?? 0) ?> / <?= (int) ($item['totalCount'] ?? 0) ?> missions</span>
                            <?php if ((string) ($item['updatedAt'] ?? '') !== '-') : ?>
                                · <span>Màj. <?= $ctx->e((string) $item['updatedAt']) ?></span>
                            <?php endif; ?>
                        </p>
                        <div class="portal-account-progress-bar" role="progressbar" aria-valuenow="<?= (int) ($item['percent'] ?? 0) ?>" aria-valuemin="0" aria-valuemax="100">
                            <span class="portal-account-progress-bar-fill" style="width: <?= (int) ($item['percent'] ?? 0) ?>%"></span>
                        </div>
                    </div>
                    <div class="portal-account-progress-actions">
                        <?php if (!empty($item['resumeHref'])) : ?>
                            <a class="portal-account-btn portal-account-btn--primary portal-account-btn--compact" href="<?= $ctx->e((string) $item['resumeHref']) ?>">Reprendre</a>
                        <?php endif; ?>
                        <button type="button"
                                class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact"
                                data-progress-delete="<?= $ctx->e((string) ($item['mountId'] ?? '')) ?>"
                                data-progress-label="<?= $ctx->e((string) ($item['title'] ?? '')) ?>"
                                data-csrf="<?= $ctx->e($ctx->csrfToken) ?>">
                            Supprimer
                        </button>
                    </div>
                </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </section>

    <?php if ($isSubscriber) : ?>
        <section class="portal-account-callout portal-account-callout--success" aria-live="polite">
            <p class="portal-account-callout-title">Capsule+ est actif</p>
            <p class="portal-account-callout-text">Merci pour votre soutien. Tous les parcours et systèmes du catalogue sont accessibles avec votre compte.</p>
        </section>
    <?php else : ?>
        <section class="portal-account-upgrade" aria-labelledby="portal-account-upgrade-title">
            <div class="portal-account-upgrade-head">
                <p class="portal-account-upgrade-eyebrow">Passer à la formule complète</p>
                <h2 class="portal-account-upgrade-title" id="portal-account-upgrade-title">Capsule+</h2>
                <p class="portal-account-upgrade-price">
                    <span class="portal-account-upgrade-amount"><?= $ctx->e($plusPrice) ?></span>
                    <span class="portal-account-upgrade-period">/mois</span>
                </p>
            </div>
            <?php if ($plusFeatures !== []) : ?>
                <ul class="portal-account-upgrade-features">
                    <?php foreach ($plusFeatures as $feature) : ?>
                        <li><?= $ctx->e((string) $feature) ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
            <a class="portal-account-btn portal-account-btn--primary" href="<?= $ctx->e(portal_entry('subscribe.php')) ?>">Découvrir Capsule+</a>
        </section>
    <?php endif; ?>
</div>
