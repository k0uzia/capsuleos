/**
 * Menu contextuel — zone fichiers et éléments (gabarit Nautilus GNOME).
 */
(function initFileExplorerContextMenu(global) {
    'use strict';

    let contextTarget = null;
    let contextProfile = 'background';

    const getNemoRoot = () => {
        if (typeof global.getExplorerWindowSlot === 'function') {
            return global.getExplorerWindowSlot();
        }
        return global.document.getElementById('nemo')
            || global.document.querySelector('div.windowElement#nemo[data-link="nemo"]');
    };

    const usesAdvancedExplorerOps = () => (
        typeof global.usesAdvancedExplorerOps === 'function' && global.usesAdvancedExplorerOps()
    );

    const getMenu = (root) => {
        if (!root) {
            return null;
        }
        return root.querySelector('#nemo-context-menu')
            || root.querySelector('main#gestionnaire #nemo-context-menu')
            || root.querySelector('main.dolphin-app #nemo-context-menu');
    };

    const getContextMenuHost = (root) => (
        root.querySelector('#voletContainer')
        || root.querySelector('.dolphin-content-wrap')
        || root.querySelector('main#gestionnaire')
        || root
    );

    const closeMenu = (menu) => {
        if (!menu) {
            return;
        }
        menu.hidden = true;
        contextTarget = null;
    };

    const isDolphinExplorer = () => (
        typeof global.isDolphinTemplate === 'function' && global.isDolphinTemplate()
    );

    const resolveContextProfile = (root, target, options = {}) => {
        if (options.sidebarTrash) {
            return 'trash';
        }
        const path = global.fileExplorerState && global.fileExplorerState.currentPath;
        if (path === global.CAPSULE_PLACE_TRASH) {
            return target ? 'trash-item' : 'trash';
        }
        if (!target) {
            return 'background';
        }
        if (isDolphinExplorer()) {
            const type = target.dataset && target.dataset.itemType === 'folder' ? 'folder' : 'file';
            return type === 'folder' ? 'item-folder' : 'item-file';
        }
        return 'item';
    };

    const applyMenuScope = (menu, profile) => {
        contextProfile = profile || 'background';
        if (typeof global !== 'undefined') {
            global.__nautilusContextMenuProfile = contextProfile;
        }
        menu.querySelectorAll('[data-nemo-ctx-scope]').forEach((node) => {
            const scopes = String(node.dataset.nemoCtxScope || '').split(/\s+/).filter(Boolean);
            const show = scopes.includes(profile)
                || scopes.includes('both')
                || (profile === 'item-folder' && scopes.includes('item'))
                || (profile === 'item-file' && scopes.includes('item'));
            node.hidden = !show;
        });
        if (isDolphinExplorer()) {
            syncDolphinContextLabels(menu, profile);
        }
        if (typeof global.syncNautilusClipboardUi === 'function') {
            global.syncNautilusClipboardUi();
        }
    };

    const syncDolphinContextLabels = (menu, profile) => {
        menu.querySelectorAll('[data-dolphin-ctx-label-folder]').forEach((labelNode) => {
            const folderLabel = labelNode.dataset.dolphinCtxLabelFolder;
            const fileLabel = labelNode.dataset.dolphinCtxLabelFile;
            if (profile === 'item-file' && fileLabel) {
                labelNode.textContent = fileLabel;
            } else if (folderLabel) {
                labelNode.textContent = folderLabel;
            }
        });
    };

    const selectContextTarget = (root, target) => {
        if (!root) {
            return;
        }
        root.querySelectorAll('.nemoElement .nemo-app__item--selected, .nemo-app__content-grid .nemo-app__item--selected')
            .forEach((el) => {
                el.classList.remove('nemo-app__item--selected');
            });
        if (target) {
            target.classList.add('nemo-app__item--selected');
            if (typeof global.updateNautilusSelectionStatus === 'function') {
                global.updateNautilusSelectionStatus(target);
            }
        } else if (typeof global.updateNautilusSelectionStatus === 'function') {
            global.updateNautilusSelectionStatus(null);
        }
    };

    const openMenu = (menu, clientX, clientY, target, root, options = {}) => {
        contextTarget = target || null;
        if (root) {
            selectContextTarget(root, target);
        }
        applyMenuScope(menu, resolveContextProfile(root, target, options));
        menu.style.position = 'fixed';
        menu.hidden = false;
        menu.style.visibility = 'hidden';
        menu.style.left = '0px';
        menu.style.top = '0px';
        void menu.offsetHeight;
        const rect = menu.getBoundingClientRect();
        const maxLeft = Math.max(8, global.innerWidth - rect.width - 8);
        const maxTop = Math.max(8, global.innerHeight - rect.height - 8);
        menu.style.left = `${Math.max(8, Math.min(clientX, maxLeft))}px`;
        menu.style.top = `${Math.max(8, Math.min(clientY, maxTop))}px`;
        menu.style.visibility = '';
    };

    const getItemFromLink = (link) => {
        if (!link || !link.dataset) {
            return null;
        }
        const name = link.dataset.itemName;
        if (!name) {
            return null;
        }
        return {
            name,
            type: link.dataset.itemType || 'file',
            folderPath: link.dataset.itemFolderPath || '',
            targetPath: link.dataset.itemTargetPath || '',
            href: link.dataset.itemHref || ''
        };
    };

    const showItemProperties = (item) => {
        if (typeof global.openExplorerProperties === 'function') {
            global.openExplorerProperties(item);
            return;
        }
        if (!item) {
            const path = global.fileExplorerState && global.fileExplorerState.currentPath;
            global.alert(`Emplacement : ${path || '—'}`);
            return;
        }
        const kind = item.type === 'folder' ? 'Dossier' : 'Fichier';
        const location = item.targetPath || (item.folderPath ? `${item.folderPath}/${item.name}` : item.name);
        global.alert(`${kind} : ${item.name}\nEmplacement : ${location}`);
    };

    const resolveExplorerTerminalCwd = (itemData) => {
        if (itemData && itemData.type === 'folder' && itemData.targetPath) {
            return itemData.targetPath;
        }
        if (global.fileExplorerState && global.fileExplorerState.currentPath) {
            return global.fileExplorerState.currentPath;
        }
        return null;
    };

    const openContextItem = (item, link) => {
        if (!item || !link) {
            return;
        }
        if (typeof global.activateNautilusExplorerItem === 'function') {
            const path = link.dataset.itemFolderPath
                || (global.fileExplorerState && global.fileExplorerState.currentPath)
                || '';
            const payload = Object.assign({}, item, {
                path: item.targetPath || item.path,
                href: item.href || link.dataset.itemHref,
                type: item.type || link.dataset.itemType,
            });
            global.activateNautilusExplorerItem(link, payload, path);
            return;
        }
        if (item.type === 'folder' && item.targetPath && typeof global.navigateToFileExplorerDirectory === 'function') {
            const explorerRoot = link.closest('.windowElement[data-link="nemo"]');
            global.navigateToFileExplorerDirectory(item.targetPath, {
                updateHistory: true,
                explorerRoot: explorerRoot || undefined,
            });
            return;
        }
        link.click();
    };

    const selectAllItems = (root) => {
        const grid = root.querySelector('.nemoElement, .nemo-app__content-grid');
        if (!grid) {
            return;
        }
        const links = [...grid.querySelectorAll('a[data-item-name]')];
        if (!links.length) {
            return;
        }
        links.forEach((link) => link.classList.add('nemo-app__item--selected'));
        if (typeof global.updateNautilusSelectionStatus === 'function') {
            global.updateNautilusSelectionStatus(links[links.length - 1]);
        }
    };

    const KDE_NEMO = './assets/images/toolkits/kde/elements/nemo/';

    const CONTEXT_MENU_ICONS = {
        'document-open': './assets/icons/gnome/adwaita/places/document-open-recent-symbolic.svg',
        'open-menu': './assets/icons/gnome/adwaita/symbolic/actions/open-menu-symbolic.svg',
        'folder-new': './assets/icons/gnome/adwaita/symbolic/actions/folder-new-symbolic.svg',
        'user-trash': './assets/icons/gnome/adwaita/places/user-trash-symbolic.svg',
        'utilities-terminal': './assets/images/toolkits/kde/apps/utilities-terminal.svg',
        'edit-undo': './assets/icons/gnome/adwaita/symbolic/actions/edit-undo-symbolic.svg',
        'document-properties': './assets/icons/gnome/adwaita/symbolic/actions/view-more-symbolic.svg',
        'edit-select-all': './assets/icons/gnome/adwaita/symbolic/actions/view-grid-symbolic.svg',
    };

    const DOLPHIN_CONTEXT_MENU_ICONS = {
        'tab-new': `${KDE_NEMO}tab-new.svg`,
        'window-new': `${KDE_NEMO}screen.svg`,
        'view-split': `${KDE_NEMO}view-split-left-right.svg`,
        'open-menu': `${KDE_NEMO}open-menu-symbolic.svg`,
        'list-add': `${KDE_NEMO}add-new-file.svg`,
        'edit-cut': `${KDE_NEMO}cut.svg`,
        'edit-copy': `${KDE_NEMO}copy.svg`,
        'edit-paste': `${KDE_NEMO}paste.svg`,
        'edit-duplicate': `${KDE_NEMO}copy.svg`,
        'edit-rename': `${KDE_NEMO}keyboard-shortcuts.svg`,
        location: `${KDE_NEMO}location-symbolic.svg`,
        'user-trash': `${KDE_NEMO}user-trash-symbolic.svg`,
        'utilities-terminal': './assets/images/toolkits/kde/apps/utilities-terminal.svg',
        'folder-new': `${KDE_NEMO}new-folder.svg`,
        'document-properties': `${KDE_NEMO}document-properties.svg`,
        'edit-select-all': `${KDE_NEMO}view-grid-symbolic.svg`,
        'edit-undo': `${KDE_NEMO}undo.svg`,
        package: `${KDE_NEMO}view-preview-symbolic.svg`,
        tag: `${KDE_NEMO}starred-symbolic.svg`,
        activities: `${KDE_NEMO}applications-system.svg`,
    };

    const resolveMenuIconUrl = (path) => {
        if (typeof global.resolveCapsuleResourceUrl === 'function') {
            return global.resolveCapsuleResourceUrl(path);
        }
        return path;
    };

    const decorateContextMenuIcons = (menu) => {
        menu.querySelectorAll('[data-nemo-ctx-icon]').forEach((item) => {
            if (item.querySelector('.nautilus-context-menu__icon, .nautilus-context-menu__icon--spacer')) {
                return;
            }
            const key = item.dataset.nemoCtxIcon;
            const iconMap = isDolphinExplorer() && menu.classList.contains('dolphin-context-menu')
                ? DOLPHIN_CONTEXT_MENU_ICONS
                : CONTEXT_MENU_ICONS;
            const path = iconMap[key];
            if (path) {
                const icon = global.document.createElement('img');
                icon.className = 'nautilus-context-menu__icon';
                icon.alt = '';
                icon.src = resolveMenuIconUrl(path);
                item.insertBefore(icon, item.firstChild);
            } else {
                const spacer = global.document.createElement('span');
                spacer.className = 'nautilus-context-menu__icon--spacer';
                spacer.setAttribute('aria-hidden', 'true');
                item.insertBefore(spacer, item.firstChild);
            }
        });
    };

    const showExplorerStatus = (message) => {
        if (typeof global.setExplorerStatusMessage === 'function') {
            global.setExplorerStatusMessage(message);
            return;
        }
        const root = getNemoRoot();
        const status = root && root.querySelector('#nemoFooterContainer .nemo-app__status-center p');
        if (status) {
            status.textContent = message;
        }
    };

    const copyExplorerLocation = async (itemData) => {
        if (typeof global.copyExplorerSelectionLocation === 'function') {
            const result = await global.copyExplorerSelectionLocation();
            if (result.ok) {
                showExplorerStatus(`Emplacement copié : ${result.path}`);
            } else {
                showExplorerStatus(result.message || 'Emplacement indisponible.');
            }
            return;
        }
        const path = (itemData && (itemData.targetPath || itemData.folderPath))
            || (global.fileExplorerState && global.fileExplorerState.currentPath)
            || '';
        if (!path) {
            showExplorerStatus('Emplacement indisponible.');
        }
    };

    const bindMenuActions = (root, menu) => {
        menu.querySelectorAll('[data-nemo-ctx]').forEach((item) => {
            if (item.dataset.nemoCtxBound === 'true') {
                return;
            }
            item.addEventListener('click', async (event) => {
                event.preventDefault();
                const action = item.dataset.nemoCtx;
                const link = contextTarget;
                const itemData = getItemFromLink(link);
                closeMenu(menu);

                if (item.dataset.nemoCtxTier === 'p2') {
                    const label = item.querySelector('.nautilus-context-menu__label');
                    showExplorerStatus(`${label ? label.textContent.trim() : action} : bientôt disponible.`);
                    return;
                }

                if (action === 'open-tab' && typeof global.openDolphinNewTab === 'function') {
                    global.openDolphinNewTab();
                    return;
                }
                if (action === 'open-window' && typeof global.openDolphinNewWindow === 'function') {
                    global.openDolphinNewWindow();
                    return;
                }
                if (action === 'open-split' && typeof global.openDolphinSplitWithItem === 'function') {
                    global.openDolphinSplitWithItem(itemData);
                    return;
                }
                if (action === 'copy-location') {
                    await copyExplorerLocation(itemData);
                    return;
                }
                if (action === 'duplicate') {
                    showExplorerStatus('Dupliquer ici : bientôt disponible.');
                    return;
                }
                if (action === 'open') {
                    openContextItem(itemData, link);
                    return;
                }
                if (action === 'new-folder' && typeof global.createNewFolderInCurrentDirectory === 'function') {
                    global.createNewFolderInCurrentDirectory();
                    return;
                }
                if (action === 'open-terminal') {
                    const cwd = resolveExplorerTerminalCwd(itemData);
                    if (typeof global.openTerminalWithExplorerContext === 'function') {
                        global.openTerminalWithExplorerContext(cwd);
                    } else if (typeof global.openWindowByDataLink === 'function') {
                        global.openWindowByDataLink('terminal');
                    }
                    return;
                }
                if (action === 'empty-trash' && typeof global.emptyNautilusTrash === 'function') {
                    await global.emptyNautilusTrash();
                    return;
                }
                if (action === 'restore-trash' && typeof global.restoreNautilusTrashSelection === 'function') {
                    await global.restoreNautilusTrashSelection();
                    return;
                }
                if (action === 'delete-forever' && typeof global.deleteNautilusTrashSelectionPermanently === 'function') {
                    await global.deleteNautilusTrashSelectionPermanently();
                    return;
                }
                if (action === 'open-with' && typeof global.openExplorerSelectionWith === 'function') {
                    global.openExplorerSelectionWith();
                    return;
                }
                if (action === 'select-all') {
                    selectAllItems(root);
                    return;
                }
                if (action === 'cut' && typeof global.cutExplorerSelection === 'function') {
                    global.cutExplorerSelection();
                    return;
                }
                if (action === 'copy' && typeof global.copyExplorerSelection === 'function') {
                    global.copyExplorerSelection();
                    return;
                }
                if (action === 'paste' && typeof global.pasteExplorerClipboard === 'function') {
                    let destPath;
                    if (contextProfile === 'item-folder' && itemData && itemData.type === 'folder' && itemData.targetPath) {
                        destPath = itemData.targetPath;
                    }
                    await global.pasteExplorerClipboard(destPath);
                    return;
                }
                if (action === 'move-to' && typeof global.transferExplorerSelectionToPath === 'function') {
                    await global.transferExplorerSelectionToPath('move');
                    return;
                }
                if (action === 'copy-to' && typeof global.transferExplorerSelectionToPath === 'function') {
                    await global.transferExplorerSelectionToPath('copy');
                    return;
                }
                if (action === 'rename') {
                    if (link && typeof global.startExplorerInlineRename === 'function') {
                        await global.startExplorerInlineRename(link);
                    } else if (typeof global.renameExplorerSelection === 'function') {
                        await global.renameExplorerSelection();
                    }
                    return;
                }
                if (action === 'compress' && typeof global.compressExplorerSelection === 'function') {
                    await global.compressExplorerSelection();
                    return;
                }
                if (action === 'trash' && typeof global.trashExplorerSelection === 'function') {
                    await global.trashExplorerSelection();
                    return;
                }
                if (action === 'properties') {
                    showItemProperties(itemData);
                }
            });
            item.dataset.nemoCtxBound = 'true';
        });
    };

    const handleExplorerContextMenuEvent = (event) => {
        if (!usesAdvancedExplorerOps()) {
            return;
        }
        const root = getNemoRoot();
        if (!root || root.style.display === 'none' || !root.contains(event.target)) {
            return;
        }
        if (typeof global.ensureExplorerAdvancedChrome === 'function') {
            global.ensureExplorerAdvancedChrome(root);
        }
        const menu = getMenu(root);
        if (!menu) {
            return;
        }

        const grid = event.target.closest('.nemoElement, .nemo-app__content-grid');
        if (!grid || !root.contains(grid)) {
            return;
        }

        const itemLink = event.target.closest('a[data-item-name]');
        if (itemLink && grid.contains(itemLink)) {
            event.preventDefault();
            event.stopPropagation();
            openMenu(menu, event.clientX, event.clientY, itemLink, root);
            return;
        }
        if (event.target.closest('a, button, input, .nemo-app__list-header, .nemo-app__item-rename-input')) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        openMenu(menu, event.clientX, event.clientY, null, root);
    };

    const bindExplorerContextMenuCapture = () => {
        if (global.__capsuleExplorerContextMenuCapture === true) {
            return;
        }
        global.document.addEventListener('contextmenu', handleExplorerContextMenuEvent, true);
        global.__capsuleExplorerContextMenuCapture = true;
    };

    const bindSidebarContextMenu = (root, menu) => {
        const sidebar = root.querySelector('#voletnemo');
        if (!sidebar || sidebar.dataset.nemoSidebarContextMenuBound === 'true') {
            return;
        }
        sidebar.addEventListener('contextmenu', (event) => {
            const trashLink = event.target.closest('a[data-link="Corbeille"]');
            if (!trashLink || !sidebar.contains(trashLink)) {
                return;
            }
            event.preventDefault();
            openMenu(menu, event.clientX, event.clientY, null, root, { sidebarTrash: true });
        });
        sidebar.dataset.nemoSidebarContextMenuBound = 'true';
    };

    function bindFileExplorerContextMenu() {
        if (!usesAdvancedExplorerOps()) {
            return;
        }
        const root = getNemoRoot();
        if (!root) {
            return;
        }
        if (typeof global.ensureExplorerAdvancedChrome === 'function') {
            global.ensureExplorerAdvancedChrome(root);
        }
        const menu = getMenu(root);
        if (!menu) {
            return;
        }

        decorateContextMenuIcons(menu);
        bindMenuActions(root, menu);
        bindSidebarContextMenu(root, menu);
        bindExplorerContextMenuCapture();

        if (global.__capsuleExplorerContextMenuGlobals !== 'true') {
            global.document.addEventListener('click', (event) => {
                const activeRoot = getNemoRoot();
                const activeMenu = activeRoot && getMenu(activeRoot);
                if (!activeMenu || activeMenu.hidden || activeMenu.contains(event.target)) {
                    return;
                }
                closeMenu(activeMenu);
            });
            global.document.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape') {
                    return;
                }
                const activeRoot = getNemoRoot();
                const activeMenu = activeRoot && getMenu(activeRoot);
                if (activeMenu && !activeMenu.hidden) {
                    closeMenu(activeMenu);
                }
            });
            global.addEventListener('resize', () => {
                const activeRoot = getNemoRoot();
                const activeMenu = activeRoot && getMenu(activeRoot);
                if (activeMenu) {
                    closeMenu(activeMenu);
                }
            });
            global.__capsuleExplorerContextMenuGlobals = 'true';
        }

        root.dataset.nemoContextMenuInit = 'true';
    }

    global.bindFileExplorerContextMenu = bindFileExplorerContextMenu;
}(typeof window !== 'undefined' ? window : globalThis));
