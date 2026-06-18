/**
 * Modale portail — connexion / inscription (bascule in-modal).
 */
(function () {
    const modal = document.getElementById('portal-login-modal');
    const openButtons = [
        document.getElementById('header-login-btn'),
        document.getElementById('header-mobile-login-btn'),
    ].filter(Boolean);
    const closeBtn = document.getElementById('portal-login-modal-close');
    const mobileMenu = document.getElementById('header-mobile-menu');
    const titleEl = document.getElementById('portal-login-modal-title');

    if (!modal || openButtons.length === 0) {
        return;
    }

    const VIEW_LABELS = {
        login: 'Connexion',
        register: 'Créer un compte',
    };

    const switchView = (view) => {
        const target = VIEW_LABELS[view] ? view : 'login';
        modal.querySelectorAll('[data-portal-modal-view]').forEach((panel) => {
            panel.hidden = panel.getAttribute('data-portal-modal-view') !== target;
        });
        if (titleEl) {
            titleEl.textContent = VIEW_LABELS[target];
        }
        modal.setAttribute('data-active-view', target);
    };

    const closeMobileMenu = () => {
        if (mobileMenu && mobileMenu.open) {
            mobileMenu.close();
            const toggle = document.getElementById('header-menu-toggle');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
        }
    };

    const openModal = (view) => {
        closeMobileMenu();
        const initial = view || modal.getAttribute('data-open-view') || 'login';
        switchView(initial);
        if (typeof modal.showModal === 'function') {
            modal.showModal();
        }
    };

    const closeModal = () => {
        if (modal.open) {
            modal.close();
        }
        switchView('login');
    };

    openButtons.forEach((btn) => {
        btn.addEventListener('click', () => openModal('login'));
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    modal.addEventListener('click', (event) => {
        const switchBtn = event.target.closest('[data-portal-modal-switch]');
        if (!switchBtn) {
            return;
        }
        event.preventDefault();
        switchView(switchBtn.getAttribute('data-portal-modal-switch'));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.open) {
            closeModal();
        }
    });

    if (modal.hasAttribute('data-open-on-load')) {
        requestAnimationFrame(() => openModal());
    }
}());
