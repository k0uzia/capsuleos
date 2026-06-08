/**
 * Analyseur d'espace disque — org.gnome.baobab sur Mint.
 */
(function initBaobabAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Analyseur d\'espace disque';

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'baobab') {
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

    function initBaobabAppOnce() {
        var root = global.document.getElementById('gnomeBaobabApp');
        if (!root || root.dataset.baobabInit === 'true') {
            return;
        }
        root.dataset.baobabInit = 'true';

        var titleEl = root.querySelector('.gnome-baobab__title');
        if (titleEl) {
            titleEl.textContent = WINDOW_TITLE;
        }
        root.setAttribute('aria-label', WINDOW_TITLE);

        syncWindowTitle(getWindowEl(root));

        var places = root.querySelectorAll('.gnome-baobab__place');
        var pi;
        for (pi = 0; pi < places.length; pi += 1) {
            places[pi].addEventListener('click', function onPlaceClick() {
                var pj;
                for (pj = 0; pj < places.length; pj += 1) {
                    places[pj].classList.remove('gnome-baobab__place--active');
                }
                this.classList.add('gnome-baobab__place--active');
            });
        }
    }

    global.initBaobabApp = function initBaobabApp() {
        initBaobabAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
