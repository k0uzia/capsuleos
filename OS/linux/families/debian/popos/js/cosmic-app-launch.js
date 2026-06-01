/**
 * Lancement d’apps Pop!_OS - partagé launcher / Applications.
 */
(function (global) {
    function resolveLink(link) {
        if (typeof global.resolveCapsuleSlotDataLink === 'function') {
            return global.resolveCapsuleSlotDataLink(link);
        }
        return link === 'nemo' ? 'fileExplorer' : link;
    }

    function open(link) {
        if (!link) {
            return false;
        }
        var slotId = resolveLink(link);
        var target = document.querySelector('.windowElement[data-link="' + slotId + '"]');
        if (target && typeof global.openWindowByDataLink === 'function') {
            global.openWindowByDataLink(slotId);
            return true;
        }
        if (target && typeof global.openWindow === 'function') {
            global.openWindow(slotId);
            return true;
        }
        var dockLink = document.querySelector('.cosmic-dock__item[data-link="' + slotId + '"]')
            || document.querySelector('.cosmic-dock__item[data-link="' + link + '"]');
        if (dockLink) {
            dockLink.click();
            return true;
        }
        return false;
    }

    global.CosmicAppLaunch = { open: open };
})(typeof window !== 'undefined' ? window : this);
