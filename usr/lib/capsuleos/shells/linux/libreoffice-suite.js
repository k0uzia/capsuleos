(function initLibreofficeStartcenterAppModule(global) {
    'use strict';
    var WINDOW_TITLE = 'LibreOffice';
    function getWindowEl(root) { var el = root; while (el) { if (el.getAttribute && el.getAttribute('data-link') === 'libreoffice_startcenter') return el; el = el.parentElement; } return null; }
    function syncWindowTitle(winEl) { if (!winEl) return; var t = winEl.querySelector('#windowTitle'); if (t) t.textContent = WINDOW_TITLE; winEl.setAttribute('data-title', WINDOW_TITLE); }
    function initLibreofficeStartcenterAppOnce() {
        var root = global.document.getElementById('libreofficeStartcenterApp');
        if (!root || root.dataset.libreofficeStartcenterInit === 'true') return;
        root.dataset.libreofficeStartcenterInit = 'true';
        syncWindowTitle(getWindowEl(root));
    }
    global.initLibreofficeStartcenterApp = function () { initLibreofficeStartcenterAppOnce(); };
}(typeof window !== 'undefined' ? window : globalThis));

(function initLibreofficeDrawAppModule(global) {
    'use strict';
    var WINDOW_TITLE = 'Sans nom 1 — LibreOffice Draw';
    function getWindowEl(root) { var el = root; while (el) { if (el.getAttribute && el.getAttribute('data-link') === 'libreoffice_draw') return el; el = el.parentElement; } return null; }
    function syncWindowTitle(winEl) { if (!winEl) return; var t = winEl.querySelector('#windowTitle'); if (t) t.textContent = WINDOW_TITLE; winEl.setAttribute('data-title', WINDOW_TITLE); }
    function initLibreofficeDrawAppOnce() {
        var root = global.document.getElementById('libreofficeDrawApp');
        if (!root || root.dataset.libreofficeDrawInit === 'true') return;
        root.dataset.libreofficeDrawInit = 'true';
        syncWindowTitle(getWindowEl(root));
    }
    global.initLibreofficeDrawApp = function () { initLibreofficeDrawAppOnce(); };
}(typeof window !== 'undefined' ? window : globalThis));

(function initLibreofficeImpressAppModule(global) {
    'use strict';
    var WINDOW_TITLE = 'Sans nom 1 — LibreOffice Impress';
    function getWindowEl(root) { var el = root; while (el) { if (el.getAttribute && el.getAttribute('data-link') === 'libreoffice_impress') return el; el = el.parentElement; } return null; }
    function syncWindowTitle(winEl) { if (!winEl) return; var t = winEl.querySelector('#windowTitle'); if (t) t.textContent = WINDOW_TITLE; winEl.setAttribute('data-title', WINDOW_TITLE); }
    function initLibreofficeImpressAppOnce() {
        var root = global.document.getElementById('libreofficeImpressApp');
        if (!root || root.dataset.libreofficeImpressInit === 'true') return;
        root.dataset.libreofficeImpressInit = 'true';
        syncWindowTitle(getWindowEl(root));
    }
    global.initLibreofficeImpressApp = function () { initLibreofficeImpressAppOnce(); };
}(typeof window !== 'undefined' ? window : globalThis));
