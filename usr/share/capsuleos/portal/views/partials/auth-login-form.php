<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
use CapsuleOS\Portal\Http\Csrf;
?>
<form class="portal-form" method="post" action="<?= $ctx->e(portal_entry('login.php')) ?>">
    <?= Csrf::input() ?>
    <label class="portal-field">
        <span class="portal-label">Adresse e-mail</span>
        <input class="portal-input" type="email" name="email" required autocomplete="email" value="<?= $ctx->e((string) ($ctx->extra['email'] ?? '')) ?>">
    </label>
    <label class="portal-field">
        <span class="portal-label">Mot de passe</span>
        <input class="portal-input" type="password" name="password" required autocomplete="current-password">
    </label>
    <button class="portal-submit" type="submit">Se connecter</button>
</form>
<p class="portal-auth-switch">Pas encore de compte ? <a href="<?= $ctx->e(portal_entry('register.php')) ?>">Créer un compte</a></p>
<p class="portal-auth-switch"><a href="<?= $ctx->e(portal_entry('index.php')) ?>">Retour à l'accueil</a></p>
