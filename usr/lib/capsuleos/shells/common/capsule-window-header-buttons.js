/**
 * Boutons chrome fenêtre (fermer, réduire, maximiser) — Linux, macOS, Windows.
 */
(function initCapsuleWindowHeaderButtons(global) {
    'use strict';

    function getWindowDesktopRect() {
        if (typeof global.CapsuleWindow !== 'undefined' && global.CapsuleWindow.getWorkAreaRect) {
            return global.CapsuleWindow.getWorkAreaRect();
        }
        const desktop = document.getElementById('desktop');
        return desktop ? desktop.getBoundingClientRect() : null;
    }

    function storeWindowRestoreState(windowElement) {
        if (typeof global.CapsuleWindowMaximize !== 'undefined'
            && global.CapsuleWindowMaximize.storeRestoreState) {
            global.CapsuleWindowMaximize.storeRestoreState(windowElement);
            return;
        }
        if (!windowElement || windowElement.dataset.maximized === 'true') {
            return;
        }
        windowElement.dataset.prevLeft = windowElement.style.left || '';
        windowElement.dataset.prevTop = windowElement.style.top || '';
        windowElement.dataset.prevWidth = windowElement.style.width || '';
        windowElement.dataset.prevHeight = windowElement.style.height || '';
        windowElement.dataset.prevPosition = windowElement.style.position || '';
    }

    function restoreWindowElement(windowElement) {
        if (typeof global.CapsuleWindow !== 'undefined' && global.CapsuleWindow.restoreWindowElement) {
            return global.CapsuleWindow.restoreWindowElement(windowElement);
        }
        if (!windowElement) {
            return false;
        }
        windowElement.style.width = windowElement.dataset.prevWidth || '';
        windowElement.style.height = windowElement.dataset.prevHeight || '';
        windowElement.style.position = windowElement.dataset.prevPosition || 'fixed';
        windowElement.style.top = windowElement.dataset.prevTop || '';
        windowElement.style.left = windowElement.dataset.prevLeft || '';
        windowElement.dataset.maximized = 'false';
        return true;
    }

    function maximizeWindowElement(windowElement) {
        if (typeof global.CapsuleWindow !== 'undefined' && global.CapsuleWindow.maximizeWindowElement) {
            return global.CapsuleWindow.maximizeWindowElement(windowElement);
        }
        if (!windowElement) {
            return false;
        }
        const desktopRect = getWindowDesktopRect();
        storeWindowRestoreState(windowElement);
        windowElement.style.position = 'fixed';
        windowElement.style.left = desktopRect ? `${desktopRect.left}px` : '0';
        windowElement.style.top = desktopRect ? `${desktopRect.top}px` : '0';
        windowElement.style.width = desktopRect ? `${desktopRect.width}px` : '100%';
        windowElement.style.height = desktopRect ? `${desktopRect.height}px` : '100%';
        windowElement.dataset.maximized = 'true';
        return true;
    }

    function toggleWindowMaximized(windowElement) {
        if (typeof global.CapsuleWindow !== 'undefined' && global.CapsuleWindow.toggleWindowMaximized) {
            return global.CapsuleWindow.toggleWindowMaximized(windowElement);
        }
        if (!windowElement) {
            return false;
        }
        if (windowElement.dataset.maximized === 'true') {
            return restoreWindowElement(windowElement);
        }
        return maximizeWindowElement(windowElement);
    }

    global.restoreWindowElement = restoreWindowElement;
    global.maximizeWindowElement = maximizeWindowElement;
    global.toggleWindowMaximized = toggleWindowMaximized;

    function resolveWindowFromTarget(target) {
        return target.closest('.windowElement, .win-window, #windowContainer');
    }

    function hideWindowElement(windowElement) {
        const applyHide = () => {
            windowElement.style.display = 'none';
            windowElement.style.zIndex = '5';
            windowElement.classList.remove('windowElementActive');
            windowElement.classList.remove('active');

            if (typeof global.CustomEvent === 'function') {
                global.document.dispatchEvent(new CustomEvent('capsule:window-hidden', {
                    detail: {
                        container: windowElement,
                        slotId: windowElement.dataset.link,
                    },
                }));
            }
        };

        if (typeof global.capsuleBeforeWindowHide === 'function') {
            global.capsuleBeforeWindowHide(windowElement, applyHide);
        } else {
            applyHide();
        }
    }

    document.addEventListener('click', function (event) {
        if (event.target.matches('#minimizeBtn') || event.target.matches('#closeBtn')) {
            const windowElement = resolveWindowFromTarget(event.target);
            if (!windowElement || windowElement.id === 'windowContainer' && windowElement.style.display === 'none') {
                return;
            }
            hideWindowElement(windowElement);
        }

        if (event.target.matches('#resizeBtn')) {
            const windowElement = resolveWindowFromTarget(event.target);
            if (!windowElement) {
                return;
            }
            windowElement.classList.add('windowElementActive');
            toggleWindowMaximized(windowElement);
        }
    });
}(typeof window !== 'undefined' ? window : globalThis));
