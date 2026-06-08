/**
 * Applet favoris panel Mint (favorites@cinnamon.org) — favoris bureau VM.
 */
(function initMintPanelFavorites(global) {
    'use strict';

    function isMint() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function openSlot(slotId) {
        if (typeof global.openWindowByDataLink === 'function') {
            global.openWindowByDataLink(slotId);
        }
    }

    function openCalendarPopover() {
        var trigger = global.document.getElementById('taskbar-clock-trigger');
        if (trigger) {
            trigger.click();
        }
    }

    function bindFavorites() {
        var buttons = global.document.querySelectorAll('.taskbar-favorites__btn[data-favorite-link]');
        var i;
        for (i = 0; i < buttons.length; i += 1) {
            (function bindBtn(btn) {
                btn.addEventListener('click', function onFavoriteClick(event) {
                    event.preventDefault();
                    if (btn.getAttribute('data-favorite-action') === 'calendar-popover') {
                        openCalendarPopover();
                        return;
                    }
                    var slot = btn.getAttribute('data-favorite-link');
                    if (slot) {
                        openSlot(slot);
                    }
                });
            }(buttons[i]));
        }
    }

    function init() {
        if (!isMint()) {
            return;
        }
        bindFavorites();
    }

    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}(typeof window !== 'undefined' ? window : globalThis));
