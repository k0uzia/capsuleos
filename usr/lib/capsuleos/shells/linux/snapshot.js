/**
 * Snapshot GNOME — simulation org.gnome.Snapshot (caméra sandbox).
 */
(function initGnomeSnapshotAppModule(global) {
    'use strict';

    var EMPTY_COPY = {
        photo: {
            title: 'Aucune caméra détectée',
            hint: 'Connectez une webcam pour utiliser Snapshot dans CapsuleOS.'
        },
        video: {
            title: 'Aucune caméra détectée',
            hint: 'L\'enregistrement vidéo nécessite une caméra connectée.'
        }
    };

    function switchSnapshotMode(root, mode) {
        var copy = EMPTY_COPY[mode] || EMPTY_COPY.photo;
        root.classList.toggle('gnome-snapshot--video', mode === 'video');
        root.querySelectorAll('[data-snapshot-mode]').forEach(function (btn) {
            var active = btn.dataset.snapshotMode === mode;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        var title = root.querySelector('#gnome-snapshot-empty-title');
        var hint = root.querySelector('#gnome-snapshot-empty-hint');
        var shutter = root.querySelector('[data-snapshot-shutter]');
        if (title) {
            title.textContent = copy.title;
        }
        if (hint) {
            hint.textContent = copy.hint;
        }
        if (shutter) {
            shutter.setAttribute('aria-label', mode === 'video' ? 'Enregistrer une vidéo' : 'Prendre une photo');
            shutter.title = shutter.getAttribute('aria-label');
        }
    }

    function bindSnapshotModes(root) {
        root.querySelectorAll('[data-snapshot-mode]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchSnapshotMode(root, btn.dataset.snapshotMode);
            });
        });
    }

    function initSnapshotApp(container) {
        var root = container
            ? container.querySelector('#gnomeSnapshotApp')
            : global.document.getElementById('gnomeSnapshotApp');
        if (!root || root.dataset.snapshotReady === '1') {
            return;
        }
        root.dataset.snapshotReady = '1';
        bindSnapshotModes(root);
        switchSnapshotMode(root, 'photo');
    }

    global.initSnapshotApp = initSnapshotApp;
}(typeof window !== 'undefined' ? window : this));
