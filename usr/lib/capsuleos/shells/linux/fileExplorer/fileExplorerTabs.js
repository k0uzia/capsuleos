/**
 * Onglets Nautilus GNOME — état isolé par onglet + persistance localStorage.
 */
(function initFileExplorerTabs(global) {
    'use strict';

    let tabSeq = 1;
    let restoringTabs = false;

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

    const getTabsStorageKey = () => {
        const skin = global.document && global.document.body ? global.document.body.id : 'default';
        const root = typeof global.getFileExplorerRoot === 'function'
            ? global.getFileExplorerRoot()
            : 'home/public';
        return `capsule-nautilus-tabs:${skin}:${root}`;
    };

    const createEmptyTab = (path, id) => {
        const tabId = id || `tab-${tabSeq++}`;
        const normalizedPath = path || (typeof global.getFileExplorerRoot === 'function'
            ? global.getFileExplorerRoot()
            : 'home/public');
        return {
            id: tabId,
            path: normalizedPath,
            title: resolveTabTitle(normalizedPath),
            history: [normalizedPath],
            historyIndex: 0,
            searchQuery: '',
            viewMode: 'icons',
            searchFilter: 'all',
            searchMode: 'fulltext',
            sortOrder: 'name-asc',
            nautilusChromeMode: 'breadcrumb',
            locationBarMode: 'search',
        };
    };

    const serializeTab = (tab) => ({
        id: tab.id,
        path: tab.path,
        title: tab.title,
        history: Array.isArray(tab.history) ? tab.history.slice() : [tab.path],
        historyIndex: typeof tab.historyIndex === 'number' ? tab.historyIndex : 0,
        searchQuery: tab.searchQuery || '',
        viewMode: tab.viewMode || 'icons',
        searchFilter: tab.searchFilter || 'all',
        searchMode: tab.searchMode || 'fulltext',
        sortOrder: tab.sortOrder || 'name-asc',
        nautilusChromeMode: tab.nautilusChromeMode || 'breadcrumb',
        locationBarMode: tab.locationBarMode || 'search',
    });

    const deserializeTab = (raw) => {
        if (!raw || !raw.id || !raw.path) {
            return null;
        }
        const tab = createEmptyTab(raw.path, raw.id);
        tab.title = raw.title || tab.title;
        tab.history = Array.isArray(raw.history) && raw.history.length ? raw.history.slice() : [tab.path];
        tab.historyIndex = typeof raw.historyIndex === 'number'
            ? Math.max(0, Math.min(raw.historyIndex, tab.history.length - 1))
            : tab.history.length - 1;
        tab.path = tab.history[tab.historyIndex] || tab.path;
        tab.searchQuery = raw.searchQuery || '';
        tab.viewMode = raw.viewMode || 'icons';
        tab.searchFilter = raw.searchFilter || 'all';
        tab.searchMode = raw.searchMode || 'fulltext';
        tab.sortOrder = raw.sortOrder || 'name-asc';
        tab.nautilusChromeMode = raw.nautilusChromeMode
            || (raw.locationBarMode === 'path' ? 'location' : 'breadcrumb');
        tab.locationBarMode = raw.locationBarMode || 'search';
        return tab;
    };

    const persistTabsToStorage = () => {
        const state = global.fileExplorerState;
        if (!state || !Array.isArray(state.tabs) || restoringTabs) {
            return;
        }
        const active = getActiveTab(state);
        if (active) {
            captureTabSession(active, state);
        }
        try {
            const payload = {
                activeTabId: state.activeTabId,
                tabSeq,
                tabs: state.tabs.map(serializeTab),
            };
            global.localStorage.setItem(getTabsStorageKey(), JSON.stringify(payload));
        } catch (error) {
            /* quota / mode privé */
        }
    };

    const loadTabsFromStorage = () => {
        try {
            const raw = global.localStorage.getItem(getTabsStorageKey());
            if (!raw) {
                return null;
            }
            const payload = JSON.parse(raw);
            if (!payload || !Array.isArray(payload.tabs) || !payload.tabs.length) {
                return null;
            }
            const tabs = payload.tabs.map(deserializeTab).filter(Boolean);
            if (!tabs.length) {
                return null;
            }
            if (typeof payload.tabSeq === 'number' && payload.tabSeq > 0) {
                tabSeq = payload.tabSeq;
            } else {
                tabSeq = tabs.length + 1;
            }
            const activeTabId = payload.activeTabId && tabs.some((tab) => tab.id === payload.activeTabId)
                ? payload.activeTabId
                : tabs[0].id;
            return { tabs, activeTabId };
        } catch (error) {
            return null;
        }
    };

    const ensureTabState = () => {
        const state = global.fileExplorerState;
        if (!state) {
            return null;
        }
        if (!Array.isArray(state.tabs) || !state.tabs.length) {
            const stored = loadTabsFromStorage();
            if (stored) {
                state.tabs = stored.tabs;
                state.activeTabId = stored.activeTabId;
            } else {
                const root = typeof global.getFileExplorerRoot === 'function'
                    ? global.getFileExplorerRoot()
                    : 'home/public';
                const tab = createEmptyTab(state.currentPath || root);
                state.tabs = [tab];
                state.activeTabId = tab.id;
            }
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

    const captureTabSession = (tab, state) => {
        if (!tab || !state) {
            return;
        }
        tab.path = state.currentPath || tab.path;
        tab.title = resolveTabTitle(tab.path);
        tab.history = Array.isArray(state.history) ? state.history.slice() : [tab.path];
        tab.historyIndex = typeof state.historyIndex === 'number' ? state.historyIndex : tab.history.length - 1;
        tab.searchQuery = state.searchQuery || '';
        tab.viewMode = state.viewMode || 'icons';
        tab.searchFilter = state.searchFilter || 'all';
        tab.searchMode = state.searchMode || 'fulltext';
        tab.sortOrder = state.sortOrder || 'name-asc';
        tab.nautilusChromeMode = state.nautilusChromeMode || 'breadcrumb';
        tab.locationBarMode = state.locationBarMode || 'search';
    };

    const syncSearchInputFromState = (state) => {
        const root = getNemoRoot();
        const input = root && root.querySelector('#nemo-search-input');
        if (!input || !state) {
            return;
        }
        input.value = state.searchQuery || '';
        if (typeof global.applyNautilusChrome === 'function') {
            global.applyNautilusChrome();
        } else if (typeof global.applyNautilusLocationBarMode === 'function') {
            global.applyNautilusLocationBarMode();
        }
    };

    const applyTabSession = (tab, state) => {
        if (!tab || !state) {
            return;
        }
        state.currentPath = tab.path;
        state.history = Array.isArray(tab.history) && tab.history.length
            ? tab.history.slice()
            : [tab.path];
        state.historyIndex = typeof tab.historyIndex === 'number'
            ? Math.max(0, Math.min(tab.historyIndex, state.history.length - 1))
            : state.history.length - 1;
        state.currentPath = state.history[state.historyIndex] || tab.path;
        tab.path = state.currentPath;
        state.searchQuery = tab.searchQuery || '';
        state.viewMode = tab.viewMode || 'icons';
        state.searchFilter = tab.searchFilter || 'all';
        state.searchMode = tab.searchMode || 'fulltext';
        state.sortOrder = tab.sortOrder || 'name-asc';
        state.nautilusChromeMode = tab.nautilusChromeMode || 'breadcrumb';
        state.locationBarMode = tab.locationBarMode || 'search';
        syncSearchInputFromState(state);
    };

    const refreshActiveTabView = async () => {
        const state = global.fileExplorerState;
        if (!state || !state.currentPath) {
            return;
        }
        if (typeof global.renderDirectory === 'function') {
            global.renderDirectory(state.currentPath, { pane: state.activePane || 'primary' });
        }
        if (typeof global.updatePathDisplay === 'function') {
            global.updatePathDisplay();
        }
        if (typeof global.updateNavigationControls === 'function') {
            global.updateNavigationControls();
        }
        if (typeof global.applyFileExplorerViewMode === 'function') {
            global.applyFileExplorerViewMode();
        }
        if (typeof global.updateDolphinSidebarActive === 'function') {
            global.updateDolphinSidebarActive();
        }
        if (typeof global.applyNautilusLocationBarMode === 'function') {
            global.applyNautilusLocationBarMode();
        }
    };

    const renderTabs = () => {
        const root = getNemoRoot();
        const state = ensureTabState();
        const strip = root && root.querySelector('#nautilus-tabstrip');
        if (!root || !state || !strip) {
            return;
        }

        strip.innerHTML = '';
        state.tabs.forEach((tab, index) => {
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

            if (index < state.tabs.length - 1) {
                btn.classList.add('has-separator');
            }

            btn.addEventListener('click', () => {
                activateNautilusTab(tab.id);
            });
            strip.appendChild(btn);
        });
    };

    const syncActiveTabSession = () => {
        const state = ensureTabState();
        if (!state || !state.currentPath || restoringTabs) {
            return;
        }
        const tab = getActiveTab(state);
        if (!tab) {
            return;
        }
        captureTabSession(tab, state);
        tab.title = resolveTabTitle(tab.path);
        renderTabs();
        persistTabsToStorage();
    };

    async function activateNautilusTab(tabId) {
        const state = ensureTabState();
        const target = state.tabs.find((entry) => entry.id === tabId);
        if (!target || state.activeTabId === tabId) {
            return;
        }

        const current = getActiveTab(state);
        if (current) {
            captureTabSession(current, state);
        }

        restoringTabs = true;
        state.activeTabId = target.id;
        applyTabSession(target, state);
        renderTabs();

        if (typeof global.navigateToFileExplorerDirectory === 'function') {
            await global.navigateToFileExplorerDirectory(state.currentPath, { updateHistory: false });
        } else {
            await refreshActiveTabView();
        }

        restoringTabs = false;
        persistTabsToStorage();
    }

    async function openNautilusTab(path) {
        const state = ensureTabState();
        const root = typeof global.getFileExplorerRoot === 'function'
            ? global.getFileExplorerRoot()
            : 'home/public';
        const targetPath = path || root;

        const current = getActiveTab(state);
        if (current) {
            captureTabSession(current, state);
        }

        const tab = createEmptyTab(targetPath);
        tab.viewMode = state.viewMode || 'icons';
        tab.searchFilter = state.searchFilter || 'all';
        state.tabs.push(tab);
        state.activeTabId = tab.id;

        restoringTabs = true;
        applyTabSession(tab, state);
        renderTabs();

        if (typeof global.navigateToFileExplorerDirectory === 'function') {
            await global.navigateToFileExplorerDirectory(targetPath, { updateHistory: false });
        } else {
            await refreshActiveTabView();
        }

        restoringTabs = false;
        persistTabsToStorage();
    }

    async function closeNautilusTab(tabId) {
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
            await activateNautilusTab(next.id);
        } else {
            renderTabs();
        }
        persistTabsToStorage();
    }

    const patchNavigation = () => {
        if (global.__nautilusTabsNavPatched || typeof global.navigateToFileExplorerDirectory !== 'function') {
            return;
        }
        const original = global.navigateToFileExplorerDirectory;
        global.navigateToFileExplorerDirectory = async function patchedNavigate(directory, options) {
            await original(directory, options);
            if (!restoringTabs) {
                syncActiveTabSession();
            }
        };
        global.__nautilusTabsNavPatched = true;
    };

    async function bindFileExplorerTabs() {
        if (!isNautilusGnome()) {
            return;
        }
        const root = getNemoRoot();
        if (!root) {
            return;
        }

        patchNavigation();
        const state = ensureTabState();
        const active = getActiveTab(state);

        if (root.dataset.nautilusTabsInit !== 'true') {
            restoringTabs = true;
            if (active) {
                applyTabSession(active, state);
                if (typeof global.navigateToFileExplorerDirectory === 'function') {
                    await global.navigateToFileExplorerDirectory(state.currentPath, { updateHistory: false });
                } else {
                    await refreshActiveTabView();
                }
            }
            restoringTabs = false;
            root.dataset.nautilusTabsInit = 'true';
        }

        syncActiveTabSession();
        renderTabs();
        persistTabsToStorage();
    }

    global.bindFileExplorerTabs = bindFileExplorerTabs;
    global.openNautilusTab = openNautilusTab;
    global.closeNautilusTab = closeNautilusTab;
    global.syncNautilusTabs = syncActiveTabSession;
    global.persistNautilusTabs = persistTabsToStorage;

    if (global.document) {
        global.document.addEventListener('capsule:slot-injected', (event) => {
            const detail = event.detail || {};
            if (detail.slotId === 'nemo') {
                delete getNemoRoot()?.dataset?.nautilusTabsInit;
                global.setTimeout(() => bindFileExplorerTabs(), 0);
            }
        });
    }
}(typeof window !== 'undefined' ? window : globalThis));
