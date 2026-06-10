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
            },
            {
                id: 'thunderbird',
                storeSlot: 'thunderbird',
                title: 'Thunderbird',
                sub: 'Messagerie électronique',
                desc: 'Client de messagerie libre (Flatpak org.mozilla.Thunderbird).',
                version: '128.0',
                size: '~85 Mo',
                iconClass: 'gnome-software__cardicon--thunderbird',
                slot: 'thunderbird',
                source: 'flatpak',
                categories: ['productivity'],
                placement: { overview: true }
            },
            {
                id: 'transmission',
                storeSlot: 'transmission',
                title: 'Transmission',
                sub: 'Client BitTorrent',
                desc: 'Téléchargez des fichiers via BitTorrent (Flatpak com.transmissionbt.Transmission).',
                version: '4.0',
                size: '~8 Mo',
                iconClass: 'gnome-software__cardicon--transmission',
                slot: 'transmission',
                source: 'flatpak',
                categories: ['utilities'],
                placement: { overview: true }
            },
            {
                id: 'rhythmbox',
                storeSlot: 'rhythmbox',
                title: 'Rhythmbox',
                sub: 'Lecteur de musique',
                desc: 'Organisez et écoutez votre bibliothèque musicale (RPM rhythmbox).',
                version: '3.4',
                size: '~12 Mo',
                iconClass: 'gnome-software__cardicon--rhythmbox',
                slot: 'rhythmbox',
                source: 'rpm',
                categories: ['multimedia'],
                placement: { overview: true }
            },
            {
                id: 'lecteur-multimedia',
                storeSlot: 'lecteur_multimedia',
                title: 'Lecteur vidéos',
                sub: 'Celluloid',
                desc: 'Lisez vos fichiers vidéo (Flatpak io.github.celluloid_player.Celluloid).',
                version: '0.27',
                size: '~5 Mo',
                iconClass: 'gnome-software__cardicon--lecteur-multimedia',
                slot: 'lecteur_multimedia',
                source: 'flatpak',
                categories: ['multimedia'],
                placement: { overview: true }
            },
            {
                id: 'drawing',
                storeSlot: 'drawing',
                title: 'Drawing',
                sub: 'Dessin et annotation',
                desc: 'Dessinez et annotez des images (Flatpak com.github.maoschanz.drawing).',
                version: '1.2',
                size: '~3 Mo',
                iconClass: 'gnome-software__cardicon--drawing',
                slot: 'drawing',
                source: 'flatpak',
                categories: ['creation'],
                placement: { overview: true }
            },
            {
                id: 'simple-scan',
                storeSlot: 'simple_scan',
                title: 'Numériseur simple',
                sub: 'Numérisation',
                desc: 'Numérisez des documents avec votre scanner (RPM simple-scan).',
                version: '46.0',
                size: '~4 Mo',
                iconClass: 'gnome-software__cardicon--simple-scan',
                slot: 'simple_scan',
                source: 'rpm',
                categories: ['utilities'],
                placement: { overview: true }
            },
            {
                id: 'warpinator',
                storeSlot: 'warpinator',
                title: 'Warpinator',
                sub: 'Partage de fichiers',
                desc: 'Envoyez des fichiers sur le réseau local (Flatpak org.x.Warpinator).',
                version: '1.0',
                size: '~2 Mo',
                iconClass: 'gnome-software__cardicon--warpinator',
                slot: 'warpinator',
                source: 'flatpak',
                categories: ['utilities'],
                placement: { overview: true }
            },
            {
                id: 'timeshift',
                storeSlot: 'timeshift',
                title: 'Timeshift',
                sub: 'Sauvegardes système',
                desc: 'Créez des instantanés du système (Flatpak com.timeshift.TimeShift).',
                version: '24.0',
                size: '~15 Mo',
                iconClass: 'gnome-software__cardicon--timeshift',
                slot: 'timeshift',
                source: 'flatpak',
                categories: ['utilities'],
                placement: { overview: true }
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
