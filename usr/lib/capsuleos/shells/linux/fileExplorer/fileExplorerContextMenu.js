/**
 * Menu contextuel — zone fichiers et éléments (gabarit Nautilus GNOME).
 */
(function initFileExplorerContextMenu(global) {
    'use strict';

    let contextTarget = null;

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

    const openMenu = (menu, clientX, clientY, target) => {
        contextTarget = target || null;
        const openBtn = menu.querySelector('[data-nemo-ctx="open"]');
        if (openBtn) {
            const showOpen = !!(target && target.dataset && target.dataset.itemName);
            openBtn.hidden = !showOpen;
        }
        const hiddenBtn = menu.querySelector('[data-nemo-ctx="toggle-hidden"]');
        if (hiddenBtn && global.fileExplorerState) {
            hiddenBtn.textContent = global.fileExplorerState.showHiddenFiles
                ? 'Masquer les fichiers cachés'
                : 'Afficher les fichiers cachés';
        }
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

    const openContextItem = (item, link) => {
        if (!item) {
            return;
        }
        if (item.type === 'folder' && item.targetPath && typeof global.navigateToFileExplorerDirectory === 'function') {
            global.navigateToFileExplorerDirectory(item.targetPath, { updateHistory: true });
            return;
        }
        if (link) {
            link.click();
        }
    };

    const bindMenuActions = (root, menu) => {
        menu.querySelectorAll('[data-nemo-ctx]').forEach((item) => {
            if (item.dataset.nemoCtxBound === 'true') {
                return;
            }
            item.addEventListener('click', (event) => {
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
                if (action === 'refresh' && typeof global.refreshFileExplorerDirectory === 'function') {
                    global.refreshFileExplorerDirectory();
                    return;
                }
                if (action === 'toggle-hidden' && typeof global.toggleExplorerHiddenFiles === 'function') {
                    global.toggleExplorerHiddenFiles();
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
                openMenu(menu, event.clientX, event.clientY, itemLink);
                return;
            }
            if (event.target.closest('a, button, input, .nemo-app__list-header')) {
                return;
            }
            event.preventDefault();
            openMenu(menu, event.clientX, event.clientY, null);
        });

        grid.dataset.nemoContextMenuBound = 'true';
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

        bindMenuActions(root, menu);
        bindContentContextMenu(root, menu);

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
