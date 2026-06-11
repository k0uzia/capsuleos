/**
 * Catalogue magasin Logithèque Mint — runtime browser.
 * Données : var/lib/capsuleos/generated/capsule-store-catalog.js (généré depuis contrats).
 * VM ground truth : apps pré-installées — section « À découvrir » via getDiscoverApps (storeInstallable ou defaultInstalled:false).
 */
(function initCapsuleMintStoreCatalog(global) {
    'use strict';

    var STORE_APPS_BY_REGISTRY = global.CAPSULE_STORE_APPS_BY_REGISTRY || {};

    function resolveRegistryId() {
        if (global.CAPSULE_SKIN_PROFILE_ID) {
            return global.CAPSULE_SKIN_PROFILE_ID;
        }
        var bodyId = global.document && global.document.body ? global.document.body.id : '';
        if (bodyId === 'mint') {
            return 'linux-mint';
        }
        return '';
    }

    function getStoreList() {
        var registryId = resolveRegistryId();
        return STORE_APPS_BY_REGISTRY[registryId] || [];
    }

    function isDiscoverEntry(entry) {
        if (!entry) {
            return false;
        }
        if (entry.storeInstallable === true) {
            return true;
        }
        return entry.defaultInstalled === false;
    }

    function getDiscoverApps(installedIds) {
        var storeList = getStoreList();
        var installed = installedIds || {};
        var result = [];
        var i;
        for (i = 0; i < storeList.length; i += 1) {
            var entry = storeList[i];
            if (!isDiscoverEntry(entry)) {
                continue;
            }
            if (installed[entry.id] === true || installed[entry.storeSlot] === true) {
                continue;
            }
            result.push(entry);
        }
        return result;
    }

    global.CapsuleMintStore = {
        resolveRegistryId: resolveRegistryId,
        getStoreList: getStoreList,
        getDiscoverApps: getDiscoverApps
    };
}(typeof window !== 'undefined' ? window : globalThis));
