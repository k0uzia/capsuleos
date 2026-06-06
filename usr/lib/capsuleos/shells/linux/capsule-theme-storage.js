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

    const GNOME_ACCENTS = {
        blue: '#3584e4',
        teal: '#219a90',
        green: '#3a944a',
        yellow: '#c9a000',
        orange: '#ed5b00',
        red: '#e01b24',
        pink: '#d56199',
        purple: '#9141ac',
        slate: '#6f6f6f',
    };

    function getAccentStorageKey() {
        return 'gnome-accent';
    }

    function readSavedAccent() {
        const saved = global.localStorage.getItem(getAccentStorageKey());
        return saved && GNOME_ACCENTS[saved] ? saved : 'blue';
    }

    function persistAccent(accentId) {
        const resolved = GNOME_ACCENTS[accentId] ? accentId : 'blue';
        global.localStorage.setItem(getAccentStorageKey(), resolved);
        return resolved;
    }

    function getWallpaperStorageKey() {
        return 'gnome-wallpaper';
    }

    function readSavedWallpaper() {
        return global.localStorage.getItem(getWallpaperStorageKey()) || 'gemstone-skies';
    }

    function persistWallpaper(wallpaperId) {
        if (wallpaperId) {
            global.localStorage.setItem(getWallpaperStorageKey(), wallpaperId);
        }
        return wallpaperId;
    }

    const ACCENT_CSS_VARS = [
        '--menu-accent',
        '--gcc-accent',
        '--cluster-gnome-menu-accent',
        '--gnome-software-accent',
    ];

    function dispatchAppearanceEvent(name, detail) {
        if (global.document && typeof global.CustomEvent === 'function') {
            global.document.dispatchEvent(new global.CustomEvent(name, { detail: detail || {} }));
        }
    }

    function applyAccentColor(accentId) {
        const resolved = persistAccent(accentId);
        const color = GNOME_ACCENTS[resolved];
        ACCENT_CSS_VARS.forEach((varName) => setShellVar(varName, color));
        global.document.documentElement.dataset.gnomeAccent = resolved;
        dispatchAppearanceEvent('capsule:accent-changed', { accentId: resolved, color: color });
        return resolved;
    }

    function resolveWallpaperAssetUrl(relativePath) {
        const rel = `./assets/images/${relativePath}`;
        if (global.CapsuleResource && typeof global.CapsuleResource.resolve === 'function') {
            return global.CapsuleResource.resolve(rel);
        }
        return rel.replace('./assets/images/', '../../../usr/share/capsuleos/assets/images/');
    }

    /** URL absolue : les url() dans var(--fedora-bg) se résolvent depuis la feuille qui consomme la variable (style/), pas depuis le document. */
    function toAbsoluteWallpaperUrl(path) {
        if (!path || /^(https?:|data:|blob:|file:)/.test(path)) {
            return path;
        }
        const doc = global.document;
        if (!doc || !doc.baseURI) {
            return path;
        }
        try {
            return new URL(path, doc.baseURI).href;
        } catch (error) {
            return path;
        }
    }

    function getWallpaperVendor(bodyId) {
        return ['rocky', 'fedora', 'alma', 'ubuntu', 'anduinos'].includes(bodyId) ? 'rocky' : 'rocky';
    }

    function getWallpaperCatalog(bodyId) {
        const base = `vendors/${getWallpaperVendor(bodyId)}/wallpaper`;
        return [
            {
                id: 'gemstone-skies',
                label: 'Ciel de pierres',
                type: 'image',
                dark: `${base}/rocky-default-10-gemstone-skies-night.png`,
                light: `${base}/rocky-default-10-gemstone-skies-day.png`,
                default: true,
            },
            {
                id: 'sapphire',
                label: 'Saphir',
                type: 'image',
                dark: `${base}/rocky-default-10-sapphire.png`,
                light: `${base}/rocky-default-10-sapphire-light.png`,
            },
            {
                id: 'abstract-1',
                label: 'Abstrait 1',
                type: 'image',
                dark: `${base}/rocky-default-10-abstract-1-night.png`,
                light: `${base}/rocky-default-10-abstract-1-day.png`,
            },
            {
                id: 'abstract-2',
                label: 'Abstrait 2',
                type: 'image',
                dark: `${base}/rocky-default-10-abstract-2.png`,
                light: `${base}/rocky-default-10-abstract-2.png`,
            },
            {
                id: 'abstract-3',
                label: 'Abstrait 3',
                type: 'image',
                dark: `${base}/rocky-default-10-abstract-3.png`,
                light: `${base}/rocky-default-10-abstract-3.png`,
            },
            {
                id: 'abstract-4',
                label: 'Abstrait 4',
                type: 'image',
                dark: `${base}/rocky-default-10-abstract-4.png`,
                light: `${base}/rocky-default-10-abstract-4.png`,
            },
            {
                id: 'abstract-5',
                label: 'Abstrait 5',
                type: 'image',
                dark: `${base}/rocky-default-10-abstract-5.png`,
                light: `${base}/rocky-default-10-abstract-5.png`,
            },
            {
                id: 'solid-graphite',
                label: 'Graphite',
                type: 'color',
                dark: 'linear-gradient(165deg, #2e2e32 0%, #1c1c1f 100%)',
                light: 'linear-gradient(165deg, #ececf0 0%, #d4d4da 100%)',
            },
            {
                id: 'solid-ocean',
                label: 'Océan',
                type: 'color',
                dark: 'linear-gradient(145deg, #1a3d5c 0%, #0c1f33 55%, #061018 100%)',
                light: 'linear-gradient(145deg, #8ecae6 0%, #caf0f8 55%, #e8f6fc 100%)',
            },
            {
                id: 'solid-wine',
                label: 'Grenat',
                type: 'color',
                dark: 'linear-gradient(155deg, #4a2038 0%, #2a1020 100%)',
                light: 'linear-gradient(155deg, #e8b4c8 0%, #f8e0ea 100%)',
            },
        ];
    }

    function resolveWallpaperEntry(entry, theme) {
        const mode = theme === 'light' ? 'light' : 'dark';
        if (!entry) {
            return '';
        }
        if (entry.type === 'color' || (!entry.dark && !entry.light && entry[mode])) {
            return entry[mode] || entry.dark || entry.light || '';
        }
        const file = mode === 'light' ? entry.light : entry.dark;
        return `url("${toAbsoluteWallpaperUrl(resolveWallpaperAssetUrl(file))}")`;
    }

    function findWallpaperEntry(wallpaperId, skinId) {
        const catalog = getWallpaperCatalog(skinId || bodyId());
        return catalog.find((item) => item.id === wallpaperId)
            || catalog.find((item) => item.default)
            || catalog[0];
    }

    function setShellVar(name, value) {
        const root = global.document.documentElement;
        root.style.setProperty(name, value);
        if (global.document.body) {
            global.document.body.style.setProperty(name, value);
        }
    }

    function applyWallpaperBackground(value, wallpaperId) {
        setShellVar('--fedora-bg', value);
        global.document.documentElement.dataset.gnomeWallpaper = wallpaperId || '';
        if (global.document.body) {
            global.document.body.dataset.gnomeWallpaper = wallpaperId || '';
        }
        dispatchAppearanceEvent('capsule:wallpaper-changed', {
            wallpaperId: wallpaperId,
            background: value,
        });
    }

    function applyWallpaper(wallpaperId, skinId) {
        if (wallpaperId === 'custom') {
            return wallpaperId;
        }
        const entry = findWallpaperEntry(wallpaperId, skinId);
        const theme = global.document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
        const background = resolveWallpaperEntry(entry, theme);
        applyWallpaperBackground(background, entry.id);
        persistWallpaper(entry.id);
        return entry.id;
    }

    function applyCustomWallpaper(objectUrl) {
        applyWallpaperBackground(`url("${objectUrl}")`, 'custom');
        persistWallpaper('custom');
        return 'custom';
    }

    const DISPLAY_RESOLUTION_KEYS = {
        '1920 × 1080': '1920x1080',
        '1680 × 1050': '1680x1050',
        '1280 × 720': '1280x720',
    };

    const DISPLAY_SCALE_KEYS = {
        '100 %': '100',
        '125 %': '125',
        '150 %': '150',
        '200 %': '200',
    };

    const DISPLAY_ORIENTATION_KEYS = {
        Paysage: 'landscape',
        'Paysage (inversé)': 'landscape-reverse',
        Portrait: 'portrait',
    };

    function readPref(key, fallback) {
        return global.localStorage.getItem(key) || fallback;
    }

    function persistPref(key, value) {
        global.localStorage.setItem(key, value);
        return value;
    }

    function applyDisplayResolution(label) {
        const resolved = DISPLAY_RESOLUTION_KEYS[label] || '1920x1080';
        global.document.documentElement.dataset.displayResolution = resolved;
        persistPref('gnome-display-resolution', label);
        return label;
    }

    function applyDisplayScale(label) {
        const resolved = DISPLAY_SCALE_KEYS[label] || '100';
        global.document.documentElement.dataset.displayScale = resolved;
        persistPref('gnome-display-scale', label);
        return label;
    }

    function applyDisplayOrientation(label) {
        const resolved = DISPLAY_ORIENTATION_KEYS[label] || 'landscape';
        global.document.documentElement.dataset.displayOrientation = resolved;
        persistPref('gnome-display-orientation', label);
        return label;
    }

    function applyNightLight(enabled) {
        const on = !!enabled;
        global.document.documentElement.dataset.nightLight = on ? 'on' : 'off';
        persistPref('gnome-night-light', on ? 'on' : 'off');
        return on;
    }

    function applyContrastMode(mode) {
        const resolved = mode === 'high' ? 'high' : 'normal';
        global.document.documentElement.dataset.contrastMode = resolved;
        persistPref('mint-contrast-mode', resolved);
        return resolved;
    }

    function applyFontScale(scale) {
        const resolved = ['110', '125'].includes(scale) ? scale : '100';
        global.document.documentElement.dataset.fontScale = resolved;
        persistPref('mint-font-scale', resolved);
        return resolved;
    }

    function applyGnomeShellPreferences() {
        applyDisplayResolution(readPref('gnome-display-resolution', '1920 × 1080'));
        applyDisplayScale(readPref('gnome-display-scale', '100 %'));
        applyDisplayOrientation(readPref('gnome-display-orientation', 'Paysage'));
        applyNightLight(readPref('gnome-night-light', 'off') === 'on');
        applyContrastMode(readPref('mint-contrast-mode', 'normal'));
        applyFontScale(readPref('mint-font-scale', '100'));
    }

    global.CapsuleThemeStorage = {
        getThemeStorageKey: getThemeStorageKey,
        isGnomeShell: isGnomeShell,
        readSavedTheme: readSavedTheme,
        persistTheme: persistTheme,
        getAccentStorageKey: getAccentStorageKey,
        readSavedAccent: readSavedAccent,
        persistAccent: persistAccent,
        applyAccentColor: applyAccentColor,
        GNOME_ACCENTS: GNOME_ACCENTS,
        getWallpaperStorageKey: getWallpaperStorageKey,
        readSavedWallpaper: readSavedWallpaper,
        persistWallpaper: persistWallpaper,
        getWallpaperCatalog: getWallpaperCatalog,
        getWallpaperVendor: getWallpaperVendor,
        findWallpaperEntry: findWallpaperEntry,
        resolveWallpaperEntry: resolveWallpaperEntry,
        applyWallpaper: applyWallpaper,
        applyCustomWallpaper: applyCustomWallpaper,
        applyWallpaperBackground: applyWallpaperBackground,
        resolveWallpaperAssetUrl: resolveWallpaperAssetUrl,
        GNOME_ACCENT_COLORS: GNOME_ACCENTS,
        applyDisplayResolution: applyDisplayResolution,
        applyDisplayScale: applyDisplayScale,
        applyDisplayOrientation: applyDisplayOrientation,
        applyNightLight: applyNightLight,
        applyContrastMode: applyContrastMode,
        applyFontScale: applyFontScale,
        applyGnomeShellPreferences: applyGnomeShellPreferences,
        setShellVar: setShellVar,
        DISPLAY_RESOLUTION_KEYS: DISPLAY_RESOLUTION_KEYS,
        DISPLAY_SCALE_KEYS: DISPLAY_SCALE_KEYS,
        GNOME_BODY_IDS: GNOME_BODY_IDS,
        COSMIC_BODY_IDS: COSMIC_BODY_IDS,
    };
}(typeof window !== 'undefined' ? window : globalThis));
