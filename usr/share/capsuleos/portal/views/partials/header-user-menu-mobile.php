<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$user = $ctx->user;
$displayName = is_array($user) ? (string) ($user['email'] ?? '') : '';
?>
<p class="header-mobile-user-name"><?= $ctx->e($displayName) ?></p>
<a class="header-mobile-menu-link" href="<?= $ctx->e(portal_entry('account.php')) ?>">Mon profil</a>
<a class="header-mobile-menu-link" href="<?= $ctx->e(portal_entry('logout.php')) ?>">Se déconnecter</a>
