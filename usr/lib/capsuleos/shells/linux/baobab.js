/**
 * Baobab — Analyseur d'espace disque (org.gnome.baobab).
 */
(function initBaobabAppModule(global) {
    'use strict';

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

    function initBaobabAppOnce() {
        var root = global.document.getElementById('gnomeBaobabApp');
        if (!root || root.dataset.baobabInit === 'true') {
            return;
        }
        root.dataset.baobabInit = 'true';

        var winEl = getWindowEl(root);
        if (winEl) {
            var wmTitle = winEl.querySelector('#windowTitle');
            if (wmTitle) {
                wmTitle.textContent = 'Analyseur d\'espace disque';
            }
            winEl.setAttribute('data-title', 'Analyseur d\'espace disque');
        }

        var places = root.querySelectorAll('.gnome-baobab__place');
        var ringCenter = root.querySelector('.gnome-baobab__ring-center');
        var scanBtn = root.querySelector('.gnome-baobab__scan-btn');
        var pi;

        for (pi = 0; pi < places.length; pi += 1) {
            (function bindPlace(place) {
                place.addEventListener('click', function onPlaceClick() {
                    var pj;
                    for (pj = 0; pj < places.length; pj += 1) {
                        places[pj].classList.remove('gnome-baobab__place--active');
                    }
                    place.classList.add('gnome-baobab__place--active');
                    var labelEl = place.querySelector('.gnome-baobab__place-label');
                    var label = labelEl ? labelEl.textContent : '';
                    if (ringCenter) {
                        ringCenter.textContent = label.indexOf('Dossier') >= 0 ? '34 %' : '62 %';
                    }
                    if (scanBtn) {
                        scanBtn.disabled = false;
                    }
                });
            }(places[pi]));
        }

        if (scanBtn) {
            scanBtn.addEventListener('click', function onScan() {
                if (scanBtn.disabled) {
                    return;
                }
                scanBtn.textContent = 'Analyse…';
                global.setTimeout(function afterScan() {
                    scanBtn.textContent = 'Analyser';
                }, 600);
            });
        }
    }

    global.initBaobabApp = function initBaobabApp() {
        initBaobabAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
