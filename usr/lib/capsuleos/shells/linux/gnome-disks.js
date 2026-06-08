(function initGnomeDisksAppModule(global) {
    'use strict';
    var WINDOW_TITLE = 'Disques';
    function getWindowEl(root) { var el = root; while (el) { if (el.getAttribute && el.getAttribute('data-link') === 'gnome_disks') return el; el = el.parentElement; } return null; }
    function syncWindowTitle(winEl) { if (!winEl) return; var t = winEl.querySelector('#windowTitle'); if (t) t.textContent = WINDOW_TITLE; winEl.setAttribute('data-title', WINDOW_TITLE); }
    function initGnomeDisksAppOnce() {
        var root = global.document.getElementById('gnomeDisksApp');
        if (!root || root.dataset.gnomeDisksInit === 'true') return;
        root.dataset.gnomeDisksInit = 'true';
        syncWindowTitle(getWindowEl(root));
    }
    global.initGnomeDisksApp = function () { initGnomeDisksAppOnce(); };
}(typeof window !== 'undefined' ? window : globalThis));
