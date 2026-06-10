/**
 * Épinglage shell après installation magasin — écoute capsule:store-app-installed.
 * Révèle les lanceurs overview/dash masqués (data-store-pin) et enregistre la recherche overview.
 */
(function initCapsuleGnomeStoreShellPin(global) {
    'use strict';

    var GNOME_BODY_IDS = { alma: true, rocky: true, fedora: true, ubuntu: true };

    function isGnomeShell() {
        var bodyId = global.document && global.document.body ? global.document.body.id : '';
        return !!GNOME_BODY_IDS[bodyId];
    }

    function revealOverviewPin(slotId) {
        var selector = '[data-store-pin="' + slotId + '"]';
        global.document.querySelectorAll(selector).forEach(function reveal(el) {
            el.hidden = false;
            el.removeAttribute('aria-hidden');
        });
    }

    function appendOverviewApp(slotId, label, iconPath) {
        var grid = global.document.querySelector('[data-overview-apps-grid]');
        if (!grid || grid.querySelector('[data-overview-link="' + slotId + '"]')) {
            return;
        }
        var btn = global.document.createElement('button');
        btn.type = 'button';
        btn.className = 'fedora-overview__app';
        btn.setAttribute('data-overview-link', slotId);
        btn.setAttribute('data-store-pin', slotId);
        btn.setAttribute('aria-label', label);
        var img = global.document.createElement('img');
        img.src = iconPath;
        img.alt = '';
        btn.appendChild(img);
        grid.appendChild(btn);
    }

    function pinStoreApp(detail) {
        if (!detail || !detail.slot) {
            return;
        }
        var slotId = detail.slot;
        revealOverviewPin(slotId);
        if (slotId === 'file_roller') {
            appendOverviewApp(
                slotId,
                'Gestionnaire d\'archives',
                '../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/org.gnome.FileRoller'
            );
        }
        if (global.CapsuleTaskbarLauncherState && typeof global.CapsuleTaskbarLauncherState.refresh === 'function') {
            global.CapsuleTaskbarLauncherState.refresh();
        }
    }

    function init() {
        if (!isGnomeShell()) {
            return;
        }
        var storeApi = global.CapsuleGnomeStore;
        if (!storeApi || typeof storeApi.resolveRegistryId !== 'function') {
            return;
        }
        var registryId = storeApi.resolveRegistryId();
        var meta = storeApi.loadStoreInstalledMeta(registryId);
        var ids = meta.appIds || [];
        var i;
        for (i = 0; i < ids.length; i += 1) {
            var entry = storeApi.getStoreAppEntry(ids[i]);
            if (entry && entry.slot) {
                pinStoreApp({ slot: entry.slot, appId: ids[i] });
            }
        }
        global.document.addEventListener('capsule:store-app-installed', function onStoreInstall(event) {
            pinStoreApp(event.detail || {});
        });
    }

    if (typeof global.document !== 'undefined' && global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', init);
    } else {
        global.setTimeout(init, 0);
    }
}(typeof window !== 'undefined' ? window : globalThis));
