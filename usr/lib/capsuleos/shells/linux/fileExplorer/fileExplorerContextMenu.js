/**
 * Menu contextuel explorateur (Nemo) — clic droit zone fichiers.
 * Pattern noyau partagé : bindFileExplorerContextMenu(scope) après contentLoader.
 */
(function initFileExplorerContextMenu(global) {
    'use strict';

    var MENU_ID = 'nemo-file-context-menu';

    var ITEMS = [
        { action: 'open', label: 'Ouvrir' },
        { action: 'open-new-tab', label: 'Ouvrir dans un nouvel onglet' },
        { sep: true },
        { action: 'cut', label: 'Couper' },
        { action: 'copy', label: 'Copier' },
        { action: 'paste', label: 'Coller' },
        { sep: true },
        { action: 'properties', label: 'Propriétés' },
    ];

    function ensureMenu(scope) {
        var existing = scope.querySelector('.nemo-app__context-menu');
        if (existing) {
            return existing;
        }

        var menu = global.document.createElement('nav');
        menu.id = MENU_ID;
        menu.className = 'nemo-app__context-menu';
        menu.setAttribute('role', 'menu');
        menu.hidden = true;

        ITEMS.forEach(function (item) {
            if (item.sep) {
                var hr = global.document.createElement('hr');
                hr.className = 'nemo-app__context-sep';
                menu.appendChild(hr);
                return;
            }
            var btn = global.document.createElement('button');
            btn.type = 'button';
            btn.className = 'nemo-app__context-item';
            btn.setAttribute('role', 'menuitem');
            btn.dataset.nemoCtxAction = item.action;
            btn.textContent = item.label;
            menu.appendChild(btn);
        });

        scope.appendChild(menu);
        return menu;
    }

    function closeMenu(menu) {
        if (!menu) {
            return;
        }
        menu.hidden = true;
    }

    function openMenu(menu, clientX, clientY) {
        menu.hidden = false;
        var rect = menu.getBoundingClientRect();
        var maxLeft = global.innerWidth - rect.width - 8;
        var maxTop = global.innerHeight - rect.height - 8;
        menu.style.left = Math.max(8, Math.min(clientX, maxLeft)) + 'px';
        menu.style.top = Math.max(8, Math.min(clientY, maxTop)) + 'px';
    }

    function getTargetItem(event, scope) {
        var link = event.target.closest('a[data-item-name]');
        if (link && scope.contains(link)) {
            return link;
        }
        return null;
    }

    function runAction(action, itemLink, scope) {
        if (action === 'properties' && typeof global.openFileExplorerProperties === 'function') {
            global.openFileExplorerProperties(itemLink);
            return;
        }
        if (action === 'open' && itemLink && typeof itemLink.click === 'function') {
            itemLink.click();
            return;
        }
        if (action === 'copy' && itemLink) {
            var name = itemLink.getAttribute('data-item-name') || '';
            if (global.fileExplorerState) {
                global.fileExplorerState.clipboard = { mode: 'copy', name: name };
            }
        }
    }

    function bindFileExplorerContextMenu(scope) {
        if (!scope || scope.dataset.nemoContextMenuInit === 'true') {
            return;
        }

        var content = scope.querySelector('.nemoElement');
        if (!content) {
            return;
        }

        var menu = ensureMenu(scope);
        var activeItem = null;

        content.addEventListener('contextmenu', function (event) {
            if (event.target.closest('.nemo-app__context-menu')) {
                return;
            }
            event.preventDefault();
            activeItem = getTargetItem(event, scope);
            menu.querySelectorAll('.nemo-app__context-item').forEach(function (btn) {
                var needsItem = btn.dataset.nemoCtxAction !== 'paste';
                btn.disabled = needsItem && !activeItem;
            });
            openMenu(menu, event.clientX, event.clientY);
        });

        menu.querySelectorAll('.nemo-app__context-item').forEach(function (btn) {
            btn.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                var action = btn.dataset.nemoCtxAction;
                closeMenu(menu);
                runAction(action, activeItem, scope);
            });
        });

        global.document.addEventListener('click', function (event) {
            if (!menu.hidden && !menu.contains(event.target)) {
                closeMenu(menu);
            }
        });

        global.document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeMenu(menu);
            }
        });

        scope.dataset.nemoContextMenuInit = 'true';
    }

    global.bindFileExplorerContextMenu = bindFileExplorerContextMenu;
}(typeof window !== 'undefined' ? window : this));
