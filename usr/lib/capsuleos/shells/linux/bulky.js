/**
 * Renommer fichiers — bulky sur Mint.
 */
(function initBulkyAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Renommer fichiers';

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'bulky') {
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

    function refreshPreview(root) {
        var prefix = root.querySelector('#blk-prefix');
        var body = root.querySelector('#blk-body');
        if (!prefix || !body) {
            return;
        }
        var p = prefix.value || '';
        var rows = body.querySelectorAll('tr');
        var ri;
        for (ri = 0; ri < rows.length; ri += 1) {
            var orig = rows[ri].cells[0];
            var preview = rows[ri].querySelector('.blk-app__preview');
            if (orig && preview) {
                var ext = orig.textContent.split('.').pop();
                var num = String(ri + 1);
                while (num.length < 3) {
                    num = '0' + num;
                }
                preview.textContent = p + num + '.' + ext;
            }
        }
    }

    function initBulkyAppOnce() {
        var root = global.document.getElementById('bulkyApp');
        if (!root || root.dataset.bulkyInit === 'true') {
            return;
        }
        root.dataset.bulkyInit = 'true';
        syncWindowTitle(getWindowEl(root));

        var prefix = root.querySelector('#blk-prefix');
        if (prefix) {
            prefix.addEventListener('input', function onPrefix() {
                refreshPreview(root);
            });
        }
        refreshPreview(root);
    }

    global.initBulkyApp = function initBulkyApp() {
        initBulkyAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
