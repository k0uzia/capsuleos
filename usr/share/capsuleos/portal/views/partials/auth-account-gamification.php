<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$gam = is_array($ctx->extra['gamification'] ?? null) ? $ctx->extra['gamification'] : null;
$badgeCatalog = is_array($ctx->extra['badgeCatalog'] ?? null) ? $ctx->extra['badgeCatalog'] : [];
if ($gam === null) {
    return;
}
$level = (int) ($gam['level'] ?? 1);
$percent = (int) ($gam['percent'] ?? 0);
$xpInLevel = (int) ($gam['xpInLevel'] ?? 0);
$xpForLevel = (int) ($gam['xpForLevel'] ?? 100);
$earnedCount = count($gam['badges'] ?? []);
$total = (int) ($gam['badgeTotal'] ?? 30);
$hexOffset = 100 - min(100, max(0, $percent));
$hexPath = 'M50 8 L90.693 31.5 L90.693 78.5 L50 102 L9.307 78.5 L9.307 31.5 Z';
?>
<section class="portal-account-panel portal-account-xp" aria-labelledby="portal-account-xp-title">
    <h2 class="portal-account-panel-title" id="portal-account-xp-title">Progression</h2>
    <div class="portal-account-xp-layout">
        <div class="portal-account-xp-hex-wrap" role="progressbar" aria-valuenow="<?= $percent ?>" aria-valuemin="0" aria-valuemax="100" aria-label="Progression vers le niveau <?= $ctx->e((string) ($level + 1)) ?>">
            <svg class="portal-account-xp-hex-svg" viewBox="0 0 100 110" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <path class="portal-account-xp-hex-bg" d="<?= $hexPath ?>"></path>
                <path class="portal-account-xp-hex-track" d="<?= $hexPath ?>" pathLength="100"></path>
                <path class="portal-account-xp-hex-progress" d="<?= $hexPath ?>" pathLength="100" stroke-dasharray="100" stroke-dashoffset="<?= $hexOffset ?>"></path>
            </svg>
            <span class="portal-account-xp-hex-level"><?= $level ?></span>
        </div>
        <div class="portal-account-xp-info">
            <p class="portal-account-xp-meta"><?= $xpInLevel ?> / <?= $xpForLevel ?> XP pour le niveau suivant</p>
        </div>
    </div>
    <div class="portal-account-xp-badges" aria-labelledby="portal-account-xp-badges-title">
        <h3 class="portal-account-subtitle" id="portal-account-xp-badges-title">Badges <span class="portal-account-badge-count"><?= (int) $earnedCount ?>/<?= (int) $total ?></span></h3>
        <?php if ($badgeCatalog === []) : ?>
            <p class="portal-account-empty">Aucun badge disponible pour le moment.</p>
        <?php else : ?>
            <ul class="portal-account-badge-grid">
                <?php foreach ($badgeCatalog as $badge) :
                    if (!is_array($badge)) {
                        continue;
                    }
                    $earned = !empty($badge['earned']);
                    ?>
                <li class="portal-account-badge-item<?= $earned ? ' portal-account-badge-item--earned' : ' portal-account-badge-item--locked' ?>">
                    <span class="portal-account-badge-icon" aria-hidden="true"><?= $earned ? '★' : '○' ?></span>
                    <span class="portal-account-badge-label"><?= $ctx->e((string) ($badge['label'] ?? '')) ?></span>
                    <span class="portal-account-badge-desc"><?= $ctx->e((string) ($badge['description'] ?? '')) ?></span>
                </li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
</section>
