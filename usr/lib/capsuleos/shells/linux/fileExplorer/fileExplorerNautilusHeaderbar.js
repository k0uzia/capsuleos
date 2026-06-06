/**
 * Headerbar Nautilus 47 — boutons plateau titre, menus et barre recherche/emplacement.
 */
(function initFileExplorerNautilusHeaderbar(global) {
    'use strict';

    let openPopover = null;
    let openPopoverAnchor = null;

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

    const getState = () => global.fileExplorerState || null;

    const closePopover = () => {
        if (openPopover) {
            openPopover.hidden = true;
        }
        if (openPopoverAnchor) {
            openPopoverAnchor.setAttribute('aria-expanded', 'false');
        }
        openPopover = null;
        openPopoverAnchor = null;
    };

    const openPopoverAt = (menu, anchor, clientX, clientY) => {
        if (!menu || !anchor) {
            return;
        }
        closePopover();
        menu.hidden = false;
        const rect = menu.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        const left = clientX != null ? clientX : anchorRect.left;
        const top = clientY != null ? clientY : anchorRect.bottom + 4;
        const maxLeft = global.innerWidth - rect.width - 8;
        const maxTop = global.innerHeight - rect.height - 8;
        menu.style.left = `${Math.max(8, Math.min(left, maxLeft))}px`;
        menu.style.top = `${Math.max(8, Math.min(top, maxTop))}px`;
        anchor.setAttribute('aria-expanded', 'true');
        openPopover = menu;
        openPopoverAnchor = anchor;
    };

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

    const formatLocationBarValue = (path) => {
        const root = typeof global.getFileExplorerRoot === 'function'
            ? global.getFileExplorerRoot()
            : '';
        if (!path || path === root) {
            return '~';
        }
        if (path === global.CAPSULE_PLACE_FILESYSTEM) {
            return '/';
        }
        if (path === global.CAPSULE_PLACE_RECENT) {
            return 'recent://';
        }
        if (path === global.CAPSULE_PLACE_TRASH) {
            return 'trash://';
        }
        if (path === global.CAPSULE_PLACE_NETWORK) {
            return 'network://';
        }
        if (path === global.CAPSULE_PLACE_STARRED) {
            return 'starred://';
        }
        if (root && path.startsWith(`${root}/`)) {
            return `~/${path.slice(root.length + 1)}`;
        }
        return path;
    };

    const applyLocationBarMode = () => {
        const state = getState();
        const root = getNemoRoot();
        const input = root && root.querySelector('#nemo-search-input');
        if (!state || !input) {
            return;
        }
        if (state.locationBarMode === 'path') {
            input.value = formatLocationBarValue(state.currentPath);
            input.placeholder = 'Saisir un emplacement';
            input.setAttribute('aria-label', 'Emplacement');
        } else {
            if (!state.searchQuery) {
                input.value = '';
            }
            input.placeholder = 'Rechercher dans le dossier actuel';
            input.setAttribute('aria-label', 'Rechercher dans le dossier actuel');
        }
    };

    const setLocationBarMode = (mode) => {
        const state = getState();
        if (!state) {
            return;
        }
        state.locationBarMode = mode === 'path' ? 'path' : 'search';
        applyLocationBarMode();
        if (state.locationBarMode === 'path') {
            focusSearchInput(true);
        }
    };

    const toggleLocationBarMode = () => {
        const state = getState();
        if (!state) {
            return;
        }
        setLocationBarMode(state.locationBarMode === 'path' ? 'search' : 'path');
    };

    const syncMainMenuHiddenLabel = (root) => {
        const item = root.querySelector('[data-nautilus-menu="toggle-hidden"]');
        if (!item || !getState()) {
            return;
        }
        item.textContent = getState().showHiddenFiles
            ? 'Masquer les fichiers cachés'
            : 'Afficher les fichiers cachés';
    };

    const syncSearchFilterMenu = (root) => {
        const filter = (getState() && getState().searchFilter) || 'all';
        root.querySelectorAll('[data-nautilus-search-filter]').forEach((btn) => {
            const active = btn.dataset.nautilusSearchFilter === filter;
            btn.setAttribute('aria-checked', active ? 'true' : 'false');
            btn.classList.toggle('is-active', active);
        });
    };

    const setSearchFilter = (filter) => {
        const state = getState();
        if (!state) {
            return;
        }
        state.searchFilter = filter || 'all';
        if (typeof global.renderDirectory === 'function') {
            global.renderDirectory(state.currentPath, { pane: state.activePane || 'primary' });
        }
        if (typeof global.updatePathDisplay === 'function') {
            global.updatePathDisplay();
        }
        const root = getNemoRoot();
        if (root) {
            syncSearchFilterMenu(root);
        }
    };

    const runMainMenuAction = (action) => {
        closePopover();
        if (action === 'new-folder' && typeof global.createNewFolderInCurrentDirectory === 'function') {
            global.createNewFolderInCurrentDirectory();
            return;
        }
        if (action === 'new-tab' && typeof global.openNautilusTab === 'function') {
            const home = typeof global.getFileExplorerRoot === 'function'
                ? global.getFileExplorerRoot()
                : null;
            global.openNautilusTab(home);
            return;
        }
        if (action === 'refresh' && typeof global.refreshFileExplorerDirectory === 'function') {
            global.refreshFileExplorerDirectory();
            return;
        }
        if (action === 'toggle-hidden' && typeof global.toggleExplorerHiddenFiles === 'function') {
            global.toggleExplorerHiddenFiles();
            const root = getNemoRoot();
            if (root) {
                syncMainMenuHiddenLabel(root);
            }
            return;
        }
        if (action === 'preferences') {
            if (typeof global.openWindowByDataLink === 'function') {
                global.openWindowByDataLink('themes');
            }
        }
    };

    const runViewMenuAction = (action) => {
        closePopover();
        if (action === 'compact' && typeof global.setFileExplorerViewMode === 'function') {
            global.setFileExplorerViewMode('compact');
            return;
        }
        if (action === 'sort-name' && typeof global.refreshFileExplorerDirectory === 'function') {
            global.refreshFileExplorerDirectory();
            return;
        }
        if (action === 'refresh' && typeof global.refreshFileExplorerDirectory === 'function') {
            global.refreshFileExplorerDirectory();
        }
    };

    const bindPopoverMenu = (root, menu, anchorSelector, beforeOpen) => {
        const menuEl = root.querySelector(menu);
        const anchor = root.querySelector(anchorSelector);
        if (!menuEl || !anchor || anchor.dataset.nautilusPopoverBound === 'true') {
            return;
        }
        anchor.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!menuEl.hidden && openPopover === menuEl) {
                closePopover();
                return;
            }
            if (typeof beforeOpen === 'function') {
                beforeOpen(root);
            }
            openPopoverAt(menuEl, anchor);
        });
        anchor.dataset.nautilusPopoverBound = 'true';
    };

    const bindMenuItems = (root) => {
        root.querySelectorAll('[data-nautilus-menu]').forEach((item) => {
            if (item.dataset.nautilusMenuBound === 'true') {
                return;
            }
            item.addEventListener('click', (event) => {
                event.preventDefault();
                runMainMenuAction(item.dataset.nautilusMenu);
            });
            item.dataset.nautilusMenuBound = 'true';
        });

        root.querySelectorAll('[data-nautilus-search-filter]').forEach((item) => {
            if (item.dataset.nautilusFilterBound === 'true') {
                return;
            }
            item.addEventListener('click', (event) => {
                event.preventDefault();
                closePopover();
                setSearchFilter(item.dataset.nautilusSearchFilter);
            });
            item.dataset.nautilusFilterBound = 'true';
        });

        root.querySelectorAll('[data-nautilus-view]').forEach((item) => {
            if (item.dataset.nautilusViewBound === 'true') {
                return;
            }
            item.addEventListener('click', (event) => {
                event.preventDefault();
                runViewMenuAction(item.dataset.nautilusView);
            });
            item.dataset.nautilusViewBound = 'true';
        });
    };

    const bindPlateSearch = (root) => {
        const btn = root.querySelector('.nautilus-app__plate-search');
        if (!btn || btn.dataset.nautilusPlateSearchBound === 'true') {
            return;
        }
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            setLocationBarMode('search');
            focusSearchInput(true);
        });
        btn.dataset.nautilusPlateSearchBound = 'true';
    };

    const bindSearchInfo = (root) => {
        const btn = root.querySelector('.nautilus-app__search-info');
        if (!btn || btn.dataset.nautilusSearchInfoBound === 'true') {
            return;
        }
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const state = getState();
            if (state && state.locationBarMode === 'path') {
                if (typeof global.openExplorerProperties === 'function') {
                    global.openExplorerProperties(null);
                }
                return;
            }
            toggleLocationBarMode();
        });
        btn.dataset.nautilusSearchInfoBound = 'true';
    };

    const bindLocationBarEscape = (root) => {
        const input = root.querySelector('#nemo-search-input');
        if (!input || input.dataset.nautilusLocationEscapeBound === 'true') {
            return;
        }
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && getState() && getState().locationBarMode === 'path') {
                event.preventDefault();
                setLocationBarMode('search');
            }
        });
        input.dataset.nautilusLocationEscapeBound = 'true';
    };

    function bindFileExplorerNautilusHeaderbar() {
        if (!isNautilusGnome()) {
            return;
        }
        const root = getNemoRoot();
        if (!root) {
            return;
        }

        const state = getState();
        if (state) {
            if (!state.searchFilter) {
                state.searchFilter = 'all';
            }
            if (!state.locationBarMode) {
                state.locationBarMode = 'search';
            }
        }

        bindPlateSearch(root);
        bindSearchInfo(root);
        bindLocationBarEscape(root);
        bindMenuItems(root);
        bindPopoverMenu(root, '#nautilus-main-menu', '.nautilus-app__sidebar-menu-btn', syncMainMenuHiddenLabel);
        bindPopoverMenu(root, '#nautilus-search-filter-menu', '.nautilus-app__search-filter', syncSearchFilterMenu);
        bindPopoverMenu(root, '#nautilus-view-menu', '.nautilus-app__view-menu-btn');

        if (root.dataset.nautilusHeaderbarInit !== 'true') {
            global.document.addEventListener('click', (event) => {
                if (!openPopover || openPopover.hidden) {
                    return;
                }
                if (openPopover.contains(event.target) || (openPopoverAnchor && openPopoverAnchor.contains(event.target))) {
                    return;
                }
                closePopover();
            });
            global.document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    closePopover();
                }
            });
            global.addEventListener('resize', closePopover);
            root.dataset.nautilusHeaderbarInit = 'true';
        }

        applyLocationBarMode();
        syncSearchFilterMenu(root);
    }

    global.bindFileExplorerNautilusHeaderbar = bindFileExplorerNautilusHeaderbar;
    global.setNautilusLocationBarMode = setLocationBarMode;
    global.toggleNautilusLocationBarMode = toggleLocationBarMode;
    global.applyNautilusLocationBarMode = applyLocationBarMode;
    global.passesNautilusSearchFilter = function passesNautilusSearchFilter(item) {
        const filter = (getState() && getState().searchFilter) || 'all';
        if (!item) {
            return true;
        }
        if (filter === 'folders') {
            return item.type === 'folder';
        }
        if (filter === 'files') {
            return item.type !== 'folder';
        }
        return true;
    };

    if (global.document) {
        global.document.addEventListener('capsule:slot-injected', (event) => {
            const detail = event.detail || {};
            if (detail.slotId === 'nemo') {
                global.setTimeout(() => bindFileExplorerNautilusHeaderbar(), 0);
            }
        });
    }
}(typeof window !== 'undefined' ? window : globalThis));
