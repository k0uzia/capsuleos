/**
 * Interactions GNOME Fichiers (Nautilus 47) — raccourcis, nouveau dossier, barre d’emplacement.
 */
(function initFileExplorerNautilus(global) {
    'use strict';

    const getNemoRoot = () => {
        if (typeof global.getExplorerWindowSlot === 'function') {
            return global.getExplorerWindowSlot();
        }
        return global.document.getElementById('nemo')
            || global.document.querySelector('div.windowElement#nemo[data-link="nemo"]');
    };

    const isNautilusGnome = () => (
        typeof global.isNautilusGnomeTemplate === 'function' && global.isNautilusGnomeTemplate()
    );

    const focusSearchInput = (selectAll) => {
        const root = getNemoRoot();
        const input = root && root.querySelector('#nemo-search-input');
        if (!input) {
            return null;
        }
        input.focus();
        if (selectAll && typeof input.select === 'function') {
            input.select();
        }
        return input;
    };

    const resolvePathFromLocationInput = (rawValue) => {
        const value = String(rawValue || '').trim();
        if (!value) {
            return null;
        }

        const root = typeof global.getFileExplorerRoot === 'function'
            ? global.getFileExplorerRoot()
            : 'home/public';
        const manifest = global.fileExplorerState && global.fileExplorerState.manifest;
        const folders = manifest && manifest.folders ? manifest.folders : null;

        if (value === '/') {
            return global.CAPSULE_PLACE_FILESYSTEM || '__capsule/place/filesystem';
        }

        if (value === '~' || value === '~/') {
            return root;
        }

        if (value.startsWith('~/')) {
            const sub = value.slice(2);
            const candidate = `${root}/${sub}`.replace(/\/+/g, '/').replace(/\/+$/, '');
            if (!folders || folders[candidate]) {
                return candidate;
            }
        }

        if (value.startsWith('/')) {
            const tail = value.replace(/^\/+/, '');
            if (!tail) {
                return global.CAPSULE_PLACE_FILESYSTEM || '__capsule/place/filesystem';
            }
            const fromRoot = `${root}/${tail}`.replace(/\/+/g, '/').replace(/\/+$/, '');
            if (!folders || folders[fromRoot]) {
                return fromRoot;
            }
        }

        const direct = value.replace(/\/+$/, '');
        if (folders && folders[direct]) {
            return direct;
        }

        const fromHome = `${root}/${direct}`.replace(/\/+/g, '/').replace(/\/+$/, '');
        if (folders && folders[fromHome]) {
            return fromHome;
        }

        const placeMap = typeof global.buildNemoPlaceFolderMap === 'function'
            ? global.buildNemoPlaceFolderMap(root)
            : null;
        if (placeMap) {
            const match = Object.entries(placeMap).find(([label]) => (
                label.toLowerCase() === direct.toLowerCase()
            ));
            if (match) {
                return match[1];
            }
        }

        return null;
    };

    const navigateFromLocationInput = (rawValue) => {
        const target = resolvePathFromLocationInput(rawValue);
        if (!target || typeof global.navigateToFileExplorerDirectory !== 'function') {
            return false;
        }
        global.navigateToFileExplorerDirectory(target, { updateHistory: true });
        return true;
    };

    const adjustZoom = (delta) => {
        const state = global.fileExplorerState;
        const settings = { min: 80, max: 140, defaultValue: 100, step: 10 };
        const current = state && state.zoomValue != null ? state.zoomValue : settings.defaultValue;
        const next = Math.max(settings.min, Math.min(settings.max, current + delta));
        if (typeof global.applyFileExplorerZoom === 'function') {
            global.applyFileExplorerZoom(next);
        }
    };

    const bindKeyboardShortcuts = (root) => {
        if (root.dataset.nautilusKeyboardInit === 'true') {
            return;
        }

        global.document.addEventListener('keydown', (event) => {
            if (!isNautilusGnome()) {
                return;
            }
            const win = getNemoRoot();
            if (!win || win.style.display === 'none') {
                return;
            }
            if (!win.contains(global.document.activeElement) && global.document.activeElement !== global.document.body) {
                const tag = global.document.activeElement && global.document.activeElement.tagName;
                if (tag && tag !== 'BODY' && !win.contains(global.document.activeElement)) {
                    return;
                }
            }

            const ctrl = event.ctrlKey || event.metaKey;
            const key = event.key;

            if (ctrl && !event.shiftKey && (key === 'l' || key === 'L')) {
                event.preventDefault();
                focusSearchInput(true);
                return;
            }

            if (ctrl && !event.shiftKey && (key === 'f' || key === 'F')) {
                event.preventDefault();
                focusSearchInput(true);
                return;
            }

            if (ctrl && !event.shiftKey && (key === 'h' || key === 'H')) {
                event.preventDefault();
                if (typeof global.toggleExplorerHiddenFiles === 'function') {
                    global.toggleExplorerHiddenFiles();
                }
                return;
            }

            if (ctrl && !event.shiftKey && key === '1') {
                event.preventDefault();
                if (typeof global.setFileExplorerViewMode === 'function') {
                    global.setFileExplorerViewMode('icons');
                }
                return;
            }

            if (ctrl && !event.shiftKey && key === '2') {
                event.preventDefault();
                if (typeof global.setFileExplorerViewMode === 'function') {
                    global.setFileExplorerViewMode('list');
                }
                return;
            }

            if (ctrl && event.shiftKey && (key === 'n' || key === 'N')) {
                event.preventDefault();
                if (typeof global.createNewFolderInCurrentDirectory === 'function') {
                    global.createNewFolderInCurrentDirectory();
                }
                return;
            }

            if (ctrl && !event.shiftKey && (key === 't' || key === 'T')) {
                event.preventDefault();
                if (typeof global.openNautilusTab === 'function') {
                    const root = typeof global.getFileExplorerRoot === 'function'
                        ? global.getFileExplorerRoot()
                        : null;
                    global.openNautilusTab(root);
                }
                return;
            }

            if (ctrl && (key === '+' || key === '=')) {
                event.preventDefault();
                adjustZoom(10);
                return;
            }

            if (ctrl && key === '-') {
                event.preventDefault();
                adjustZoom(-10);
                return;
            }

            if (key === 'F5') {
                event.preventDefault();
                if (typeof global.refreshFileExplorerDirectory === 'function') {
                    global.refreshFileExplorerDirectory();
                }
            }
        });

        root.dataset.nautilusKeyboardInit = 'true';
    };

    const bindNewFolderButton = (root) => {
        const btn = root.querySelector('.nautilus-app__new-folder-btn');
        if (!btn || btn.dataset.nautilusNewFolderBound === 'true') {
            return;
        }
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            if (typeof global.createNewFolderInCurrentDirectory === 'function') {
                global.createNewFolderInCurrentDirectory();
            }
        });
        btn.dataset.nautilusNewFolderBound = 'true';
    };

    const bindLocationBar = (root) => {
        const input = root.querySelector('#nemo-search-input');
        if (!input || input.dataset.nautilusLocationBound === 'true') {
            return;
        }

        input.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') {
                return;
            }
            const value = String(input.value || '').trim();
            if (!value || (!value.startsWith('/') && !value.startsWith('~'))) {
                return;
            }
            const navigated = navigateFromLocationInput(value);
            if (!navigated) {
                return;
            }
            event.preventDefault();
            if (global.fileExplorerState) {
                global.fileExplorerState.searchQuery = '';
            }
            input.value = '';
            if (typeof global.renderDirectory === 'function' && global.fileExplorerState) {
                global.renderDirectory(global.fileExplorerState.currentPath, {
                    pane: global.fileExplorerState.activePane || 'primary'
                });
            }
            if (typeof global.updatePathDisplay === 'function') {
                global.updatePathDisplay();
            }
        });

        input.dataset.nautilusLocationBound = 'true';
    };

    function bindFileExplorerNautilusFeatures() {
        if (!isNautilusGnome()) {
            return;
        }
        const root = getNemoRoot();
        if (!root) {
            return;
        }
        bindNewFolderButton(root);
        bindLocationBar(root);
        bindKeyboardShortcuts(root);
    }

    global.bindFileExplorerNautilusFeatures = bindFileExplorerNautilusFeatures;
}(typeof window !== 'undefined' ? window : globalThis));
