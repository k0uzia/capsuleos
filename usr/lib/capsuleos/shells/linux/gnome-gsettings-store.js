/**
 * Couche gsettings simulée côté navigateur — persistance schema::key alignée VM GNOME.
 * Source bindings : root/tools/lab/gnome-settings-parity-matrix.json
 */
(function initCapsuleGnomeGSettings(global) {
    'use strict';

    const STORAGE_PREFIX = 'gsettings::';
    const MIGRATED_FLAG = 'gsettings::capsule-migrated-v1';
    const SEEDED_FLAG = 'gsettings::baseline-seeded-v1';

    /** @type {Record<string, { controlId: string, schema: string, key: string, map: string }>} */
    const BINDINGS_BY_CAPSULE_KEY = {
        'mint-theme': { controlId: 'theme', schema: 'org.gnome.desktop.interface', key: 'color-scheme', map: 'colorScheme' },
        'gnome-theme': { controlId: 'theme', schema: 'org.gnome.desktop.interface', key: 'color-scheme', map: 'colorScheme' },
        'gnome-accent': { controlId: 'accent', schema: 'org.gnome.desktop.interface', key: 'accent-color', map: 'accentColor' },
        'gnome-wallpaper': { controlId: 'wallpaper', schema: 'org.gnome.desktop.background', key: 'picture-uri', map: 'wallpaperUri' },
        'gnome-notifications-enabled': { controlId: 'notifications', schema: 'org.gnome.desktop.notifications', key: 'show-banners', map: 'boolOnOff' },
        'gnome-lock-notifications': { controlId: 'lock-notifications', schema: 'org.gnome.desktop.notifications', key: 'show-in-lock-screen', map: 'boolOnOff' },
        'gnome-search-history': { controlId: 'search-history', schema: 'org.gnome.desktop.search-providers', key: 'disabled', map: 'searchProvidersInverted' },
        'gnome-dynamic-workspaces': { controlId: 'dynamic-workspaces', schema: 'org.gnome.mutter', key: 'dynamic-workspaces', map: 'enabledLabelFr' },
        'gnome-hot-corner': { controlId: 'hot-corner', schema: 'org.gnome.desktop.interface', key: 'enable-hot-corners', map: 'enabledLabelFr' },
        'gnome-apps-all-workspaces': { controlId: 'apps-all-workspaces', schema: 'org.gnome.shell.app-switcher', key: 'current-workspace-only', map: 'workspaceOnlyInverted' },
        'gnome-sound-alert': { controlId: 'sound-alert', schema: 'org.gnome.desktop.sound', key: 'theme-name', map: 'soundTheme' },
        'gnome-power-dim-screen': { controlId: 'power-dim', schema: 'org.gnome.settings-daemon.plugins.power', key: 'sleep-inactive-ac-timeout', map: 'powerDimTimeout' },
        'gnome-power-sleep': { controlId: 'power-sleep', schema: 'org.gnome.settings-daemon.plugins.power', key: 'sleep-inactive-ac-type', map: 'powerSleepType' },
        'gnome-display-scale': { controlId: 'display-scale', schema: 'org.gnome.desktop.interface', key: 'text-scaling-factor', map: 'textScalingPercent' },
        'gnome-night-light': { controlId: 'night-light', schema: 'org.gnome.settings-daemon.plugins.color', key: 'night-light-enabled', map: 'boolOnOff' },
        'gnome-mouse-handedness': { controlId: 'mouse-handedness', schema: 'org.gnome.desktop.peripherals.mouse', key: 'left-handed', map: 'mouseHandedness' },
        'gnome-pointer-speed': { controlId: 'pointer-speed', schema: 'org.gnome.desktop.peripherals.mouse', key: 'speed', map: 'pointerSpeedPercent' },
        'gnome-touchpad-enabled': { controlId: 'touchpad', schema: 'org.gnome.desktop.peripherals.touchpad', key: 'send-events', map: 'touchpadEnabled' },
        'gnome-tap-to-click': { controlId: 'tap-to-click', schema: 'org.gnome.desktop.peripherals.touchpad', key: 'tap-to-click', map: 'boolOnOff' },
        'gnome-scroll-direction': { controlId: 'scroll-direction', schema: 'org.gnome.desktop.peripherals.touchpad', key: 'natural-scroll', map: 'scrollDirection' },
        'gnome-keyboard-layout': { controlId: 'keyboard-layout', schema: 'org.gnome.desktop.input-sources', key: 'sources', map: 'keyboardLayoutFr' },
        'gnome-keyboard-repeat-delay': { controlId: 'keyboard-repeat', schema: 'org.gnome.desktop.peripherals.keyboard', key: 'delay', map: 'keyboardDelayMs' },
        'mint-contrast-mode': { controlId: 'contrast', schema: 'org.gnome.desktop.interface', key: 'gtk-theme', map: 'gtkHighContrast' },
        'mint-font-scale': { controlId: 'font-scale', schema: 'org.gnome.desktop.interface', key: 'text-scaling-factor', map: 'fontScalePercent' },
        'gnome-privacy-camera': { controlId: 'camera', schema: 'org.gnome.desktop.privacy', key: 'disable-camera', map: 'privacyInverted' },
        'gnome-privacy-microphone': { controlId: 'microphone', schema: 'org.gnome.desktop.privacy', key: 'disable-microphone', map: 'privacyInverted' },
        'gnome-auto-lock': { controlId: 'auto-lock', schema: 'org.gnome.desktop.screensaver', key: 'lock-enabled', map: 'boolOnOff' },
        'gnome-lock-delay': { controlId: 'lock-delay', schema: 'org.gnome.desktop.screensaver', key: 'lock-delay', map: 'lockDelayFr' },
    };

    function parseBool(raw) {
        const v = String(raw || '').trim().toLowerCase();
        return v === 'true' || v === "'true'" || v === 'on' || v === '1';
    }

    function stripGvariant(raw) {
        const s = String(raw || '');
        if (s.startsWith("'") && s.endsWith("'")) {
            return s.slice(1, -1);
        }
        return s;
    }

    function parseUint32(raw) {
        const m = String(raw || '').match(/uint32\s+(\d+)/i);
        if (m) {
            return Number(m[1]);
        }
        const digits = String(raw || '').replace(/[^\d]/g, '');
        return digits ? Number(digits) : 0;
    }

    const MAPS = {
        boolOnOff: {
            toCapsule(raw) {
                return parseBool(raw) ? 'on' : 'off';
            },
            fromCapsule(capsule) {
                return capsule === 'on' ? 'true' : 'false';
            },
        },
        enabledLabelFr: {
            toCapsule(raw) {
                return parseBool(raw) ? 'Activé' : 'Désactivé';
            },
            fromCapsule(capsule) {
                return capsule === 'Activé' ? 'true' : 'false';
            },
        },
        workspaceOnlyInverted: {
            toCapsule(raw) {
                return parseBool(raw) ? 'Désactivé' : 'Activé';
            },
            fromCapsule(capsule) {
                return capsule === 'Activé' ? 'false' : 'true';
            },
        },
        mouseHandedness: {
            toCapsule(raw) {
                return parseBool(raw) ? 'Droit' : 'Gauche';
            },
            fromCapsule(capsule) {
                return capsule === 'Droit' ? 'true' : 'false';
            },
        },
        scrollDirection: {
            toCapsule(raw) {
                return parseBool(raw) ? 'Naturel' : 'Standard';
            },
            fromCapsule(capsule) {
                return capsule === 'Naturel' ? 'true' : 'false';
            },
        },
        touchpadEnabled: {
            toCapsule(raw) {
                const enabled = String(raw).includes('enabled');
                return enabled ? 'on' : 'off';
            },
            fromCapsule(capsule) {
                return capsule === 'on' ? "'enabled'" : "'disabled'";
            },
        },
        privacyInverted: {
            toCapsule(raw) {
                return parseBool(raw) ? 'off' : 'on';
            },
            fromCapsule(capsule) {
                return capsule === 'on' ? 'false' : 'true';
            },
        },
        colorScheme: {
            toCapsule(raw) {
                const scheme = stripGvariant(raw).toLowerCase();
                return scheme.includes('light') ? 'light' : 'dark';
            },
            fromCapsule(capsule) {
                return capsule === 'light' ? "'prefer-light'" : "'prefer-dark'";
            },
        },
        accentColor: {
            toCapsule(raw) {
                return stripGvariant(raw);
            },
            fromCapsule(capsule) {
                return `'${capsule || 'blue'}'`;
            },
        },
        soundTheme: {
            toCapsule(raw) {
                const theme = stripGvariant(raw);
                return ['freedesktop', 'default', 'gnome'].includes(theme) ? 'Ding' : theme;
            },
            fromCapsule(capsule) {
                if (capsule === 'Aucun') {
                    return "'freedesktop'";
                }
                return capsule === 'Ding' ? "'freedesktop'" : `'${capsule}'`;
            },
        },
        textScalingPercent: {
            toCapsule(raw) {
                const factor = Number(raw);
                if (!Number.isFinite(factor)) {
                    return null;
                }
                return `${Math.round(factor * 100)} %`;
            },
            fromCapsule(capsule) {
                const pct = Number(String(capsule).replace(/[^\d]/g, ''));
                return String((Number.isFinite(pct) ? pct : 100) / 100);
            },
        },
        fontScalePercent: {
            toCapsule(raw) {
                const factor = Number(raw);
                if (!Number.isFinite(factor)) {
                    return '100';
                }
                const pct = Math.round(factor * 100);
                if (pct >= 125) {
                    return '125';
                }
                if (pct >= 110) {
                    return '110';
                }
                return '100';
            },
            fromCapsule(capsule) {
                const pct = Number(String(capsule).replace(/[^\d]/g, '')) || 100;
                return String(pct / 100);
            },
        },
        pointerSpeedPercent: {
            toCapsule(raw) {
                const speed = Number(raw);
                if (!Number.isFinite(speed)) {
                    return '50';
                }
                const pct = Math.round((speed + 1.0) * 50);
                return String(Math.max(0, Math.min(100, pct)));
            },
            fromCapsule(capsule) {
                const pct = Number(capsule) || 50;
                return String((pct / 50) - 1.0);
            },
        },
        keyboardDelayMs: {
            toCapsule(raw) {
                const sec = parseUint32(raw);
                return sec ? `${sec} ms` : null;
            },
            fromCapsule(capsule) {
                const ms = Number(String(capsule).replace(/[^\d]/g, '')) || 500;
                return `uint32 ${ms}`;
            },
        },
        lockDelayFr: {
            toCapsule(raw) {
                const sec = parseUint32(raw);
                if (sec === 0) {
                    return 'Immédiatement';
                }
                if (sec <= 60) {
                    return '1 minute';
                }
                return '5 minutes';
            },
            fromCapsule(capsule) {
                if (capsule === 'Immédiatement') {
                    return 'uint32 0';
                }
                if (capsule === '1 minute') {
                    return 'uint32 60';
                }
                return 'uint32 300';
            },
        },
        powerDimTimeout: {
            toCapsule(raw) {
                const sec = Number(raw);
                if (!Number.isFinite(sec)) {
                    return null;
                }
                const mapping = { 300: '5 minutes', 600: '10 minutes', 900: '15 minutes', 0: 'Jamais' };
                return mapping[sec] || `${sec}s`;
            },
            fromCapsule(capsule) {
                const reverse = {
                    '5 minutes': '300',
                    '10 minutes': '600',
                    '15 minutes': '900',
                    Jamais: '0',
                };
                return reverse[capsule] || '900';
            },
        },
        powerSleepType: {
            toCapsule(raw) {
                const val = stripGvariant(raw);
                const mapping = { suspend: '30 minutes', hibernate: '1 heure', nothing: 'Jamais' };
                return mapping[val] || val;
            },
            fromCapsule(capsule) {
                const reverse = {
                    '30 minutes': "'suspend'",
                    '1 heure': "'hibernate'",
                    Jamais: "'nothing'",
                };
                return reverse[capsule] || "'suspend'";
            },
        },
        keyboardLayoutFr: {
            toCapsule(raw) {
                const lower = String(raw).toLowerCase();
                if (lower.includes('fr')) {
                    return 'Français';
                }
                if (lower.includes('bepo')) {
                    return 'Français (BÉPO)';
                }
                return 'English (US)';
            },
            fromCapsule(capsule) {
                if (capsule === 'Français (BÉPO)') {
                    return "[('xkb', 'fr+bepo')]";
                }
                if (capsule === 'Français') {
                    return "[('xkb', 'fr+oss')]";
                }
                return "[('xkb', 'us')]";
            },
        },
        searchProvidersInverted: {
            toCapsule(raw) {
                const empty = String(raw).trim() === '[]' || String(raw).trim() === '@as []';
                return empty ? 'on' : 'off';
            },
            fromCapsule(capsule) {
                return capsule === 'on' ? '@as []' : "@as ['org.gnome.Settings']";
            },
        },
        gtkHighContrast: {
            toCapsule(raw) {
                const theme = stripGvariant(raw).toLowerCase().replace(/[-_]/g, '');
                return theme.includes('highcontrast') ? 'high' : 'normal';
            },
            fromCapsule(capsule) {
                return capsule === 'high' ? "'HighContrast'" : "'Adwaita'";
            },
        },
        wallpaperUri: {
            toCapsule(raw) {
                return stripGvariant(raw);
            },
            fromCapsule(capsule) {
                if (String(capsule).startsWith('file://') || String(capsule).startsWith('/')) {
                    const path = String(capsule).startsWith('file://') ? capsule : `file://${capsule}`;
                    return `'${path}'`;
                }
                return `'file:///usr/share/backgrounds/${capsule}.png'`;
            },
        },
    };

    function storageKey(schema, key) {
        return `${STORAGE_PREFIX}${schema}::${key}`;
    }

    function dispatch(name, detail) {
        if (global.document && typeof global.CustomEvent === 'function') {
            global.document.dispatchEvent(new global.CustomEvent(name, { detail: detail || {} }));
        }
    }

    function getRaw(schema, key) {
        return global.localStorage.getItem(storageKey(schema, key));
    }

    function setRaw(schema, key, raw) {
        const prev = getRaw(schema, key);
        global.localStorage.setItem(storageKey(schema, key), raw);
        if (prev !== raw) {
            dispatch('capsule:gsettings-changed', { schema, key, value: raw, previous: prev });
        }
        return raw;
    }

    function hasBinding(capsuleKey) {
        return Boolean(BINDINGS_BY_CAPSULE_KEY[capsuleKey]);
    }

    function getBinding(capsuleKey) {
        return BINDINGS_BY_CAPSULE_KEY[capsuleKey] || null;
    }

    function legacyToCapsule(capsuleKey, legacy) {
        if (legacy == null || legacy === '') {
            return null;
        }
        if (legacy === 'on' || legacy === 'true') {
            return 'on';
        }
        if (legacy === 'off' || legacy === 'false') {
            return 'off';
        }
        if (capsuleKey === 'gnome-theme' || capsuleKey === 'mint-theme') {
            return legacy === 'light' || legacy === 'dark' ? legacy : null;
        }
        return legacy;
    }

    function mirrorLegacy(capsuleKey, capsuleValue) {
        if (capsuleKey === 'mint-theme') {
            const themeKey = 'gnome-theme';
            if (capsuleValue === 'light' || capsuleValue === 'dark') {
                global.localStorage.setItem(themeKey, capsuleValue);
            }
        }
        if (capsuleValue === 'on' || capsuleValue === 'off') {
            global.localStorage.setItem(capsuleKey, capsuleValue);
            return;
        }
        global.localStorage.setItem(capsuleKey, capsuleValue);
    }

    function getCapsule(capsuleKey, fallback) {
        const binding = getBinding(capsuleKey);
        if (!binding) {
            const legacy = global.localStorage.getItem(capsuleKey);
            return legacy != null && legacy !== '' ? legacy : fallback;
        }
        let raw = getRaw(binding.schema, binding.key);
        if (raw == null || raw === '') {
            const legacy = global.localStorage.getItem(capsuleKey);
            const legacyCapsule = legacyToCapsule(capsuleKey, legacy);
            if (legacyCapsule != null) {
                setCapsule(capsuleKey, legacyCapsule);
                return legacyCapsule;
            }
            return fallback;
        }
        const mapper = MAPS[binding.map];
        if (mapper && typeof mapper.toCapsule === 'function') {
            const mapped = mapper.toCapsule(raw);
            return mapped != null && mapped !== '' ? mapped : fallback;
        }
        return raw;
    }

    function setCapsule(capsuleKey, capsuleValue) {
        const binding = getBinding(capsuleKey);
        mirrorLegacy(capsuleKey, capsuleValue);
        if (!binding) {
            return capsuleValue;
        }
        const mapper = MAPS[binding.map];
        const raw = mapper && typeof mapper.fromCapsule === 'function'
            ? mapper.fromCapsule(capsuleValue)
            : String(capsuleValue);
        setRaw(binding.schema, binding.key, raw);
        if (capsuleKey === 'gnome-sound-alert') {
            setRaw('org.gnome.desktop.sound', 'event-sounds', capsuleValue === 'Aucun' ? 'false' : 'true');
        }
        return capsuleValue;
    }

    function getBool(capsuleKey, fallback) {
        const v = getCapsule(capsuleKey, fallback === true || fallback === 'on' ? 'on' : 'off');
        if (v === 'on' || v === 'true') {
            return true;
        }
        if (v === 'off' || v === 'false') {
            return false;
        }
        return Boolean(fallback);
    }

    function setBool(capsuleKey, on) {
        return setCapsule(capsuleKey, on ? 'on' : 'off');
    }

    function listSchema(schema) {
        const prefix = `${STORAGE_PREFIX}${schema}::`;
        const out = {};
        for (let i = 0; i < global.localStorage.length; i += 1) {
            const k = global.localStorage.key(i);
            if (k && k.startsWith(prefix)) {
                const key = k.slice(prefix.length);
                out[key] = global.localStorage.getItem(k);
            }
        }
        return out;
    }

    function exportSnapshot() {
        const out = {};
        Object.values(BINDINGS_BY_CAPSULE_KEY).forEach((binding) => {
            const pair = `${binding.schema}::${binding.key}`;
            const raw = getRaw(binding.schema, binding.key);
            if (raw != null) {
                out[pair] = raw;
            }
        });
        return out;
    }

    function importSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            return;
        }
        Object.entries(snapshot).forEach(([pair, raw]) => {
            const idx = pair.indexOf('::');
            if (idx < 1) {
                return;
            }
            setRaw(pair.slice(0, idx), pair.slice(idx + 2), String(raw));
        });
    }

    function migrateLegacyStorage() {
        if (global.localStorage.getItem(MIGRATED_FLAG) === '1') {
            return;
        }
        Object.keys(BINDINGS_BY_CAPSULE_KEY).forEach((capsuleKey) => {
            const legacy = global.localStorage.getItem(capsuleKey);
            if (legacy == null || legacy === '') {
                return;
            }
            if (getRaw(BINDINGS_BY_CAPSULE_KEY[capsuleKey].schema, BINDINGS_BY_CAPSULE_KEY[capsuleKey].key)) {
                return;
            }
            const capsule = legacyToCapsule(capsuleKey, legacy);
            if (capsule != null) {
                setCapsule(capsuleKey, capsule);
            }
        });
        global.localStorage.setItem(MIGRATED_FLAG, '1');
    }

    function seedFromVmBaseline() {
        if (global.localStorage.getItem(SEEDED_FLAG) === '1') {
            return;
        }
        const baseline = global.CAPSULE_VM_SETTINGS_BASELINE;
        if (!baseline || typeof baseline !== 'object') {
            return;
        }
        Object.values(baseline).forEach((entry) => {
            if (!entry || !entry.schema || !entry.key || entry.capsuleExpected == null) {
                return;
            }
            if (getRaw(entry.schema, entry.key)) {
                return;
            }
            setCapsule(entry.capsuleKey || entry.id, String(entry.capsuleExpected));
        });
        global.localStorage.setItem(SEEDED_FLAG, '1');
    }

    function init() {
        migrateLegacyStorage();
        seedFromVmBaseline();
    }

    global.CapsuleGnomeGSettings = {
        BINDINGS_BY_CAPSULE_KEY,
        MAPS,
        hasBinding,
        getBinding,
        getRaw,
        setRaw,
        getCapsule,
        setCapsule,
        getBool,
        setBool,
        listSchema,
        exportSnapshot,
        importSnapshot,
        init,
        storageKey,
    };

    init();
}(typeof window !== 'undefined' ? window : globalThis));
