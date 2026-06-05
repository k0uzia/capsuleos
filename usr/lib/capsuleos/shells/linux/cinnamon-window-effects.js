/**
 * Animations ouverture / fermeture fenêtres — Linux Mint (Muffin / Cinnamon).
 */
(function initCinnamonWindowEffects(global) {
    'use strict';

    const ANIM_MS = 180;

    function isMintDesktop() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function runOpenAnimation(windowElement) {
        if (!windowElement) {
            return;
        }
        windowElement.classList.remove('capsule-window--animate-out');
        windowElement.classList.add('capsule-window--animate-in');
        const cleanup = () => {
            windowElement.classList.remove('capsule-window--animate-in');
        };
        windowElement.addEventListener('animationend', cleanup, { once: true });
        global.setTimeout(cleanup, ANIM_MS + 40);
    }

    function runCloseAnimation(windowElement, done) {
        if (!windowElement || typeof done !== 'function') {
            return;
        }
        windowElement.classList.remove('capsule-window--animate-in');
        windowElement.classList.add('capsule-window--animate-out');
        let finished = false;
        const finish = () => {
            if (finished) {
                return;
            }
            finished = true;
            windowElement.classList.remove('capsule-window--animate-out');
            done();
        };
        windowElement.addEventListener('animationend', finish, { once: true });
        global.setTimeout(finish, ANIM_MS + 40);
    }

    global.capsuleBeforeWindowHide = function (windowElement, done) {
        if (!isMintDesktop()) {
            done();
            return;
        }
        runCloseAnimation(windowElement, done);
    };

    function bindOpenEvents() {
        global.document.addEventListener('capsule:window-opened', (event) => {
            if (!isMintDesktop()) {
                return;
            }
            const container = event.detail && event.detail.container;
            runOpenAnimation(container);
        });
    }

    function run() {
        if (!isMintDesktop()) {
            return;
        }
        bindOpenEvents();
    }

    if (typeof global.document !== 'undefined') {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }
}(typeof window !== 'undefined' ? window : globalThis));
