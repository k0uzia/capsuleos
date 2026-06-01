/**
 * Configuration gestionnaire de fichiers (slot `data-link="fileExplorer"`).
 * Charger après le bloc `window.CAPSULE_*` de la skin, avant `capsule-app-embed.js`.
 */
(function initCapsuleFileManagerConfig(global) {
    const SUFFIXES = ['TEMPLATE', 'SKIN_KEY', 'DISPLAY_NAME', 'APP_ID', 'LIST_VIEW'];

    const FILE_EXPLORER_SLOT = 'fileExplorer';
    const LEGACY_FILE_EXPLORER_SLOTS = ['nemo', 'fileExplorer'];

    const LEGACY_TEMPLATE_MAP = {
        'nemo-gnome': 'nautilus',
        'nemo-cosmic': 'nautilus-cosmic'
    };

    const LEGACY_SKIN_MAP = {
        files: 'nautilus'
    };

    const LEGACY_APP_ID_MAP = {
        nemo: 'fileExplorer'
    };

    /** Anciens `data-link` / attributs de lancement → slot fenêtre courant. */
    const LEGACY_SLOT_LINK_MAP = {
        nemo: FILE_EXPLORER_SLOT
    };

    const readRaw = (suffix) => {
        const fmKey = `CAPSULE_FILE_MANAGER_${suffix}`;
        const legacyKey = `CAPSULE_EXPLORER_${suffix}`;
        if (global[fmKey] !== undefined && global[fmKey] !== null) {
            return global[fmKey];
        }
        if (global[legacyKey] !== undefined && global[legacyKey] !== null) {
            return global[legacyKey];
        }
        return undefined;
    };

    const normalizeTemplateId = (value) => {
        if (value === undefined || value === null || value === '') {
            return value;
        }
        const trimmed = String(value).replace(/\/+$/, '');
        return LEGACY_TEMPLATE_MAP[trimmed] || trimmed;
    };

    const normalizeSkinKey = (value) => {
        if (value === undefined || value === null || value === '') {
            return value;
        }
        const trimmed = String(value).replace(/\/+$/, '');
        return LEGACY_SKIN_MAP[trimmed] || trimmed;
    };

    const installExplorerAliases = () => {
        SUFFIXES.forEach((suffix) => {
            const fmKey = `CAPSULE_FILE_MANAGER_${suffix}`;
            const legacyKey = `CAPSULE_EXPLORER_${suffix}`;
            const existing = Object.getOwnPropertyDescriptor(global, legacyKey);
            if (existing && existing.get) {
                return;
            }
            Object.defineProperty(global, legacyKey, {
                get() {
                    return global[fmKey];
                },
                set(value) {
                    global[fmKey] = value;
                },
                configurable: true,
                enumerable: true
            });
        });
    };

    const normalizeFileManagerConfig = () => {
        SUFFIXES.forEach((suffix) => {
            const fmKey = `CAPSULE_FILE_MANAGER_${suffix}`;
            const legacyKey = `CAPSULE_EXPLORER_${suffix}`;
            if (global[fmKey] === undefined && global[legacyKey] !== undefined) {
                global[fmKey] = global[legacyKey];
            }
        });

        if (global.CAPSULE_FILE_MANAGER_TEMPLATE !== undefined) {
            global.CAPSULE_FILE_MANAGER_TEMPLATE = normalizeTemplateId(
                global.CAPSULE_FILE_MANAGER_TEMPLATE
            );
        }

        if (global.CAPSULE_FILE_MANAGER_SKIN_KEY !== undefined) {
            global.CAPSULE_FILE_MANAGER_SKIN_KEY = normalizeSkinKey(
                global.CAPSULE_FILE_MANAGER_SKIN_KEY
            );
        }

        installExplorerAliases();
    };

    global.normalizeFileManagerConfig = normalizeFileManagerConfig;

    global.getFileManagerTemplate = () => {
        const template = normalizeTemplateId(readRaw('TEMPLATE'));
        return template || 'nemo';
    };

    global.getFileManagerSkinKey = () => {
        const skin = readRaw('SKIN_KEY');
        if (skin !== undefined && skin !== null && String(skin) !== '') {
            return normalizeSkinKey(skin);
        }
        return getFileManagerTemplate();
    };

    global.getFileManagerDisplayName = () => {
        const name = readRaw('DISPLAY_NAME');
        if (name !== undefined && name !== null && String(name) !== '') {
            return String(name);
        }
        return 'Fichiers';
    };

    global.getFileManagerAppId = () => {
        const appId = readRaw('APP_ID');
        if (appId !== undefined && appId !== null && String(appId) !== '') {
            const normalized = String(appId);
            return LEGACY_APP_ID_MAP[normalized] || normalized;
        }
        return FILE_EXPLORER_SLOT;
    };

    global.CAPSULE_FILE_EXPLORER_SLOT = FILE_EXPLORER_SLOT;

    global.getFileExplorerSlotId = () => global.getFileManagerAppId();

    global.resolveCapsuleSlotDataLink = (raw) => {
        if (raw === undefined || raw === null || raw === '') {
            return raw;
        }
        const id = String(raw).trim();
        return LEGACY_SLOT_LINK_MAP[id] || id;
    };

    global.getFileExplorerWindowRoot = () => {
        const slotId = global.getFileExplorerSlotId();
        let root = document.getElementById(slotId);
        if (!root && slotId === FILE_EXPLORER_SLOT) {
            root = document.getElementById('nemo');
        }
        return root;
    };

    global.isFileExplorerSlot = (slotId) => LEGACY_FILE_EXPLORER_SLOTS.includes(slotId);

    global.getFileManagerListView = () => global.CAPSULE_FILE_MANAGER_LIST_VIEW === true;

    global.resolveFileManagerCssBaseTemplateId = (templateId) => {
        const legacyNautilus = new Set(['nemo-gnome', 'nemo-cosmic']);
        if (legacyNautilus.has(templateId)) {
            return 'nemo';
        }
        if (templateId === 'mainMenu-gnome') {
            return 'mainMenu-gnome';
        }
        return templateId;
    };

    global.isGnomeNautilusFileManager = () => {
        const skin = global.getFileManagerSkinKey();
        const template = global.getFileManagerTemplate();
        return skin === 'nautilus' || skin === 'files' || template === 'nautilus';
    };

    normalizeFileManagerConfig();
}(typeof window !== 'undefined' ? window : globalThis));
