/**
 * Indicateur espaces de travail Cinnamon — reflète org.cinnamon / org.cinnamon.muffin (parity).
 */
(function initMintWorkspaceIndicator(global) {
    'use strict';

    function isMint() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function readDynamic() {
        if (global.document.body.dataset.capsuleDynamicWorkspaces === 'true') {
            return true;
        }
        var gs = global.CapsuleCinnamonGSettings;
        if (gs && typeof gs.getBool === 'function') {
            return gs.getBool('mint-dynamic-workspaces', false);
        }
        return false;
    }

    function readCount() {
        var raw = global.document.body.dataset.capsuleWorkspaceCount;
        if (raw) {
            return Math.max(1, parseInt(raw, 10) || 4);
        }
        var gs = global.CapsuleCinnamonGSettings;
        if (gs && typeof gs.getCapsule === 'function') {
            return Math.max(1, parseInt(gs.getCapsule('mint-number-workspaces', '4'), 10) || 4);
        }
        return 4;
    }

    function render() {
        var root = global.document.getElementById('mint-workspace-indicator');
        if (!root || !isMint()) {
            return;
        }
        var dynamic = readDynamic();
        var count = readCount();
        root.textContent = '';
        root.dataset.mode = dynamic ? 'dynamic' : 'fixed';
        root.dataset.workspaceCount = String(count);
        root.hidden = false;
        root.setAttribute('aria-hidden', 'false');
        if (dynamic) {
            var dyn = global.document.createElement('span');
            dyn.className = 'mint-workspace-indicator__dot is-active';
            dyn.title = 'Espaces dynamiques';
            root.appendChild(dyn);
            return;
        }
        var i;
        for (i = 0; i < count; i += 1) {
            var dot = global.document.createElement('span');
            dot.className = 'mint-workspace-indicator__dot' + (i === 0 ? ' is-active' : '');
            dot.title = 'Espace ' + (i + 1);
            root.appendChild(dot);
        }
    }

    function bind() {
        if (!isMint()) {
            return;
        }
        global.document.addEventListener('capsule:dynamic-workspaces-changed', render);
        global.document.addEventListener('capsule:number-workspaces-changed', render);
        global.document.addEventListener('capsule:cinnamon-gsettings-changed', render);
        render();
    }

    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
}(typeof window !== 'undefined' ? window : globalThis));
