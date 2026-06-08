/**
 * Timeshift — snapshots système sur Mint.
 */
(function initTimeshiftAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Timeshift';

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'timeshift') {
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

    function initTimeshiftAppOnce() {
        var root = global.document.getElementById('timeshiftApp');
        if (!root || root.dataset.timeshiftInit === 'true') {
            return;
        }
        root.dataset.timeshiftInit = 'true';
        syncWindowTitle(getWindowEl(root));

        var list = root.querySelector('#tsh-list');
        if (list) {
            list.addEventListener('click', function onListClick(ev) {
                var snap = ev.target;
                while (snap && snap !== list) {
                    if (snap.classList && snap.classList.contains('tsh-app__snap')) {
                        var snaps = list.querySelectorAll('.tsh-app__snap');
                        var si;
                        for (si = 0; si < snaps.length; si += 1) {
                            snaps[si].classList.remove('is-selected');
                        }
                        snap.classList.add('is-selected');
                        return;
                    }
                    snap = snap.parentElement;
                }
            });
        }
    }

    global.initTimeshiftApp = function initTimeshiftApp() {
        initTimeshiftAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
