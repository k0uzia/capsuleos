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

    const isNautilusGnome = () => (
        typeof global.isNautilusGnomeTemplate === 'function' && global.isNautilusGnomeTemplate()
    );

    const getMenu = (root) => root.querySelector('#nemo-context-menu');

    const closeMenu = (menu) => {
        if (!menu) {
            return;
        }
        menu.hidden = true;
        contextTarget = null;
    };

    const resolveContextProfile = (root, target, options = {}) => {
        if (options.sidebarTrash) {
            return 'trash';
        }
        const path = global.fileExplorerState && global.fileExplorerState.currentPath;
        if (path === global.CAPSULE_PLACE_TRASH) {
            return target ? 'trash-item' : 'trash';
        }
        return target ? 'item' : 'background';
    };

    const applyMenuScope = (menu, profile) => {
        contextProfile = profile || 'background';
        if (typeof global !== 'undefined') {
            global.__nautilusContextMenuProfile = contextProfile;
        }
        menu.querySelectorAll('[data-nemo-ctx-scope]').forEach((node) => {
            const scopes = String(node.dataset.nemoCtxScope || '').split(/\s+/).filter(Boolean);
            const show = scopes.includes(profile) || scopes.includes('both');
            node.hidden = !show;
        });
        if (typeof global.syncNautilusClipboardUi === 'function') {
            global.syncNautilusClipboardUi();
        }
    };

    const selectContextTarget = (root, target) => {
        const grid = root && root.querySelector('.nemoElement, .nemo-app__content-grid');
        if (!grid) {
            return;
        }
        grid.querySelectorAll('.nemo-app__item--selected').forEach((el) => {
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
        menu.hidden = false;
        const rect = menu.getBoundingClientRect();
        const maxLeft = global.innerWidth - rect.width - 8;
        const maxTop = global.innerHeight - rect.height - 8;
        menu.style.left = `${Math.max(8, Math.min(clientX, maxLeft))}px`;
        menu.style.top = `${Math.max(8, Math.min(clientY, maxTop))}px`;
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
            const path = CONTEXT_MENU_ICONS[key];
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
                    await global.pasteExplorerClipboard();
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

    const bindContentContextMenu = (root, menu) => {
        const grid = root.querySelector('.nemoElement, .nemo-app__content-grid');
        if (!grid || grid.dataset.nemoContextMenuBound === 'true') {
            return;
        }

        grid.addEventListener('contextmenu', (event) => {
            const itemLink = event.target.closest('a[data-item-name]');
            if (itemLink && grid.contains(itemLink)) {
                event.preventDefault();
                openMenu(menu, event.clientX, event.clientY, itemLink, root);
                return;
            }
            if (event.target.closest('a, button, input, .nemo-app__list-header, .nemo-app__item-rename-input')) {
                return;
            }
            event.preventDefault();
            openMenu(menu, event.clientX, event.clientY, null, root);
        });

        grid.dataset.nemoContextMenuBound = 'true';
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
        if (!isNautilusGnome()) {
            return;
        }
        const root = getNemoRoot();
        const menu = root && getMenu(root);
        if (!root || !menu) {
            return;
        }
        if (root.dataset.nemoContextMenuInit === 'true') {
            return;
        }

        decorateContextMenuIcons(menu);
        bindMenuActions(root, menu);
        bindContentContextMenu(root, menu);
        bindSidebarContextMenu(root, menu);

        global.document.addEventListener('click', (event) => {
            if (!menu.hidden && !menu.contains(event.target)) {
                closeMenu(menu);
            }
        });
        global.document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeMenu(menu);
            }
        });
        global.addEventListener('resize', () => closeMenu(menu));

        root.dataset.nemoContextMenuInit = 'true';
    }

    global.bindFileExplorerContextMenu = bindFileExplorerContextMenu;
}(typeof window !== 'undefined' ? window : globalThis));
