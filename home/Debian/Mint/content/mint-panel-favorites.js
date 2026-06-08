/**
 * Applet favoris panel Mint — adaptateur mince vers openWindowByDataLink (noyau).
 */
(function initMintPanelFavorites(global) {
    'use strict';

    function isMintPanel() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function openCalendarPopover() {
        var trigger = global.document.getElementById('taskbar-clock-trigger');
        if (trigger) {
            trigger.click();
        }
    }

    function bindFavoriteButton(btn) {
        btn.addEventListener('click', function onFavoriteClick(event) {
            event.preventDefault();
            event.stopPropagation();
            var action = btn.getAttribute('data-favorite-action');
            var link = btn.getAttribute('data-favorite-link');
            if (action === 'calendar-popover') {
                openCalendarPopover();
                return;
            }
            if (link && typeof global.openWindowByDataLink === 'function') {
                global.openWindowByDataLink(link);
            }
        });
    }

    function init() {
        if (!isMintPanel()) {
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
