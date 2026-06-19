<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$welcomeName = !empty($ctx->extra['welcomeName'])
    ? (string) $ctx->extra['welcomeName']
    : $ctx->displayName();
$planBadgeClass = $ctx->isSubscriber() ? 'portal-account-badge--plus' : 'portal-account-badge--free';
$gradeBadges = is_array($ctx->extra['gradeBadges'] ?? null) ? $ctx->extra['gradeBadges'] : [];
$extraGradeBadges = [];
foreach ($gradeBadges as $grade) {
    if (in_array($grade, ['utilisateur', 'abonne', 'visiteur'], true)) {
        continue;
    }
    $extraGradeBadges[] = $grade;
}
?>
<h1 class="portal-auth-title portal-auth-title--welcome" id="auth-title">
    <span class="portal-auth-title-line">
        Bienvenue <span class="portal-auth-title-accent"><?= $ctx->e($welcomeName) ?></span>
        <span class="portal-auth-title-badges">
            <span class="portal-account-badge portal-account-badge--title <?= $planBadgeClass ?>" data-portal-title-plan-badge><?= $ctx->e($ctx->planLabel) ?></span>
            <?php foreach ($extraGradeBadges as $grade) :
                $mod = 'portal-account-badge--' . preg_replace('/[^a-z0-9_]/', '', $grade);
                ?>
            <span class="portal-account-badge portal-account-badge--title <?= $ctx->e($mod) ?>"><?= $ctx->e(ucfirst(str_replace('_', ' ', $grade))) ?></span>
            <?php endforeach; ?>
        </span>
    </span>
</h1>
