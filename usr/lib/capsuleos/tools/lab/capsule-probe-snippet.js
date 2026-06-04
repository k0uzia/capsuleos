/**
 * État panel CapsuleOS (Mint) — à évaluer dans le navigateur (CDP Runtime.evaluate).
 * Retourne le même schéma que os-probe.sh (simplifié).
 */
(function capsuleProbeState() {
    'use strict';

    function slotFromLink(link) {
        if (!link) {
            return '';
        }
        if (link.dataset && link.dataset.link) {
            return link.dataset.link;
        }
        return link.getAttribute('data-link') || '';
    }

    function isVisible(container) {
        return !!(container && container.style.display !== 'none');
    }

    var launchers = {};
    var windows = [];
    var focused = null;

    document.querySelectorAll('footer nav a[target="windowElement"]').forEach(function (link) {
        var slot = slotFromLink(link);
        if (!slot) {
            return;
        }
        var running = link.classList.contains('running-link');
        var active = link.classList.contains('active-link');
        launchers[slot] = { running: running, active: active };
        var container = document.querySelector('.windowElement[data-link="' + slot + '"]');
        if (container && isVisible(container)) {
            var state = container.classList.contains('windowElementActive') ? 'focused' : 'normal';
            windows.push({
                id: container.id || slot,
                title: container.getAttribute('data-title') || slot,
                wmClass: slot,
                slot: slot,
                state: state,
            });
            if (state === 'focused') {
                focused = { wmClass: slot, slot: slot, title: windows[windows.length - 1].title };
            }
        }
    });

    var nemo = document.querySelector('.windowElement[data-link="nemo"]');
    var currentPath = '';
    var g = typeof window !== 'undefined' ? window : globalThis;
    if (typeof g.fileExplorerState !== 'undefined' && g.fileExplorerState.currentPath) {
        currentPath = g.fileExplorerState.currentPath;
    } else if (nemo && typeof g.getExplorerCurrentPath === 'function') {
        currentPath = g.getExplorerCurrentPath('nemo') || '';
    } else if (nemo) {
        var pathEl = nemo.querySelector('[data-role="current-path"], .nemo-path, #nemo-path');
        if (pathEl) {
            currentPath = pathEl.textContent || '';
        }
    }

    return {
        toolkit: 'capsule-cinnamon',
        timestamp: new Date().toISOString(),
        focused: focused,
        windows: windows,
        launchers: launchers,
        explorer: { nemo: { currentPath: currentPath } },
        actions: { last: 'state' },
    };
}());
