<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
use CapsuleOS\Portal\Config;
use CapsuleOS\Portal\Http\Csrf;

$devCreds = Config::allowsLocalPreview() ? Config::devCredentials() : null;
$emailValue = (string) ($ctx->extra['email'] ?? ($devCreds ? $devCreds['defaultUser'] : ''));
?>
<form class="portal-form" method="post" action="<?= $ctx->e(portal_entry('login.php')) ?>">
    <?= Csrf::input() ?>
    <label class="portal-field">
        <span class="portal-label"><?= Config::allowsLocalPreview() ? 'Identifiant' : 'Adresse e-mail' ?></span>
        <input class="portal-input" type="<?= Config::allowsLocalPreview() ? 'text' : 'email' ?>" name="email" required autocomplete="<?= Config::allowsLocalPreview() ? 'username' : 'email' ?>" value="<?= $ctx->e($emailValue) ?>">
    </label>
    <label class="portal-field">
        <span class="portal-label">Mot de passe</span>
        <input class="portal-input" type="password" name="password" required autocomplete="current-password"<?= $devCreds ? ' value="' . $ctx->e($devCreds['defaultPassword']) . '"' : '' ?>>
    </label>
    <button class="portal-submit" type="submit">Se connecter</button>
</form>
<p class="portal-auth-switch">Pas encore de compte ? <a href="<?= $ctx->e(portal_entry('register.php')) ?>">Créer un compte</a></p>
<p class="portal-auth-switch"><a href="<?= $ctx->e(portal_entry('index.php')) ?>">Retour à l'accueil</a></p>
