/**
 * Comportements fenêtre Cinnamon / Muffin pour Linux Mint (P1).
 * Double-clic barre titre, Super+flèches, dépend de CapsuleWindowMaximize.
 */
(function initCinnamonWindowBehaviors(global) {
    'use strict';

    function isMintDesktop() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function getActiveWindow() {
        return global.document.querySelector('.windowElement.windowElementActive[data-link]')
            || global.document.querySelector('.windowElement.active[data-link]');
    }

    function toggleMaximized(windowElement) {
        if (typeof global.toggleWindowMaximized === 'function') {
            global.toggleWindowMaximized(windowElement);
            return;
        }
        if (global.CapsuleWindowMaximize && global.CapsuleWindowMaximize.toggleWindowMaximized) {
            global.CapsuleWindowMaximize.toggleWindowMaximized(windowElement);
        }
    }

    function maximizeWindow(windowElement) {
        if (typeof global.maximizeWindowElement === 'function') {
            global.maximizeWindowElement(windowElement);
            return;
        }
        if (global.CapsuleWindowMaximize && global.CapsuleWindowMaximize.maximizeWindowElement) {
            global.CapsuleWindowMaximize.maximizeWindowElement(windowElement);
        }
    }

    function restoreWindow(windowElement) {
        if (typeof global.restoreWindowElement === 'function') {
            global.restoreWindowElement(windowElement);
            return;
        }
        if (global.CapsuleWindowMaximize && global.CapsuleWindowMaximize.restoreWindowElement) {
            global.CapsuleWindowMaximize.restoreWindowElement(windowElement);
        }
    }

    function minimizeWindow(windowElement) {
        if (!windowElement) {
            return;
        }
        const applyHide = () => {
            if (global.CapsuleTaskbarLauncherState
                && typeof global.CapsuleTaskbarLauncherState.markRunning === 'function') {
                global.CapsuleTaskbarLauncherState.markRunning(windowElement);
            } else if (windowElement.dataset) {
                windowElement.dataset.capsuleRunning = 'true';
            }
            windowElement.style.display = 'none';
            windowElement.style.zIndex = '5';
            windowElement.classList.remove('windowElementActive', 'active');
            if (typeof global.CustomEvent === 'function') {
                global.document.dispatchEvent(new CustomEvent('capsule:window-minimized', {
                    detail: { container: windowElement, slotId: windowElement.dataset.link },
                }));
                global.document.dispatchEvent(new CustomEvent('capsule:window-hidden', {
                    detail: { container: windowElement, slotId: windowElement.dataset.link },
                }));
            }
        };
        if (typeof global.capsuleBeforeWindowHide === 'function') {
            global.capsuleBeforeWindowHide(windowElement, applyHide);
        } else {
            applyHide();
        }
    }

    function hasSuperModifier(event) {
        return event.metaKey
            || (typeof event.getModifierState === 'function' && event.getModifierState('Super'));
    }

    function bindTitleDoubleClick() {
        global.document.addEventListener('dblclick', (event) => {
            if (!isMintDesktop()) {
                return;
            }
            const windowElement = event.target.closest('.windowElement[data-link]');
            if (!windowElement || windowElement.style.display === 'none') {
                return;
            }
            const api = global.CapsuleWindowDragTargets;
            if (api && typeof api.isTitlebarPointerTarget === 'function') {
                if (!api.isTitlebarPointerTarget(windowElement, event.target, {})) {
                    return;
                }
            } else if (event.target.closest('button, input, textarea, select, a, label')) {
                return;
            } else if (!event.target.closest('#windowHeader, [data-window-drag-handle]')) {
                return;
            }
            event.preventDefault();
            toggleMaximized(windowElement);
        });
    }

    function bindKeyboardShortcuts() {
        global.document.addEventListener('keydown', (event) => {
            if (!isMintDesktop() || !hasSuperModifier(event)) {
                return;
            }
            const windowElement = getActiveWindow();
            if (!windowElement || windowElement.style.display === 'none') {
                return;
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                maximizeWindow(windowElement);
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (windowElement.dataset.maximized === 'true') {
                    restoreWindow(windowElement);
                } else {
                    minimizeWindow(windowElement);
                }
            }
        });
    }

    function run() {
        if (!isMintDesktop()) {
            return;
        }
        bindTitleDoubleClick();
        bindKeyboardShortcuts();
    }

    if (typeof global.document !== 'undefined') {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }
}(typeof window !== 'undefined' ? window : globalThis));
