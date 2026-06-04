/**
 * Raccourcis bureau Mint — favoris VM (calculatrice via menu, calendrier tray).
 */
(function initMintDesktopFavorites(global) {
    'use strict';

    function isMintDesktop() {
        return document.body && document.body.id === 'mint';
    }

    function openCalendarPopover() {
        var trigger = document.getElementById('taskbar-clock-trigger');
        if (trigger) {
            trigger.click();
        }
    }

    function openMainMenuThenShortcut(shortcutId) {
        if (typeof global.openWindowByDataLink === 'function') {
            global.openWindowByDataLink('mainMenu');
        }
        window.setTimeout(function tryShortcut() {
            var link = document.querySelector('.menu-shortcut[data-shortcut-id="' + shortcutId + '"]');
            if (link && !link.classList.contains('is-unavailable')) {
                link.click();
            }
        }, 320);
    }

    function bindFavorite(shortcut) {
        var action = shortcut.getAttribute('data-mint-favorite');
        if (!action) {
            return;
        }
        shortcut.addEventListener('click', function onFavoriteClick(event) {
            if (action === 'calendar') {
                event.preventDefault();
                event.stopPropagation();
                openCalendarPopover();
                return;
            }
            if (action === 'calculator') {
                event.preventDefault();
                event.stopPropagation();
                openMainMenuThenShortcut('calculator');
            }
        });
    }

    function bindPowerTray() {
        var powerBtn = document.querySelector('.taskbar-tray__btn--power');
        if (!powerBtn) {
            return;
        }
        powerBtn.addEventListener('click', function onPowerClick() {
            if (typeof global.openWindowByDataLink === 'function') {
                global.openWindowByDataLink('mainMenu');
            }
        });
    }

    function init() {
        if (!isMintDesktop()) {
            return;
        }
        document.querySelectorAll('.desktop-shortcut[data-mint-favorite]').forEach(bindFavorite);
        bindPowerTray();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);
