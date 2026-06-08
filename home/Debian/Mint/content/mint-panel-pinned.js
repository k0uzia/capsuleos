/**
 * Lanceurs épinglés panel Mint (grouped-window-list VM) — nemo, logithèque, terminal.
 */
(function initMintPanelPinned(global) {
    'use strict';

    function isMintPanel() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function bindPinnedLauncher(link) {
        link.addEventListener('click', function onPinnedClick(event) {
            var slot = link.getAttribute('data-link');
            if (!slot || typeof global.openWindowByDataLink !== 'function') {
                return;
            }
            event.preventDefault();
            global.openWindowByDataLink(slot);
        });
    }

    function init() {
        if (!isMintPanel()) {
            return;
        }
        var links = global.document.querySelectorAll('#mint-panel-pinned a[data-link]');
        var i;
        for (i = 0; i < links.length; i++) {
            bindPinnedLauncher(links[i]);
        }
    }

    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);
