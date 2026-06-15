/**
 * Lanceurs épinglés panel Mint — adaptateur mince vers openWindowByDataLink (noyau).
 * capsule-window-shell branche déjà a[target="windowElement"] ; ce module assure
 * le fallback si registerLinks n'a pas encore lié le lanceur.
 */
(function initMintPanelPinned(global) {
    'use strict';

    function isMintPanel() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function bindPinnedLauncher(link) {
        if (!link || link.dataset.mintPinnedBound === 'true') {
            return;
        }
        link.dataset.mintPinnedBound = 'true';
        link.addEventListener('click', function onPinnedClick(event) {
            if (link.dataset.capsuleWindowBound === 'true') {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            var slot = link.getAttribute('data-link');
            if (slot && typeof global.openWindowByDataLink === 'function') {
                global.openWindowByDataLink(slot);
            }
        });
        link.addEventListener('mouseenter', function onPinnedPrefetch() {
            var slot = link.getAttribute('data-link');
            if (slot && global.CapsuleSlotLoader
                && typeof global.CapsuleSlotLoader.ensureSlotLoaded === 'function') {
                global.CapsuleSlotLoader.ensureSlotLoaded(slot);
            }
        });
    }

    function init() {
        if (!isMintPanel()) {
            return;
        }
        var launchers = global.document.querySelectorAll(
            '#mint-panel-pinned .mint-panel__launcher[data-link], '
            + 'footer.mint-panel nav .mint-panel__launcher[data-link]'
        );
        var i;
        for (i = 0; i < launchers.length; i++) {
            bindPinnedLauncher(launchers[i]);
        }
    }

    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);
