/**
 * Persistance thème clair/sombre par toolkit (gnome-theme, cosmic-theme, mint-theme).
 */
(function initCapsuleThemeStorage(global) {
    'use strict';

    const GNOME_BODY_IDS = new Set(['rocky', 'fedora', 'alma', 'ubuntu', 'anduinos']);
    const COSMIC_BODY_IDS = new Set(['popos']);

    function bodyId() {
        return global.document && global.document.body ? global.document.body.id : '';
    }

    function getThemeStorageKey(id) {
        const resolved = id || bodyId();
        if (GNOME_BODY_IDS.has(resolved)) {
            return 'gnome-theme';
        }
        if (COSMIC_BODY_IDS.has(resolved)) {
            return 'cosmic-theme';
        }
        return 'mint-theme';
    }

    function isGnomeShell(id) {
        return GNOME_BODY_IDS.has(id || bodyId());
    }

    function readSavedTheme(id) {
        const key = getThemeStorageKey(id);
        const saved = global.localStorage.getItem(key);
        if (saved === 'light' || saved === 'dark') {
            return saved;
        }
        if (key === 'gnome-theme' || key === 'cosmic-theme') {
            const legacy = global.localStorage.getItem('mint-theme');
            if (legacy === 'light' || legacy === 'dark') {
                global.localStorage.setItem(key, legacy);
                global.localStorage.removeItem('mint-theme');
                return legacy;
            }
        }
        return null;
    }

    function persistTheme(theme, id) {
        const resolved = theme === 'light' ? 'light' : 'dark';
        const key = getThemeStorageKey(id);
        global.localStorage.setItem(key, resolved);
        return resolved;
    }

    global.CapsuleThemeStorage = {
        getThemeStorageKey: getThemeStorageKey,
        isGnomeShell: isGnomeShell,
        readSavedTheme: readSavedTheme,
        persistTheme: persistTheme,
        GNOME_BODY_IDS: GNOME_BODY_IDS,
        COSMIC_BODY_IDS: COSMIC_BODY_IDS,
    };
}(typeof window !== 'undefined' ? window : globalThis));
