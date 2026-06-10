/**
 * Catalogue magasin GNOME Software — extension store-installable-apps.json (pilote Alma).
 * Fusionne les apps ground truth VM avec les entrées storeInstallable par registryId.
 */
(function initCapsuleGnomeStoreCatalog(global) {
    'use strict';

    var STORE_INSTALLED_PREFIX = 'capsule-store-installed:';

    var STORE_APPS_BY_REGISTRY = {
        'linux-alma': [
            {
                id: 'file-roller',
                storeSlot: 'file_roller',
                title: 'Gestionnaire d\'archives',
                sub: 'Archives compressées',
                desc: 'Créez, ouvrez et extrayez des archives (tar, zip, …).',
                version: '43.0',
                size: '~2 Mo',
                iconClass: 'gnome-software__cardicon--file-roller',
                slot: 'file_roller',
                source: 'rpm',
                categories: ['utilities'],
                placement: { overview: true }
            },
            {
                id: 'libreoffice',
                storeSlot: 'libreoffice_startcenter',
                title: 'LibreOffice',
                sub: 'Suite bureautique',
                desc: 'Suite bureautique libre — Writer, Calc, Impress (Flatpak Flathub).',
                version: '24.8',
                size: '~280 Mo',
                iconClass: 'gnome-software__cardicon--libreoffice',
                slot: 'librewriter',
                source: 'flatpak',
                categories: ['productivity', 'creation'],
                placement: { overview: true, dash: true }
            },
            {
                id: 'calendar',
                storeSlot: 'calendar',
                title: 'Agenda',
                sub: 'Calendrier et rendez-vous',
                desc: 'Consultez vos événements et rendez-vous (Flatpak org.gnome.Calendar).',
                version: '47.0',
                size: '~5 Mo',
                iconClass: 'gnome-software__cardicon--calendar',
                slot: 'calendar',
                source: 'flatpak',
                categories: ['productivity'],
                placement: { overview: true, dash: true }
            }
        ]
    };

    function resolveRegistryId() {
        if (global.CAPSULE_SKIN_PROFILE_ID) {
            return global.CAPSULE_SKIN_PROFILE_ID;
        }
        var bodyId = global.document && global.document.body ? global.document.body.id : '';
        if (bodyId === 'alma') {
            return 'linux-alma';
        }
        if (bodyId === 'rocky') {
            return 'linux-rocky';
        }
        if (bodyId === 'fedora') {
            return 'linux-fedora';
        }
        if (bodyId === 'ubuntu') {
            return 'linux-ubuntu';
        }
        return '';
    }

    function storeInstalledKey(registryId) {
        return STORE_INSTALLED_PREFIX + registryId;
    }

    function loadStoreInstalledMeta(registryId) {
        var key = storeInstalledKey(registryId);
        try {
            var raw = global.sessionStorage.getItem(key);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            /* hors ligne */
        }
        return { appIds: [], installedAt: null, source: null };
    }

    function saveStoreInstalledMeta(registryId, meta) {
        try {
            global.sessionStorage.setItem(storeInstalledKey(registryId), JSON.stringify(meta));
        } catch (e) {
            /* hors ligne */
        }
    }

    function recordStoreInstall(registryId, appId, source) {
        var meta = loadStoreInstalledMeta(registryId);
        var ids = meta.appIds || [];
        if (ids.indexOf(appId) === -1) {
            ids.push(appId);
        }
        meta.appIds = ids;
        meta.installedAt = new Date().toISOString();
        if (source) {
            meta.source = source;
        }
        saveStoreInstalledMeta(registryId, meta);
        return meta;
    }

    function mergeStoreApps(baseCatalog) {
        var registryId = resolveRegistryId();
        var merged = {};
        var baseIds = Object.keys(baseCatalog || {});
        var i;
        for (i = 0; i < baseIds.length; i += 1) {
            var bid = baseIds[i];
            merged[bid] = baseCatalog[bid];
        }
        var storeList = STORE_APPS_BY_REGISTRY[registryId];
        if (!storeList) {
            return merged;
        }
        for (i = 0; i < storeList.length; i += 1) {
            var entry = storeList[i];
            merged[entry.id] = {
                title: entry.title,
                sub: entry.sub,
                desc: entry.desc,
                version: entry.version,
                size: entry.size,
                iconClass: entry.iconClass,
                installed: false,
                slot: entry.slot,
                categories: entry.categories,
                storeSlot: entry.storeSlot,
                source: entry.source,
                storeInstallable: true,
                placement: entry.placement
            };
        }
        return merged;
    }

    function getDiscoverApps(installedState) {
        var registryId = resolveRegistryId();
        var storeList = STORE_APPS_BY_REGISTRY[registryId];
        var result = [];
        if (!storeList) {
            return result;
        }
        var i;
        for (i = 0; i < storeList.length; i += 1) {
            var entry = storeList[i];
            if (installedState && installedState[entry.id] === true) {
                continue;
            }
            result.push({ id: entry.id, app: mergeStoreApps({})[entry.id] });
        }
        return result;
    }

    function getStoreAppEntry(appId) {
        var registryId = resolveRegistryId();
        var storeList = STORE_APPS_BY_REGISTRY[registryId];
        if (!storeList) {
            return null;
        }
        var i;
        for (i = 0; i < storeList.length; i += 1) {
            if (storeList[i].id === appId) {
                return storeList[i];
            }
        }
        return null;
    }

    global.CapsuleGnomeStore = {
        STORE_INSTALLED_PREFIX: STORE_INSTALLED_PREFIX,
        STORE_APPS_BY_REGISTRY: STORE_APPS_BY_REGISTRY,
        resolveRegistryId: resolveRegistryId,
        storeInstalledKey: storeInstalledKey,
        loadStoreInstalledMeta: loadStoreInstalledMeta,
        saveStoreInstalledMeta: saveStoreInstalledMeta,
        recordStoreInstall: recordStoreInstall,
        mergeStoreApps: mergeStoreApps,
        getDiscoverApps: getDiscoverApps,
        getStoreAppEntry: getStoreAppEntry
    };
}(typeof window !== 'undefined' ? window : globalThis));
