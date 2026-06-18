<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
use CapsuleOS\Portal\Auth\AuthService;
use CapsuleOS\Portal\Http\Csrf;

$loginError = (string) ($ctx->extra['loginError'] ?? '');
$loginEmail = (string) ($ctx->extra['loginEmail'] ?? '');
$registerError = (string) ($ctx->extra['registerError'] ?? '');
$registerEmail = (string) ($ctx->extra['registerEmail'] ?? '');
$openOnLoad = !empty($ctx->extra['openLoginModal']);
$modalView = (string) ($ctx->extra['modalView'] ?? 'login');
if (!in_array($modalView, ['login', 'register'], true)) {
    $modalView = 'login';
}
$minLen = AuthService::minPasswordLength();
$modalTitle = $modalView === 'register' ? 'Créer un compte' : 'Connexion';
?>
<dialog class="portal-login-modal" id="portal-login-modal" aria-labelledby="portal-login-modal-title"<?= $openOnLoad ? ' data-open-on-load' : '' ?> data-open-view="<?= $ctx->e($modalView) ?>">
    <div class="portal-login-modal-panel">
        <div class="portal-login-modal-head">
            <h2 class="portal-login-modal-title" id="portal-login-modal-title"><?= $ctx->e($modalTitle) ?></h2>
            <button type="button" class="portal-login-modal-close" id="portal-login-modal-close" aria-label="Fermer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                    <path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>

        <div class="portal-login-modal-view" data-portal-modal-view="login"<?= $modalView !== 'login' ? ' hidden' : '' ?>>
            <?php if ($loginError !== '') : ?>
                <p class="portal-auth-error" role="alert"><?= $ctx->e($loginError) ?></p>
            <?php endif; ?>
            <form class="portal-form" method="post" action="<?= $ctx->e(portal_entry('login.php')) ?>">
                <?= Csrf::input() ?>
                <input type="hidden" name="from_modal" value="1">
                <input type="hidden" name="redirect" value="<?= $ctx->e(portal_entry('index.php')) ?>">
                <label class="portal-field">
                    <span class="portal-label">Adresse e-mail</span>
                    <input class="portal-input" type="email" name="email" required autocomplete="email" value="<?= $ctx->e($loginEmail) ?>">
                </label>
                <label class="portal-field">
                    <span class="portal-label">Mot de passe</span>
                    <input class="portal-input" type="password" name="password" required autocomplete="current-password">
                </label>
                <button class="portal-submit" type="submit">Se connecter</button>
            </form>
            <p class="portal-auth-switch">Pas encore de compte ? <button type="button" class="portal-auth-switch-btn" data-portal-modal-switch="register">Créer un compte</button></p>
        </div>

        <div class="portal-login-modal-view" data-portal-modal-view="register"<?= $modalView !== 'register' ? ' hidden' : '' ?>>
            <?php if ($registerError !== '') : ?>
                <p class="portal-auth-error" role="alert"><?= $ctx->e($registerError) ?></p>
            <?php endif; ?>
            <form class="portal-form" method="post" action="<?= $ctx->e(portal_entry('register.php')) ?>">
                <?= Csrf::input() ?>
                <input type="hidden" name="from_modal" value="1">
                <label class="portal-field">
                    <span class="portal-label">Adresse e-mail</span>
                    <input class="portal-input" type="email" name="email" required autocomplete="email" value="<?= $ctx->e($registerEmail) ?>">
                </label>
                <label class="portal-field">
                    <span class="portal-label">Mot de passe (min. <?= (int) $minLen ?> caractères)</span>
                    <input class="portal-input" type="password" name="password" required autocomplete="new-password" minlength="<?= (int) $minLen ?>">
                </label>
                <label class="portal-field">
                    <span class="portal-label">Confirmer le mot de passe</span>
                    <input class="portal-input" type="password" name="password_confirm" required autocomplete="new-password" minlength="<?= (int) $minLen ?>">
                </label>
                <?php include CAPSULE_PORTAL_VIEWS . '/partials/legal-consent-field.php'; ?>
                <button class="portal-submit" type="submit">Créer mon compte</button>
            </form>
            <p class="portal-auth-switch">Déjà inscrit ? <button type="button" class="portal-auth-switch-btn" data-portal-modal-switch="login">Se connecter</button></p>
        </div>
    </div>
</dialog>
