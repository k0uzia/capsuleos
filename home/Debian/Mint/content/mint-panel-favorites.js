/**
 * Favoris panel Mint — branchement sur openWindowByDataLink (noyau).
 * Ne pas dupliquer windowContainer / taskbar-launcher-state.
 */
(function initMintPanelFavorites(global) {
    'use strict';

    function isMint() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function openCalendarPopover() {
        var trigger = global.document.getElementById('taskbar-clock-trigger');
        if (trigger) {
            trigger.click();
        }
    }

    function bindFavoriteButton(btn) {
        if (!btn || btn.dataset.mintPanelFavoriteBound === 'true') {
            return;
        }
        btn.dataset.mintPanelFavoriteBound = 'true';
        btn.addEventListener('click', function onFavoriteClick(event) {
            var action = btn.getAttribute('data-favorite-action');
            var link = btn.getAttribute('data-favorite-link');
            if (action === 'calendar-popover') {
                event.preventDefault();
                event.stopPropagation();
                openCalendarPopover();
                return;
            }
            if (link && typeof global.openWindowByDataLink === 'function') {
                event.preventDefault();
                event.stopPropagation();
                global.openWindowByDataLink(link);
            }
        });
    }

    function init() {
        if (!isMint()) {
            return;
        }
        var buttons = global.document.querySelectorAll('.taskbar-favorites__btn[data-favorite-link]');
        var i;
        for (i = 0; i < buttons.length; i++) {
            bindFavoriteButton(buttons[i]);
        }
    }

    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);
