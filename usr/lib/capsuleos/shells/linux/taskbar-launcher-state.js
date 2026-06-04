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

    function isWindowRunning(container) {
        return !!(container && container.dataset.capsuleRunning === 'true');
    }

    function markWindowRunning(container) {
        if (container) {
            container.dataset.capsuleRunning = 'true';
        }
    }

    function clearWindowRunning(container) {
        if (container && container.dataset) {
            delete container.dataset.capsuleRunning;
        }
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
            const running = isWindowRunning(container);
            const focused = !!(container
                && visible
                && container.classList.contains('windowElementActive'));
            link.classList.toggle('running-link', running);
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

        document.addEventListener('capsule:window-opened', (event) => {
            const container = event.detail ? event.detail.container : null;
            markWindowRunning(container);
            scheduleSync();
        });

        document.addEventListener('capsule:window-closed', (event) => {
            const container = event.detail ? event.detail.container : null;
            clearWindowRunning(container);
            scheduleSync();
        });

        [
            'capsule:window-hidden',
            'capsule:window-minimized',
            'capsule:window-focused',
        ].forEach((eventName) => {
            document.addEventListener(eventName, scheduleSync);
        });

        global.CapsuleTaskbarLauncherState = {
            initialized: true,
            refresh: syncLaunchers,
            markRunning: markWindowRunning,
            clearRunning: clearWindowRunning,
        };
    }

    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }
}(typeof window !== 'undefined' ? window : globalThis));
