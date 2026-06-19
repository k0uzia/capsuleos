/**
 * Portail dev (index.html, account.html) — connexion locale et persistance.
 */
(function () {
    'use strict';

    var DEV_USER = window.CAPSULE_PORTAL_DEV_USER || 'test';
    var DEV_PASSWORD = window.CAPSULE_PORTAL_DEV_PASSWORD || 'test123456789';
    var SESSION_KEY = 'capsule_portal_dev_session';
    var HOME_URL = './index.html';
    var ACCOUNT_URL = './account.html';

    function devDisplayName() {
        if (window.CapsulePortalDevStore) {
            var state = window.CapsulePortalDevStore.load();
            if (state.displayName) {
                return state.displayName;
            }
            if (state.email) {
                return state.email;
            }
        }
        return DEV_USER;
    }

    function isAccountPage() {
        return /(?:^|\/)account\.html$/i.test(window.location.pathname);
    }

    function isLoggedIn() {
        return sessionStorage.getItem(SESSION_KEY) === '1';
    }

    function setLoggedIn(on) {
        if (on) {
            sessionStorage.setItem(SESSION_KEY, '1');
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
        syncAuthUi();
    }

    function logout() {
        setLoggedIn(false);
        window.location.href = HOME_URL;
    }

    if (isAccountPage() && !isLoggedIn()) {
        window.location.replace(HOME_URL);
        return;
    }

    function syncAuthUi() {
        var loggedIn = isLoggedIn();
        var label = devDisplayName();
        document.querySelectorAll('[data-portal-auth-guest]').forEach(function (el) {
            el.hidden = loggedIn;
        });
        document.querySelectorAll('[data-portal-auth-user]').forEach(function (el) {
            el.hidden = !loggedIn;
        });
        document.querySelectorAll('[data-portal-auth-username], .header-user-menu-name, .header-mobile-user-name').forEach(function (el) {
            el.textContent = label;
        });
        document.querySelectorAll('[data-portal-account-email]').forEach(function (el) {
            if (window.CapsulePortalDevStore) {
                el.textContent = window.CapsulePortalDevStore.load().email || DEV_USER;
            } else {
                el.textContent = DEV_USER;
            }
        });
        document.querySelectorAll('[data-portal-account-name]').forEach(function (el) {
            el.textContent = label;
        });
        if (isAccountPage()) {
            document.title = 'Bienvenue ' + label + ' — CapsuleOS';
        }
    }

    document.querySelectorAll('[data-portal-dev-logout]').forEach(function (btn) {
        btn.addEventListener('click', logout);
    });

    document.querySelectorAll('[data-portal-dev-stub]').forEach(function (el) {
        if (el.closest('[data-portal-account-dev]')) {
            return;
        }
        el.addEventListener('click', function (event) {
            event.preventDefault();
            var raw = el.textContent;
            var text = raw && raw.trim ? raw.trim() : 'Cette fonctionnalité';
            window.alert(text + ' : utilisez portal/index.php avec un serveur PHP pour la version publique.');
        });
    });

    var loginForm = document.getElementById('portal-login-form-dev');
    if (loginForm) {
        var emailInput = loginForm.querySelector('[name="email"]');
        var passwordInput = loginForm.querySelector('[name="password"]');
        if (emailInput && !emailInput.value) {
            emailInput.value = DEV_USER;
        }
        if (passwordInput && !passwordInput.value) {
            passwordInput.value = DEV_PASSWORD;
        }

        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var email = emailInput ? String(emailInput.value).trim() : '';
            var password = passwordInput ? String(passwordInput.value) : '';
            if (email === DEV_USER && password === DEV_PASSWORD) {
                setLoggedIn(true);
                var modal = document.getElementById('portal-login-modal');
                if (modal && modal.open && typeof modal.close === 'function') {
                    modal.close();
                }
                return;
            }
            window.alert('Identifiants incorrects. Mode dev : ' + DEV_USER + ' / ' + DEV_PASSWORD);
        });
    }

    var registerForm = document.getElementById('portal-register-form-dev');
    if (registerForm) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault();
            window.alert('Inscription simulée : connectez-vous avec ' + DEV_USER + ' / ' + DEV_PASSWORD);
            setLoggedIn(true);
        });
    }

    syncAuthUi();
}());
