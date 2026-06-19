<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$user = $ctx->user;
$displayName = is_array($user) ? (string) ($user['email'] ?? '') : '';
$accountHref = portal_entry('account.php');
$logoutHref = portal_entry('logout.php');
$menuId = 'header-user-menu-list';
?>
<div class="header-user-menu" data-header-user-menu>
    <button type="button"
            class="header-user-menu-trigger"
            id="header-user-menu-trigger"
            aria-expanded="false"
            aria-haspopup="menu"
            aria-controls="<?= $menuId ?>">
        <span class="header-user-menu-name"><?= $ctx->e($displayName) ?></span>
        <svg class="header-user-menu-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </button>
    <div class="header-user-menu-panel" id="<?= $menuId ?>" role="menu" hidden>
        <a class="header-user-menu-item" role="menuitem" href="<?= $ctx->e($accountHref) ?>">Mon profil</a>
        <a class="header-user-menu-item" role="menuitem" href="<?= $ctx->e($logoutHref) ?>">Se déconnecter</a>
    </div>
</div>
