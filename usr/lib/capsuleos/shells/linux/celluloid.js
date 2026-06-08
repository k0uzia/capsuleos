/**
 * Celluloid — lecteur_multimedia sur Linux Mint.
 */
(function initCelluloidAppModule(global) {
    'use strict';

    var DEFAULT_TITLE = 'Celluloid';

    function isMintSkin() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function getRoot() {
        return global.document.getElementById('lecteurMultimedia');
    }

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'lecteur_multimedia') {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function syncWindowTitle(title) {
        var root = getRoot();
        var winEl = getWindowEl(root);
        if (!winEl) {
            return;
        }
        var label = title || DEFAULT_TITLE;
        var wmTitle = winEl.querySelector('#windowTitle');
        if (wmTitle) {
            wmTitle.textContent = label;
        }
        winEl.setAttribute('data-title', label);
    }

    function setControlsEnabled(root, enabled) {
        if (!root) {
            return;
        }
        var controls = root.querySelectorAll('.celluloid-app__controls .celluloid-app__ctl');
        var ci;
        for (ci = 0; ci < controls.length; ci += 1) {
            controls[ci].disabled = !enabled;
        }
        if (enabled) {
            root.classList.add('celluloid-app--playing');
        } else {
            root.classList.remove('celluloid-app--playing');
        }
    }

    function resetCelluloidIdle() {
        var root = getRoot();
        if (!root) {
            return;
        }
        var content = global.document.getElementById('mint-media-viewer-content');
        var fileName = global.document.getElementById('mint-media-viewer-filename');
        if (content) {
            content.innerHTML = '';
        }
        if (fileName) {
            fileName.textContent = 'Aucun média sélectionné';
        }
        setControlsEnabled(root, false);
        var timeEl = root.querySelector('.celluloid-app__time');
        if (timeEl) {
            timeEl.textContent = '0:00 / 0:00';
        }
        syncWindowTitle(DEFAULT_TITLE);
    }

    function onMediaLoaded(payload) {
        var root = getRoot();
        if (!root || !payload) {
            return;
        }
        setControlsEnabled(root, true);
        var title = payload.name || DEFAULT_TITLE;
        syncWindowTitle(title);
        var timeEl = root.querySelector('.celluloid-app__time');
        if (timeEl) {
            timeEl.textContent = '0:00 / 0:00';
        }
    }

    function initCelluloidAppOnce() {
        var root = getRoot();
        if (!root || root.dataset.celluloidInit === 'true') {
            return;
        }
        root.dataset.celluloidInit = 'true';
        if (!isMintSkin()) {
            return;
        }
        resetCelluloidIdle();
        global.setTimeout(function syncTitleAfterOpen() {
            syncWindowTitle(DEFAULT_TITLE);
        }, 0);
    }

    global.initCelluloidApp = function initCelluloidApp() {
        initCelluloidAppOnce();
    };
    global.resetCelluloidIdle = resetCelluloidIdle;
    global.onCelluloidMediaLoaded = onMediaLoaded;
    global.getCelluloidWindowTitle = function getCelluloidWindowTitle() {
        return isMintSkin() ? DEFAULT_TITLE : 'Lecteur multimédia';
    };
}(typeof window !== 'undefined' ? window : globalThis));
