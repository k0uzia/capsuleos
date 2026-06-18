<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$offers = $ctx->offers;
$sectionTitle = (string) ($offers['sectionTitle'] ?? 'Choisir votre formule');
$sectionLead = (string) ($offers['sectionLead'] ?? '');
$plans = is_array($offers['plans'] ?? null) ? $offers['plans'] : [];
$isStatic = ($ctx->extra['staticDev'] ?? false) === true;

/**
 * @param array<string, mixed> $plan
 */
$resolveCtaHref = static function (array $plan) use ($ctx, $isStatic): string {
    $cta = is_array($plan['cta'] ?? null) ? $plan['cta'] : [];
    $href = (string) ($cta['href'] ?? '#');
    if ($isStatic && (str_contains($href, 'subscribe') || str_contains($href, 'register'))) {
        return '#';
    }
    if (!empty($cta['requiresAuth']) && !$ctx->isLoggedIn()) {
        $fallback = (string) ($cta['fallbackHref'] ?? portal_entry('register.php'));
        return str_contains($fallback, 'register') ? portal_entry('register.php') : $fallback;
    }
    if (str_starts_with($href, '#')) {
        return $href;
    }
    if (str_contains($href, 'subscribe')) {
        return portal_entry('subscribe.php');
    }
    return $href;
};
?>
        <section class="plans" id="offres" aria-labelledby="plans-title">
            <div class="plans-inner">
                <h2 class="plans-title" id="plans-title"><?= $ctx->e($sectionTitle) ?></h2>
                <?php if ($sectionLead !== '') : ?>
                    <p class="plans-lead"><?= $ctx->e($sectionLead) ?></p>
                <?php endif; ?>
                <div class="plans-grid">
                    <?php foreach ($plans as $plan) :
                        if (!is_array($plan)) {
                            continue;
                        }
                        $planId = (string) ($plan['id'] ?? '');
                        $featured = !empty($plan['featured']);
                        $cardClass = 'plans-card plans-card--' . preg_replace('/[^a-z0-9_-]/', '', $planId);
                        if ($featured) {
                            $cardClass .= ' plans-card--featured';
                        }
                        $price = (int) ($plan['priceMonthly'] ?? 0);
                        $cta = is_array($plan['cta'] ?? null) ? $plan['cta'] : [];
                        $ctaHref = $resolveCtaHref($plan);
                        $ctaLabel = (string) ($cta['label'] ?? 'Choisir');
                        $features = is_array($plan['features'] ?? null) ? $plan['features'] : [];
                        ?>
                    <article class="<?= $cardClass ?>">
                        <?php if ($featured) : ?>
                            <p class="plans-badge">Recommandé</p>
                        <?php endif; ?>
                        <h3 class="plans-card-title"><?= $ctx->e((string) ($plan['label'] ?? '')) ?></h3>
                        <p class="plans-price">
                            <span class="plans-price-amount"><?= $ctx->e((string) ($plan['priceDisplay'] ?? $price . ' €')) ?></span>
                            <span class="plans-price-period">/mois</span>
                        </p>
                        <ul class="plans-features">
                            <?php foreach ($features as $feature) : ?>
                                <li><?= $ctx->e((string) $feature) ?></li>
                            <?php endforeach; ?>
                        </ul>
                        <a class="plans-cta<?= $featured ? ' plans-cta--primary' : '' ?>"
                           href="<?= $ctx->e($ctaHref) ?>"
                           <?php if ($isStatic && str_starts_with($ctaHref, '#')) : ?>
                               data-portal-dev-stub
                               title="Disponible avec portal/index.php (PHP)"
                           <?php endif; ?>
                        ><?= $ctx->e($ctaLabel) ?></a>
                    </article>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
