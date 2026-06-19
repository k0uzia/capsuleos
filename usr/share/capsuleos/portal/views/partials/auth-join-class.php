<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
use CapsuleOS\Portal\Http\Csrf;

$token = (string) ($ctx->extra['token'] ?? '');
$error = (string) ($ctx->extra['error'] ?? '');
$success = (string) ($ctx->extra['success'] ?? '');
?>
<?php if ($success !== '') : ?>
    <p class="portal-auth-success" role="status"><?= $ctx->e($success) ?></p>
    <a class="portal-account-btn portal-account-btn--primary" href="<?= $ctx->e(portal_entry('account.php')) ?>">Aller à mon compte</a>
<?php elseif ($token === '') : ?>
    <p class="portal-auth-error" role="alert">Lien d'invitation manquant ou invalide.</p>
<?php else : ?>
    <?php if ($error !== '') : ?>
        <p class="portal-auth-error" role="alert"><?= $ctx->e($error) ?></p>
    <?php endif; ?>
    <p class="portal-account-panel-lead">Vous avez reçu une invitation pour rejoindre une classe. Confirmez pour débloquer la progression pédagogique.</p>
    <form class="portal-form" method="post">
        <?= Csrf::input() ?>
        <input type="hidden" name="token" value="<?= $ctx->e($token) ?>">
        <button class="portal-submit" type="submit">Rejoindre la classe</button>
    </form>
<?php endif; ?>
