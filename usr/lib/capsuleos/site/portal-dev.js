/**
 * Portail dev (index.html) — formulaires modale en mode démo.
 */
(function () {
    document.querySelectorAll('[data-portal-dev-stub]').forEach((el) => {
        el.addEventListener('click', (event) => {
            event.preventDefault();
            const raw = el.textContent;
            const label = raw && raw.trim ? raw.trim() : 'Cette fonctionnalité';
            window.alert(label + ' : utilisez portal/index.php avec un serveur PHP pour la version publique.');
        });
    });

    const devNotice = 'Utilisez portal/index.php avec un serveur PHP pour la version publique.';

    const loginForm = document.getElementById('portal-login-form-dev');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            window.alert('Connexion : ' + devNotice);
        });
    }

    const registerForm = document.getElementById('portal-register-form-dev');
    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            window.alert('Inscription : ' + devNotice);
        });
    }
}());
