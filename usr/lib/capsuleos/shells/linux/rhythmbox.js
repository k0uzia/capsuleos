(function initRhythmboxAppModule(global) {
    'use strict';
    var WINDOW_TITLE = 'Rhythmbox';
    function getWindowEl(root) { var el = root; while (el) { if (el.getAttribute && el.getAttribute('data-link') === 'rhythmbox') return el; el = el.parentElement; } return null; }
    function syncWindowTitle(winEl) { if (!winEl) return; var t = winEl.querySelector('#windowTitle'); if (t) t.textContent = WINDOW_TITLE; winEl.setAttribute('data-title', WINDOW_TITLE); }
    function initRhythmboxAppOnce() {
        var root = global.document.getElementById('rhythmboxApp');
        if (!root || root.dataset.rhythmboxInit === 'true') return;
        root.dataset.rhythmboxInit = 'true';
        syncWindowTitle(getWindowEl(root));
    }
    global.initRhythmboxApp = function () { initRhythmboxAppOnce(); };
}(typeof window !== 'undefined' ? window : globalThis));
