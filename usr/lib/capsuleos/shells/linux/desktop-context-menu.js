/**
 * Menu contextuel bureau — Cinnamon Mint (clic droit sur #desktop).
 */
(function initCapsuleDesktopContextMenu(global) {
    'use strict';

    function isMintDesktop() {
        const bodyId = typeof document !== 'undefined' && document.body ? document.body.id : '';
        const skinKey = typeof global !== 'undefined' ? global.CAPSULE_EMBED_SKIN_KEY : '';
        return bodyId === 'mint' || skinKey === 'mint';
    }

    function closeMenu(menu) {
        if (!menu) {
            return;
        }
        menu.hidden = true;
    }

    function openMenu(menu, clientX, clientY) {
        menu.hidden = false;
        const rect = menu.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width - 8;
        const maxTop = window.innerHeight - rect.height - 8;
        menu.style.left = `${Math.max(8, Math.min(clientX, maxLeft))}px`;
        menu.style.top = `${Math.max(8, Math.min(clientY, maxTop))}px`;
    }

    function bindActions(menu) {
        menu.querySelectorAll('[data-desktop-action]').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const action = item.dataset.desktopAction;
                closeMenu(menu);

                if (action === 'refresh') {
                    window.location.reload();
                    return;
                }
                if (action === 'wallpaper' || action === 'desktop-settings') {
                    if (typeof global.setCapsuleSettingsPanel === 'function') {
                        global.setCapsuleSettingsPanel('background');
                    }
                    if (typeof global.openWindowByDataLink === 'function') {
                        global.openWindowByDataLink('themes');
                    }
                }
            });
        });
    }

    function isDesktopBackgroundEvent(event, desktop) {
        if (event.target.closest('.windowElement, .desktop-shortcut, a, button, input')) {
            return false;
        }
        if (event.target === desktop || (desktop.contains(event.target) && event.target.id === 'desktop')) {
            return true;
        }
        if (event.target.id === 'mint' || event.target === document.body) {
            const rect = desktop.getBoundingClientRect();
            return event.clientX >= rect.left && event.clientX <= rect.right
                && event.clientY >= rect.top && event.clientY <= rect.bottom;
        }
        return false;
    }

    function init() {
        if (!isMintDesktop()) {
            return;
        }

        const desktop = document.getElementById('desktop');
        const menu = document.getElementById('desktop-context-menu');
        if (!desktop || !menu) {
            return;
        }

        bindActions(menu);

        const onDesktopContextMenu = (event) => {
            if (!isDesktopBackgroundEvent(event, desktop)) {
                return;
            }
            event.preventDefault();
            openMenu(menu, event.clientX, event.clientY);
        };

        desktop.addEventListener('contextmenu', onDesktopContextMenu);
        document.body.addEventListener('contextmenu', onDesktopContextMenu);

        document.addEventListener('click', (event) => {
            if (!menu.hidden && !menu.contains(event.target)) {
                closeMenu(menu);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMenu(menu);
            }
        });

        window.addEventListener('resize', () => closeMenu(menu));
    }

    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }
}(typeof window !== 'undefined' ? window : globalThis));
