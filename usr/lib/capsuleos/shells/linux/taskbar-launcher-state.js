/**
 * Lanceurs panel Cinnamon — running (app ouverte) vs active-link (focus).
 * Mint uniquement : body#mint ou CAPSULE_EMBED_SKIN_KEY === 'mint'.
 */
(function initCapsuleTaskbarLauncherState(global) {
    'use strict';

    const LAUNCHER_SELECTOR = 'footer nav a[target="windowElement"]';

    function isMintPanel() {
        const bodyId = typeof document !== 'undefined' && document.body ? document.body.id : '';
        const skinKey = typeof global !== 'undefined' ? global.CAPSULE_EMBED_SKIN_KEY : '';
        return bodyId === 'mint' || skinKey === 'mint';
    }

    function isWindowVisible(container) {
        return !!(container && container.style.display !== 'none');
    }

    function syncLaunchers() {
        if (!isMintPanel()) {
            return;
        }
        document.querySelectorAll(LAUNCHER_SELECTOR).forEach((link) => {
            const slotId = link.dataset ? link.dataset.link : link.getAttribute('data-link');
            if (!slotId) {
                return;
            }
            const container = document.querySelector(`.windowElement[data-link="${slotId}"]`);
            const visible = isWindowVisible(container);
            const focused = !!(container
                && visible
                && container.classList.contains('windowElementActive'));
            link.classList.toggle('running-link', visible);
            link.classList.toggle('active-link', focused);
        });
    }

    function scheduleSync() {
        global.requestAnimationFrame(syncLaunchers);
    }

    function init() {
        if (!isMintPanel()) {
            return;
        }

        syncLaunchers();

        document.addEventListener('mousedown', (event) => {
            const target = event.target.closest('.windowElement');
            if (target) {
                scheduleSync();
            }
        });

        [
            'capsule:window-opened',
            'capsule:window-hidden',
            'capsule:window-minimized',
            'capsule:window-focused',
        ].forEach((eventName) => {
            document.addEventListener(eventName, scheduleSync);
        });

        global.CapsuleTaskbarLauncherState = {
            initialized: true,
            refresh: syncLaunchers,
        };
    }

    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }
}(typeof window !== 'undefined' ? window : globalThis));
