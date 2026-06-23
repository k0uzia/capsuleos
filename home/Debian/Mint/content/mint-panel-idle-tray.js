/**
 * Visibilité tray bureau nu — ground truth capture VM 1280×800 (2026-06-18).
 * Cinnamon n'affiche pas tous les applets activés : systray réduit + applets dédiées.
 */
(function initMintPanelIdleTray(global) {
    'use strict';

    /** Masqués sur bureau nu (VM : shield · réseau · son · horloge · cornerbar). */
    var IDLE_HIDDEN = [
        '.sticky-applet-trigger',
        '#tray-btn-xapp',
        '#tray-btn-notifications',
        '#tray-btn-printers',
        '#tray-btn-removable',
        '#tray-btn-keyboard',
        '#mint-tray-favorites',
        '#tray-btn-screensaver',
        '#tray-btn-power',
    ];

    function isMint() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function setIdleHidden(selector, hidden) {
        var nodes = global.document.querySelectorAll(selector);
        var i;
        for (i = 0; i < nodes.length; i += 1) {
            if (hidden) {
                nodes[i].classList.add('mint-tray--idle-hidden');
                nodes[i].setAttribute('aria-hidden', 'true');
                if (nodes[i].id === 'mint-tray-favorites') {
                    nodes[i].setAttribute('hidden', '');
                }
            } else {
                nodes[i].classList.remove('mint-tray--idle-hidden');
                nodes[i].removeAttribute('aria-hidden');
                if (nodes[i].id === 'mint-tray-favorites') {
                    nodes[i].removeAttribute('hidden');
                }
            }
        }
    }

    function hasOpenWindows() {
        var list = global.document.querySelectorAll('#desktop > .windowElement[data-link]');
        var i;
        for (i = 0; i < list.length; i += 1) {
            var w = list[i];
            if (w.id === 'mainMenu' || w.dataset.link === 'mainMenu') {
                continue;
            }
            if (w.style.display !== 'none') {
                return true;
            }
        }
        return false;
    }

    function hasPendingNotifications() {
        var list = global.document.getElementById('mint-notifications-list');
        if (!list) {
            return false;
        }
        return list.querySelector('.mint-notification-item') !== null;
    }

    function applyIdleTray() {
        if (!isMint()) {
            return;
        }
        var busyDesktop = hasOpenWindows();
        if (busyDesktop) {
            global.document.body.setAttribute('data-panel-busy', 'true');
        } else {
            global.document.body.removeAttribute('data-panel-busy');
        }
        IDLE_HIDDEN.forEach(function hide(sel) {
            setIdleHidden(sel, !busyDesktop);
        });
        if (!busyDesktop && !hasPendingNotifications()) {
            setIdleHidden('#tray-btn-notifications', true);
        } else if (hasPendingNotifications()) {
            setIdleHidden('#tray-btn-notifications', false);
        }
        global.document.dispatchEvent(new CustomEvent('capsule:mint-tray-idle-applied'));
    }

    function bind() {
        if (!isMint()) {
            return;
        }
        applyIdleTray();
        [
            'capsule:window-opened',
            'capsule:window-closed',
            'capsule:window-hidden',
            'capsule:applet-visibility-changed',
            'capsule:cinnamon-gsettings-changed',
        ].forEach(function (eventName) {
            global.document.addEventListener(eventName, applyIdleTray);
        });
        global.addEventListener('resize', applyIdleTray);
    }

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', bind);
        } else {
            bind();
        }
    }

    global.CapsuleMintPanelIdleTray = { refresh: applyIdleTray };
}(typeof window !== 'undefined' ? window : globalThis));
