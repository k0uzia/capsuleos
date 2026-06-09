/**
 * Opérations Nemo Cinnamon — presse-papiers et propriétés (sans charger NautilusOps).
 */
(function initFileExplorerNemoOps(global) {
    'use strict';

    const isNemoCinnamon = () => (
        typeof global.isNemoTemplate === 'function' && global.isNemoTemplate()
    );

    const getState = () => global.fileExplorerState || null;

    const getNemoRoot = () => {
        if (typeof global.getExplorerWindowSlot === 'function') {
            return global.getExplorerWindowSlot();
        }
        return global.document.getElementById('nemo')
            || global.document.querySelector('div.windowElement#nemo[data-link="nemo"]');
    };

    const linkToEntry = (link) => {
        if (!link) {
            return null;
        }
        const state = getState();
        const name = link.getAttribute('data-item-name') || '';
        const parentPath = state && state.currentPath ? state.currentPath : '';
        const itemType = link.getAttribute('data-item-type')
            || (link.dataset && link.dataset.itemType)
            || 'file';
        const entry = {
            name: name,
            parentPath: parentPath,
            type: itemType === 'folder' ? 'folder' : 'file',
        };
        if (itemType === 'folder' && parentPath && name) {
            entry.targetPath = `${parentPath}/${name}`;
        }
        return entry;
    };

    const setExplorerClipboard = (op, entries) => {
        const state = getState();
        if (!state) {
            return;
        }
        state.explorerClipboard = entries && entries.length ? { op: op, entries: entries } : null;
    };

    const refreshView = () => {
        const state = getState();
        if (!state || !state.currentPath) {
            return;
        }
        if (typeof global.navigateToFileExplorerDirectory === 'function') {
            global.navigateToFileExplorerDirectory(state.currentPath, { updateHistory: false });
        } else if (typeof global.loadFileExplorerDirectory === 'function') {
            global.loadFileExplorerDirectory(state.currentPath);
        }
    };

    const cutExplorerSelection = (link) => {
        const entry = linkToEntry(link);
        if (!entry) {
            return { ok: false };
        }
        setExplorerClipboard('cut', [entry]);
        return { ok: true };
    };

    const copyExplorerSelection = (link) => {
        const entry = linkToEntry(link);
        if (!entry) {
            return { ok: false };
        }
        setExplorerClipboard('copy', [entry]);
        return { ok: true };
    };

    const pasteExplorerClipboard = async () => {
        const state = getState();
        const clip = state && state.explorerClipboard;
        const target = state && state.currentPath;
        if (!clip || !clip.entries || !clip.entries.length || !target) {
            return { ok: false };
        }
        let pasted = 0;
        for (let i = 0; i < clip.entries.length; i += 1) {
            const entry = clip.entries[i];
            if (clip.op === 'cut' && typeof global.moveExplorerItem === 'function') {
                const result = await global.moveExplorerItem(entry.parentPath, entry.name, target);
                if (result && result.ok) {
                    pasted += 1;
                }
            } else if (typeof global.copyExplorerItem === 'function') {
                const result = await global.copyExplorerItem(entry.parentPath, entry.name, target);
                if (result && result.ok) {
                    pasted += 1;
                }
            }
        }
        if (clip.op === 'cut') {
            setExplorerClipboard(null, []);
        }
        refreshView();
        return { ok: pasted > 0, count: pasted };
    };

    const hasPasteClipboard = () => {
        const state = getState();
        const clip = state && state.explorerClipboard;
        return !!(clip && clip.entries && clip.entries.length);
    };

    function openFileExplorerProperties(itemLink) {
        if (typeof global.openExplorerProperties !== 'function') {
            return false;
        }
        const item = itemLink ? linkToEntry(itemLink) : null;
        return global.openExplorerProperties(item);
    }

    function bindFileExplorerNemoOps() {
        if (!isNemoCinnamon()) {
            return;
        }
        const root = getNemoRoot();
        if (!root || root.dataset.nemoOpsInit === 'true') {
            return;
        }
        root.dataset.nemoOpsInit = 'true';
    }

    global.cutExplorerSelection = cutExplorerSelection;
    global.copyExplorerSelection = copyExplorerSelection;
    global.pasteExplorerClipboard = pasteExplorerClipboard;
    global.nemoHasPasteClipboard = hasPasteClipboard;
    global.openFileExplorerProperties = openFileExplorerProperties;
    global.bindFileExplorerNemoOps = bindFileExplorerNemoOps;

    if (global.document) {
        global.document.addEventListener('capsule:slot-injected', function onNemoSlot(event) {
            const detail = event.detail || {};
            if (detail.slotId === 'nemo' && detail.container && detail.container.dataset) {
                delete detail.container.dataset.nemoOpsInit;
                global.setTimeout(bindFileExplorerNemoOps, 0);
            }
        });
    }
}(typeof window !== 'undefined' ? window : globalThis));
