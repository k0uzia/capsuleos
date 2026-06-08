/**
 * Hypnotix — lecteur IPTV sur Mint.
 */
(function initHypnotixAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Hypnotix';

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'hypnotix') {
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

    function initHypnotixAppOnce() {
        var root = global.document.getElementById('hypnotixApp');
        if (!root || root.dataset.hypnotixInit === 'true') {
            return;
        }
        root.dataset.hypnotixInit = 'true';
        syncWindowTitle(getWindowEl(root));

        var grid = root.querySelector('#hyp-grid');
        var player = root.querySelector('#hyp-player');
        if (grid) {
            grid.addEventListener('click', function onGridClick(ev) {
                var ch = ev.target;
                while (ch && ch !== grid) {
                    if (ch.classList && ch.classList.contains('hyp-app__channel')) {
                        var channels = grid.querySelectorAll('.hyp-app__channel');
                        var ci;
                        for (ci = 0; ci < channels.length; ci += 1) {
                            channels[ci].classList.remove('is-selected');
                        }
                        ch.classList.add('is-selected');
                        var name = ch.querySelector('.hyp-app__channel-name');
                        if (player && name) {
                            player.innerHTML = '<p class="hyp-app__now">' + name.textContent + ' — en direct (simulation)</p>';
                        }
                        return;
                    }
                    ch = ch.parentElement;
                }
            });
        }
    }

    global.initHypnotixApp = function initHypnotixApp() {
        initHypnotixAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
