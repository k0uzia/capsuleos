/**
 * Warpinator — org.x.Warpinator sur Mint.
 */
(function initWarpinatorAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Warpinator';

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'warpinator') {
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

    function initWarpinatorAppOnce() {
        var root = global.document.getElementById('warpinatorApp');
        if (!root || root.dataset.warpinatorInit === 'true') {
            return;
        }
        root.dataset.warpinatorInit = 'true';
        syncWindowTitle(getWindowEl(root));
    }

    global.initWarpinatorApp = function initWarpinatorApp() {
        initWarpinatorAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
