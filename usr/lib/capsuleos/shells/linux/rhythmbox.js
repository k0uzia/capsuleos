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
        root.addEventListener('click', function onClick(ev) {
            var nav = ev.target.closest ? ev.target.closest('.rb-app__nav') : null;
            if (nav && root.contains(nav)) {
                var navs = root.querySelectorAll('.rb-app__nav');
                var ni;
                for (ni = 0; ni < navs.length; ni += 1) navs[ni].classList.remove('is-active');
                nav.classList.add('is-active');
                return;
            }
            var track = ev.target.closest ? ev.target.closest('.rb-app__track') : null;
            if (track && root.contains(track)) {
                var tracks = root.querySelectorAll('.rb-app__track');
                var ti;
                for (ti = 0; ti < tracks.length; ti += 1) tracks[ti].classList.remove('is-selected');
                track.classList.add('is-selected');
                var title = track.querySelector('span');
                var now = root.querySelector('.rb-app__now');
                if (now && title) now.textContent = 'En pause — ' + title.textContent;
            }
        });
    }
    global.initRhythmboxApp = function () { initRhythmboxAppOnce(); };
}(typeof window !== 'undefined' ? window : globalThis));
