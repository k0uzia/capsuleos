/**
 * Écran d'accueil Mint — mintwelcome sur Mint.
 */
(function initMintwelcomeAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Écran d\'accueil Mint';

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'mintwelcome') {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function syncWindowTitle(winEl) {
        if (!winEl) {
            return;
        }
        var wmTitle = winEl.querySelector('#windowTitle');
        if (wmTitle) {
            wmTitle.textContent = WINDOW_TITLE;
        }
        winEl.setAttribute('data-title', WINDOW_TITLE);
    }

    function initMintwelcomeAppOnce() {
        var root = global.document.getElementById('mintwelcomeApp');
        if (!root || root.dataset.mintwelcomeInit === 'true') {
            return;
        }
        root.dataset.mintwelcomeInit = 'true';
        syncWindowTitle(getWindowEl(root));
    }

    global.initMintwelcomeApp = function initMintwelcomeApp() {
        initMintwelcomeAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
