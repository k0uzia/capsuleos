(function initSimpleScanAppModule(global) {
    'use strict';
    var WINDOW_TITLE = 'Numérisation de documents';
    function getWindowEl(root) { var el = root; while (el) { if (el.getAttribute && el.getAttribute('data-link') === 'simple_scan') return el; el = el.parentElement; } return null; }
    function syncWindowTitle(winEl) { if (!winEl) return; var t = winEl.querySelector('#windowTitle'); if (t) t.textContent = WINDOW_TITLE; winEl.setAttribute('data-title', WINDOW_TITLE); }
    function initSimpleScanAppOnce() {
        var root = global.document.getElementById('simpleScanApp');
        if (!root || root.dataset.simpleScanInit === 'true') return;
        root.dataset.simpleScanInit = 'true';
        syncWindowTitle(getWindowEl(root));
        root.addEventListener('click', function (ev) {
            var btn = ev.target;
            if (!btn || btn.getAttribute('data-scn-action') !== 'scan') return;
            var preview = root.querySelector('#scn-preview');
            var saveBtn = root.querySelector('[data-scn-action="save"]');
            if (preview) preview.innerHTML = '<p>Page 1 — numérisation simulée (300 dpi)</p>';
            if (saveBtn) saveBtn.disabled = false;
        });
    }
    global.initSimpleScanApp = function () { initSimpleScanAppOnce(); };
}(typeof window !== 'undefined' ? window : globalThis));
