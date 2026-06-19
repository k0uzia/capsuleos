<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$homeHref = portal_entry('index.php') . ($ctx->isLoggedIn() ? '' : '#acceuil');
$assetBase = portal_asset('usr/share/capsuleos/assets/images/common/capsule.webp');
$indexBase = portal_entry('index.php');
?>
<header class="header">
    <nav class="header-bar" aria-label="Navigation globale">
        <div class="header-brand">
            <a class="header-home" href="<?= $ctx->e($homeHref) ?>" title="Accueil">
                <img class="header-home-icon" src="<?= $ctx->e($assetBase) ?>" alt="Logo de La Capsule">
                <span class="header-home-label">CapsuleOS</span>
            </a>
        </div>

        <button type="button" class="header-menu-toggle" aria-expanded="false" aria-controls="header-mobile-menu" id="header-menu-toggle">
            <span class="sr-only">Ouvrir le menu</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>

        <div class="header-nav-desktop">
            <a class="header-nav-link" href="<?= $ctx->e($indexBase) ?>#a-propos">À propos</a>
            <a class="header-nav-link" href="<?= $ctx->e($indexBase) ?>#offres">Offres</a>
            <a class="header-nav-link" href="<?= $ctx->e($indexBase) ?>#parcours">Parcours</a>
            <a class="header-nav-link" href="<?= $ctx->e($indexBase) ?>#choisir-os">Systèmes</a>
            <div class="header-auth">
                <?php if ($ctx->isLoggedIn()) : ?>
                    <?php include CAPSULE_PORTAL_VIEWS . '/partials/header-user-menu.php'; ?>
                <?php else : ?>
                    <?php include CAPSULE_PORTAL_VIEWS . '/partials/header-login-btn.php'; ?>
                <?php endif; ?>
            </div>
        </div>
    </nav>

    <dialog class="header-mobile-menu" id="header-mobile-menu">
        <div class="header-mobile-menu-panel">
            <div class="header-mobile-menu-head">
                <a class="header-home" href="<?= $ctx->e($indexBase) ?>" title="Accueil">
                    <img class="header-home-icon" src="<?= $ctx->e($assetBase) ?>" alt="Logo de La Capsule">
                    <span class="header-home-label">CapsuleOS</span>
                </a>
                <button type="button" class="header-menu-close" aria-label="Fermer le menu" id="header-menu-close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                        <path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            <nav class="header-mobile-menu-nav" aria-label="Menu mobile">
                <a class="header-mobile-menu-link" href="<?= $ctx->e($indexBase) ?>#a-propos">À propos</a>
                <a class="header-mobile-menu-link" href="<?= $ctx->e($indexBase) ?>#offres">Offres</a>
                <a class="header-mobile-menu-link" href="<?= $ctx->e($indexBase) ?>#parcours">Parcours</a>
                <a class="header-mobile-menu-link" href="<?= $ctx->e($indexBase) ?>#choisir-os">Systèmes</a>
                <?php if ($ctx->isLoggedIn()) : ?>
                    <?php include CAPSULE_PORTAL_VIEWS . '/partials/header-user-menu-mobile.php'; ?>
                <?php else : ?>
                    <button type="button" class="header-mobile-menu-link header-mobile-login-btn" id="header-mobile-login-btn">
                        Connexion <span aria-hidden="true">→</span>
                    </button>
                <?php endif; ?>
            </nav>
        </div>
    </dialog>
</header>
<?php include CAPSULE_PORTAL_VIEWS . '/partials/header-login-trigger.php'; ?>
