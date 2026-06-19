<?php
/** @var \CapsuleOS\Portal\PortalContext $ctx */
$user = $ctx->user;
$displayName = is_array($user) ? trim((string) ($user['display_name'] ?? '')) : '';
$email = is_array($user) ? (string) ($user['email'] ?? '') : '';
?>
<div class="portal-account-settings-modal">
    <section class="portal-account-settings-block" aria-labelledby="portal-settings-identity-title">
        <h3 class="portal-account-settings-block-title" id="portal-settings-identity-title">Identité</h3>
        <form class="portal-account-settings-row-form" data-settings-name>
            <label class="portal-field">
                <span class="portal-label">Nom affiché</span>
                <input class="portal-input" type="text" name="displayName" required maxlength="60" value="<?= $ctx->e($displayName) ?>" autocomplete="name">
            </label>
            <button type="submit" class="portal-account-btn portal-account-btn--primary portal-account-btn--compact">Enregistrer</button>
        </form>
    </section>

    <section class="portal-account-settings-block" aria-labelledby="portal-settings-login-title">
        <h3 class="portal-account-settings-block-title" id="portal-settings-login-title">Connexion</h3>
        <form class="portal-account-settings-row-form" data-settings-email>
            <label class="portal-field">
                <span class="portal-label">Adresse e-mail</span>
                <input class="portal-input" type="email" name="email" required autocomplete="email" value="<?= $ctx->e($email) ?>">
            </label>
            <button type="submit" class="portal-account-btn portal-account-btn--primary portal-account-btn--compact">Mettre à jour</button>
        </form>
        <form class="portal-account-settings-row-form portal-account-settings-row-form--stacked" data-settings-password>
            <label class="portal-field">
                <span class="portal-label">Nouveau mot de passe</span>
                <input class="portal-input" type="password" name="password" required autocomplete="new-password" minlength="12" placeholder="12 caractères minimum">
            </label>
            <button type="submit" class="portal-account-btn portal-account-btn--primary portal-account-btn--compact">Changer</button>
        </form>
    </section>

    <p class="portal-account-settings-note">Réinitialisation par e-mail : fonctionnalité à venir.</p>

    <section class="portal-account-settings-block portal-account-settings-block--danger" aria-labelledby="portal-settings-danger-title">
        <h3 class="portal-account-settings-block-title" id="portal-settings-danger-title">Zone sensible</h3>
        <p class="portal-account-settings-block-lead">La suppression est définitive et retire toutes vos données du portail.</p>
        <button type="button" class="portal-account-btn portal-account-btn--danger portal-account-btn--compact" data-account-delete>Supprimer mon compte</button>
    </section>
</div>
