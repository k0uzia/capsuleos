/**
 * Transmission — client BitTorrent sur Mint.
 */
(function initTransmissionAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Transmission';

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'transmission') {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function syncWindowTitle(winEl) {
        if (!winEl) {
            return;
        }
        var wmTitle = winEl.querySelector('#windowTitle');
        if (wmTitle) {
            wmTitle.textContent = WINDOW_TITLE;
        }
        winEl.setAttribute('data-title', WINDOW_TITLE);
    }

    function showDemoTorrent(root) {
        var empty = root.querySelector('#trm-empty');
        var table = root.querySelector('#trm-table');
        var body = root.querySelector('#trm-body');
        var status = root.querySelector('#trm-status-text');
        var removeBtn = root.querySelector('[data-trm-action="remove"]');
        if (empty) {
            empty.setAttribute('hidden', 'hidden');
        }
        if (table) {
            table.removeAttribute('hidden');
        }
        if (body) {
            body.innerHTML = '<tr><td>linuxmint-22.3.iso.torrent</td><td>2,8 Go</td><td>100 %</td><td>Terminé</td></tr>';
        }
        if (status) {
            status.textContent = '1 torrent';
        }
        if (removeBtn) {
            removeBtn.disabled = false;
        }
    }

    function initTransmissionAppOnce() {
        var root = global.document.getElementById('transmissionApp');
        if (!root || root.dataset.transmissionInit === 'true') {
            return;
        }
        root.dataset.transmissionInit = 'true';
        syncWindowTitle(getWindowEl(root));

        root.addEventListener('click', function onAction(ev) {
            var btn = ev.target;
            if (!btn || !btn.getAttribute) {
                return;
            }
            if (btn.getAttribute('data-trm-action') === 'add') {
                showDemoTorrent(root);
            }
        });
    }

    global.initTransmissionApp = function initTransmissionApp() {
        initTransmissionAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
