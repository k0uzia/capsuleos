/**
 * Sonde panel CapsuleOS (lab / CDP) — alignée sur taskbar-launcher-state.js (CapsuleLauncherProbe).
 * Schéma identique à os-probe.sh / os-probe-gnome.sh pour compare-os-parity.
 */
(function capsuleProbeState() {
    'use strict';

    if (typeof CapsuleLauncherProbe !== 'undefined'
        && typeof CapsuleLauncherProbe.collectState === 'function') {
        return CapsuleLauncherProbe.collectState();
    }

    var PANEL_SLOTS = ['nemo', 'firefox', 'terminal'];

    function isVisible(container) {
        if (!container || container.style.display === 'none') {
            return false;
        }
        if (typeof getComputedStyle === 'function') {
            return getComputedStyle(container).display !== 'none';
        }
        return true;
    }

    function isRunning(container) {
        return !!(container && (container.dataset.capsuleRunning === 'true' || isVisible(container)));
    }

    function isActive(container) {
        return isVisible(container) && container.classList.contains('windowElementActive');
    }

    var launchers = {};
    var windows = [];
    var focused = null;

    PANEL_SLOTS.forEach(function (slot) {
        var container = document.querySelector('.windowElement[data-link="' + slot + '"]');
        if (!container) {
            return;
        }
        launchers[slot] = { running: isRunning(container), active: isActive(container) };
        if (isVisible(container)) {
            var state = isActive(container) ? 'focused' : 'normal';
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

    var bodyId = document.body ? document.body.id : '';
    var toolkit = bodyId === 'mint' ? 'capsule-cinnamon'
        : (bodyId === 'fedora' || bodyId === 'rocky' ? 'capsule-gnome' : 'capsule-linux');

    var currentPath = '';
    var g = typeof window !== 'undefined' ? window : globalThis;
    if (typeof g.fileExplorerState !== 'undefined' && g.fileExplorerState.currentPath) {
        currentPath = g.fileExplorerState.currentPath;
    } else if (typeof g.getExplorerCurrentPath === 'function') {
        currentPath = g.getExplorerCurrentPath('nemo') || '';
    }

    return {
        toolkit: toolkit,
        timestamp: new Date().toISOString(),
        focused: focused,
        windows: windows,
        launchers: launchers,
        explorer: { nemo: { currentPath: currentPath } },
        actions: { last: 'state' },
    };
}());
