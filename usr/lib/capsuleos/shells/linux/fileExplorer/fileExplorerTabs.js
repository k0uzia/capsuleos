/**
 * Onglets Nautilus GNOME (Ctrl+T, fermeture, synchronisation navigation).
 */
(function initFileExplorerTabs(global) {
    'use strict';

    let tabSeq = 1;

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

    const ensureTabState = () => {
        const state = global.fileExplorerState;
        if (!state) {
            return null;
        }
        if (!Array.isArray(state.tabs) || !state.tabs.length) {
            const root = typeof global.getFileExplorerRoot === 'function'
                ? global.getFileExplorerRoot()
                : 'home/public';
            const id = `tab-${tabSeq++}`;
            state.tabs = [{ id, path: state.currentPath || root, title: 'Dossier personnel' }];
            state.activeTabId = id;
        }
        if (!state.activeTabId) {
            state.activeTabId = state.tabs[0].id;
        }
        return state;
    };

    const resolveTabTitle = (path) => {
        if (path === global.CAPSULE_PLACE_RECENT) {
            return 'Récents';
        }
        if (path === global.CAPSULE_PLACE_STARRED) {
            return 'Favoris';
        }
        if (path === global.CAPSULE_PLACE_TRASH) {
            return 'Corbeille';
        }
        if (path === global.CAPSULE_PLACE_NETWORK) {
            return 'Réseau';
        }
        if (path === global.CAPSULE_PLACE_FILESYSTEM) {
            return '/';
        }
        const root = typeof global.getFileExplorerRoot === 'function'
            ? global.getFileExplorerRoot()
            : '';
        if (path === root) {
            return 'Dossier personnel';
        }
        if (typeof path === 'string' && path.startsWith(`${root}/`)) {
            return path.slice(root.length + 1).split('/').pop() || 'Dossier';
        }
        if (typeof path === 'string') {
            const parts = path.split('/');
            return parts[parts.length - 1] || 'Dossier';
        }
        return 'Dossier';
    };

    const getActiveTab = (state) => state.tabs.find((tab) => tab.id === state.activeTabId) || state.tabs[0];

    const renderTabs = () => {
        const root = getNemoRoot();
        const state = ensureTabState();
        const strip = root && root.querySelector('#nautilus-tabstrip');
        if (!root || !state || !strip) {
            return;
        }

        strip.innerHTML = '';
        state.tabs.forEach((tab) => {
            const btn = global.document.createElement('button');
            btn.type = 'button';
            btn.className = 'nautilus-app__tab';
            btn.setAttribute('role', 'tab');
            btn.dataset.tabId = tab.id;
            btn.setAttribute('aria-selected', tab.id === state.activeTabId ? 'true' : 'false');
            if (tab.id === state.activeTabId) {
                btn.classList.add('is-active');
            }

            const label = global.document.createElement('span');
            label.textContent = tab.title || resolveTabTitle(tab.path);
            btn.appendChild(label);

            if (state.tabs.length > 1) {
                const close = global.document.createElement('button');
                close.type = 'button';
                close.className = 'nautilus-app__tab-close';
                close.setAttribute('aria-label', 'Fermer l’onglet');
                close.textContent = '×';
                close.addEventListener('click', (event) => {
                    event.stopPropagation();
                    closeNautilusTab(tab.id);
                });
                btn.appendChild(close);
            }

            btn.addEventListener('click', () => {
                activateNautilusTab(tab.id);
            });
            strip.appendChild(btn);
        });
    };

    const syncActiveTabPath = () => {
        const state = ensureTabState();
        if (!state || !state.currentPath) {
            return;
        }
        const tab = getActiveTab(state);
        if (!tab) {
            return;
        }
        tab.path = state.currentPath;
        tab.title = resolveTabTitle(state.currentPath);
        renderTabs();
    };

    function activateNautilusTab(tabId) {
        const state = ensureTabState();
        const tab = state.tabs.find((entry) => entry.id === tabId);
        if (!tab) {
            return;
        }
        state.activeTabId = tab.id;
        renderTabs();
        if (typeof global.navigateToFileExplorerDirectory === 'function') {
            global.navigateToFileExplorerDirectory(tab.path, { updateHistory: true });
        }
    }

    function openNautilusTab(path) {
        const state = ensureTabState();
        const root = typeof global.getFileExplorerRoot === 'function'
            ? global.getFileExplorerRoot()
            : 'home/public';
        const targetPath = path || root;
        const id = `tab-${tabSeq++}`;
        state.tabs.push({
            id,
            path: targetPath,
            title: resolveTabTitle(targetPath),
        });
        state.activeTabId = id;
        renderTabs();
        if (typeof global.navigateToFileExplorerDirectory === 'function') {
            global.navigateToFileExplorerDirectory(targetPath, { updateHistory: true });
        }
    }

    function closeNautilusTab(tabId) {
        const state = ensureTabState();
        if (state.tabs.length <= 1) {
            return;
        }
        const index = state.tabs.findIndex((tab) => tab.id === tabId);
        if (index < 0) {
            return;
        }
        const wasActive = state.activeTabId === tabId;
        state.tabs.splice(index, 1);
        if (wasActive) {
            const next = state.tabs[Math.max(0, index - 1)] || state.tabs[0];
            state.activeTabId = next.id;
            if (typeof global.navigateToFileExplorerDirectory === 'function') {
                global.navigateToFileExplorerDirectory(next.path, { updateHistory: true });
            }
        }
        renderTabs();
    }

    const patchNavigation = () => {
        if (global.__nautilusTabsNavPatched || typeof global.navigateToFileExplorerDirectory !== 'function') {
            return;
        }
        const original = global.navigateToFileExplorerDirectory;
        global.navigateToFileExplorerDirectory = async function patchedNavigate(directory, options) {
            await original(directory, options);
            syncActiveTabPath();
        };
        global.__nautilusTabsNavPatched = true;
    };

    function bindFileExplorerTabs() {
        if (!isNautilusGnome()) {
            return;
        }
        const root = getNemoRoot();
        if (!root || root.dataset.nautilusTabsInit === 'true') {
            return;
        }
        ensureTabState();
        patchNavigation();
        syncActiveTabPath();
        renderTabs();
        root.dataset.nautilusTabsInit = 'true';
    }

    global.bindFileExplorerTabs = bindFileExplorerTabs;
    global.openNautilusTab = openNautilusTab;
    global.closeNautilusTab = closeNautilusTab;
    global.syncNautilusTabs = syncActiveTabPath;
}(typeof window !== 'undefined' ? window : globalThis));
