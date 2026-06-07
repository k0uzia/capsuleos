/**
 * KDE Neon — Dolphin : libellés VM, menu modes d'affichage, config vue, pathbar fixe.
 */
(function initDolphinNeonChrome(global) {
    'use strict';

    const ROOT_LABEL = 'Dossier Personnel';
    const ROOT_LABEL_RE = /Dossier personnel/g;
    const DOLPHIN_TITLE_SUFFIX = ' — Dolphin';
    const DOLPHIN_TITLE_SUFFIX_RE = /\s[-–—]\s*Dolphin\s*$/;
    const VIEW_ICONS = {
        icons: 'dolphin-ico--view-grid',
        compact: 'dolphin-ico--view-compact',
        list: 'dolphin-ico--view-list',
    };

    const viewConfigDraft = {
        mode: 'icons',
        sortOrder: 'asc',
        sortBy: 'name',
        foldersFirst: true,
        previews: true,
        groups: false,
        hiddenFiles: false,
        hiddenLast: false,
    };

    let viewConfigBaseline = null;
    let neonBindingsReady = false;

    const HAMBURGER_ITEMS = [
        { id: 'create-new', label: 'Créer un nouveau', iconClass: 'dolphin-hamburger-menu__icon--plus', submenu: true },
        { id: 'select-mode', label: 'Sélectionner des fichiers et des dossiers', shortcut: 'Espace' },
        { id: 'view-actions', label: "Actions pour l'affichage courant", submenu: true },
        { sep: true },
        { id: 'undo', label: 'Annuler', shortcut: 'Ctrl+Z', disabled: true },
        { id: 'redo', label: 'Refaire', shortcut: 'Ctrl+Maj+Z', disabled: true },
        { id: 'filter', label: 'Filtrer...', shortcut: 'Ctrl+I' },
        { sep: true },
        { id: 'new-window', label: 'Nouvelle fenêtre', shortcut: 'Ctrl+N' },
        { id: 'new-tab', label: 'Nouvel onglet', shortcut: 'Ctrl+T' },
        { id: 'terminal', label: 'Ouvrir un terminal', shortcut: 'Maj+F4' },
        { sep: true },
        { id: 'panels', label: 'Afficher les panneaux', submenu: true },
        { id: 'configure', label: 'Configurer', submenu: true },
        { id: 'help', label: 'Aide', submenu: true },
        { sep: true },
        { id: 'more', label: 'Plus', submenu: true },
    ];

    function getSlot() {
        return global.document && global.document.querySelector('body#kde-neon div[data-link="nemo"]');
    }

    function patchManifestRootLabel() {
        const state = global.fileExplorerState;
        if (state && state.manifest) {
            state.manifest.rootLabel = ROOT_LABEL;
        }
    }

    function normalizeNeonWindowTitle() {
        const slot = getSlot();
        if (!slot) {
            return;
        }
        const titleEl = slot.querySelector('#windowTitle');
        if (!titleEl) {
            return;
        }
        let text = titleEl.textContent || '';
        if (ROOT_LABEL_RE.test(text)) {
            text = text.replace(ROOT_LABEL_RE, ROOT_LABEL);
        }
        text = text.replace(DOLPHIN_TITLE_SUFFIX_RE, DOLPHIN_TITLE_SUFFIX);
        if (text !== titleEl.textContent) {
            titleEl.textContent = text;
        }
    }

    function normalizeNeonRootLabels() {
        patchManifestRootLabel();
        const slot = getSlot();
        if (!slot) {
            return;
        }
        normalizeNeonWindowTitle();
        slot.querySelectorAll('.nemo-app__path-current, .nemo-app__path-crumb').forEach((node) => {
            if (node.textContent && ROOT_LABEL_RE.test(node.textContent)) {
                node.textContent = node.textContent.replace(ROOT_LABEL_RE, ROOT_LABEL);
            }
        });
    }

    function getExplorerRootPath() {
        return typeof global.getFileExplorerRoot === 'function'
            ? global.getFileExplorerRoot()
            : ROOT_LABEL;
    }

    function pathToCrumbLabel(displayPath) {
        const root = getExplorerRootPath();
        if (!displayPath || displayPath === root) {
            return ROOT_LABEL;
        }
        const leaf = String(displayPath).split('/').filter(Boolean).pop();
        return leaf ? leaf.replace(ROOT_LABEL_RE, ROOT_LABEL) : ROOT_LABEL;
    }

    function renderNeonPathCrumb(pathEl, displayPath) {
        if (!pathEl) {
            return;
        }
        const label = pathToCrumbLabel(displayPath);
        pathEl.replaceChildren();
        const prefix = global.document.createElement('span');
        prefix.className = 'dolphin-toolbar__crumb-prefix';
        prefix.setAttribute('aria-hidden', 'true');
        prefix.textContent = '>';
        pathEl.appendChild(prefix);
        pathEl.appendChild(global.document.createTextNode(label));
    }

    function ensureSecondaryPathBar() {
        const slot = getSlot();
        const toolbar = slot && slot.querySelector('.dolphin-toolbar');
        const primaryPath = slot && slot.querySelector('.dolphin-toolbar__path:not(.dolphin-toolbar__path--secondary)');
        if (!toolbar || !primaryPath) {
            return null;
        }
        const existing = toolbar.querySelector('#dolphin-toolbar-path-secondary');
        if (existing) {
            const closeBtn = existing.querySelector('#dolphin-split-close');
            if (closeBtn) {
                closeBtn.remove();
            }
            return existing;
        }
        const secondary = global.document.createElement('div');
        secondary.id = 'dolphin-toolbar-path-secondary';
        secondary.className = 'nemo-app__toolbar-group nemo-app__toolbar-group--path dolphin-toolbar__path dolphin-toolbar__path--secondary';
        secondary.hidden = true;
        secondary.setAttribute('aria-label', 'Emplacement volet droit');
        secondary.innerHTML = `
            <a href="#" class="nemo-app__path-current nemo-app__path-current--secondary"></a>`;
        primaryPath.insertAdjacentElement('afterend', secondary);
        return secondary;
    }

    function removeSecondaryPathBar() {
        const slot = getSlot();
        const secondary = slot && slot.querySelector('#dolphin-toolbar-path-secondary');
        if (!secondary) {
            return;
        }
        secondary.remove();
    }

    function scheduleNeonPathBarAlign() {
        global.requestAnimationFrame(() => {
            alignNeonDolphinPathBar();
            global.requestAnimationFrame(alignNeonDolphinPathBar);
        });
    }

    let compactLayoutTimer = null;

    function resetNeonCompactGridLayout(grid) {
        grid.classList.remove('nemo-app__content-grid--compact-wrap');
        grid.style.removeProperty('--dolphin-compact-cols');
        grid.style.removeProperty('height');
    }

    function measureNeonCompactContentHeight(grid) {
        const items = grid.querySelectorAll(':scope > a');
        if (!items.length) {
            return 0;
        }

        let total = 0;
        items.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const itemStyle = global.getComputedStyle(item);
            total += rect.height
                + (parseFloat(itemStyle.marginTop) || 0)
                + (parseFloat(itemStyle.marginBottom) || 0);
        });
        return total;
    }

    function layoutOneNeonCompactGrid(grid) {
        resetNeonCompactGridLayout(grid);

        const items = grid.querySelectorAll(':scope > a');
        if (!items.length) {
            return;
        }

        const styles = global.getComputedStyle(grid);
        const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
        const availableHeight = grid.clientHeight - padY;
        if (availableHeight <= 0) {
            return;
        }

        const columnGap = parseFloat(styles.columnGap) || 0;
        const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
        const innerWidth = grid.clientWidth - padX;
        const minColWidth = parseFloat(styles.getPropertyValue('--dolphin-compact-col-min')) || 140;
        const contentHeight = measureNeonCompactContentHeight(grid);
        const maxColsByWidth = Math.max(1, Math.floor((innerWidth + columnGap) / (minColWidth + columnGap)));

        let cols = 1;
        if (maxColsByWidth >= 2 && items.length > 1) {
            cols = 2;
        }
        if (contentHeight > availableHeight + 2) {
            cols = Math.max(cols, Math.min(Math.ceil(contentHeight / availableHeight), maxColsByWidth));
        }

        if (cols <= 1) {
            return;
        }

        grid.style.height = `${grid.clientHeight}px`;
        grid.style.setProperty('--dolphin-compact-cols', String(cols));
        grid.classList.add('nemo-app__content-grid--compact-wrap');
    }

    function normalizeNeonListViewCells() {
        const slot = getSlot();
        const state = global.fileExplorerState;
        if (!slot || !state || state.viewMode !== 'list') {
            return;
        }
        slot.querySelectorAll('.nemo-app__content-grid--list > a[data-item-type="folder"] > .nemo-app__item-size').forEach((el) => {
            el.textContent = '';
        });
    }

    function layoutNeonCompactColumns() {
        const slot = getSlot();
        if (!slot) {
            return;
        }

        const state = global.fileExplorerState;
        const grids = slot.querySelectorAll('.dolphin-content-pane > .nemo-app__content-grid--compact');
        if (!state || state.viewMode !== 'compact') {
            grids.forEach(resetNeonCompactGridLayout);
            return;
        }

        grids.forEach(layoutOneNeonCompactGrid);
    }

    function scheduleNeonCompactLayout() {
        if (compactLayoutTimer) {
            global.clearTimeout(compactLayoutTimer);
        }
        compactLayoutTimer = global.setTimeout(() => {
            compactLayoutTimer = null;
            layoutNeonCompactColumns();
            global.requestAnimationFrame(layoutNeonCompactColumns);
        }, 0);
    }

    let neonWindowGeometryTick = 0;

    function scheduleNeonWindowChromeRealign() {
        if (neonWindowGeometryTick) {
            return;
        }
        neonWindowGeometryTick = global.requestAnimationFrame(() => {
            neonWindowGeometryTick = 0;
            scheduleNeonPathBarAlign();
        });
    }

    function notifyNeonWindowGeometryChanged() {
        scheduleNeonWindowChromeRealign();
        scheduleNeonCompactLayout();
        global.setTimeout(scheduleNeonPathBarAlign, 120);
        global.setTimeout(scheduleNeonCompactLayout, 120);
    }

    function observeNemoWindowGeometry() {
        const slot = getSlot();
        if (!slot || slot.dataset.neonGeometryObserve === 'true') {
            return;
        }
        slot.dataset.neonGeometryObserve = 'true';
        const observer = new MutationObserver(() => {
            notifyNeonWindowGeometryChanged();
        });
        observer.observe(slot, {
            attributes: true,
            attributeFilter: ['data-maximized', 'style'],
        });
    }

    function wrapNemoWindowGeometryHook(name) {
        const original = global[name];
        if (typeof original !== 'function' || global[`__neon${name}Wrapped`]) {
            return;
        }
        global[`__neon${name}Wrapped`] = true;
        global[name] = function neonWrappedWindowGeometry(windowElement, ...rest) {
            const result = original.call(this, windowElement, ...rest);
            if (windowElement && windowElement.dataset && windowElement.dataset.link === 'nemo') {
                notifyNeonWindowGeometryChanged();
            }
            return result;
        };
    }

    function ensureHamburgerMenu() {
        const slot = getSlot();
        const actions = slot && slot.querySelector('.dolphin-toolbar__actions');
        if (!actions || actions.querySelector('#dolphin-hamburger-menu')) {
            return actions && actions.querySelector('#dolphin-hamburger-menu');
        }
        const menu = global.document.createElement('div');
        menu.id = 'dolphin-hamburger-menu';
        menu.className = 'dolphin-hamburger-menu';
        menu.setAttribute('role', 'menu');
        menu.hidden = true;
        HAMBURGER_ITEMS.forEach((item) => {
            if (item.sep) {
                const sep = global.document.createElement('div');
                sep.className = 'dolphin-hamburger-menu__sep';
                sep.setAttribute('role', 'separator');
                menu.appendChild(sep);
                return;
            }
            const btn = global.document.createElement('button');
            btn.type = 'button';
            btn.className = 'dolphin-hamburger-menu__item';
            btn.dataset.menuId = item.id;
            btn.setAttribute('role', 'menuitem');
            if (item.submenu) {
                btn.classList.add('dolphin-hamburger-menu__item--submenu');
            }
            if (item.disabled) {
                btn.disabled = true;
            }
            if (item.iconClass) {
                const icon = global.document.createElement('span');
                icon.className = item.iconClass;
                icon.setAttribute('aria-hidden', 'true');
                btn.appendChild(icon);
            } else {
                const spacer = global.document.createElement('span');
                spacer.setAttribute('aria-hidden', 'true');
                btn.appendChild(spacer);
            }
            const label = global.document.createElement('span');
            label.textContent = item.label;
            btn.appendChild(label);
            if (item.shortcut) {
                const shortcut = global.document.createElement('span');
                shortcut.className = 'dolphin-hamburger-menu__shortcut';
                shortcut.textContent = item.shortcut;
                btn.appendChild(shortcut);
            }
            menu.appendChild(btn);
        });
        actions.appendChild(menu);
        return menu;
    }

    function closeHamburgerMenu() {
        const slot = getSlot();
        const menu = slot && slot.querySelector('#dolphin-hamburger-menu');
        const trigger = slot && slot.querySelector('#dolphin-main-menu');
        if (menu) {
            menu.hidden = true;
        }
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    }

    function openHamburgerMenu() {
        closeViewMenu();
        const slot = getSlot();
        const menu = ensureHamburgerMenu();
        const trigger = slot && slot.querySelector('#dolphin-main-menu');
        if (!menu || !trigger) {
            return;
        }
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
    }

    function toggleHamburgerMenu() {
        const menu = getSlot() && getSlot().querySelector('#dolphin-hamburger-menu');
        if (!menu) {
            openHamburgerMenu();
            return;
        }
        if (menu.hidden) {
            openHamburgerMenu();
        } else {
            closeHamburgerMenu();
        }
    }

    function runHamburgerAction(menuId) {
        const actionMap = {
            'new-window': 'Nouvelle fenêtre',
            'new-tab': 'Nouvel onglet',
            terminal: 'Ouvrir un terminal',
            filter: 'Filtrer...',
            'create-new': 'Créer un nouveau dossier',
            configure: 'Configuration',
            help: 'Aide',
        };
        const label = actionMap[menuId];
        if (label && typeof global.resolveFileExplorerMenuAction === 'function') {
            global.resolveFileExplorerMenuAction(label, { type: 'top' });
            return;
        }
        if (menuId === 'select-mode' && typeof global.setExplorerStatusMessage === 'function') {
            global.setExplorerStatusMessage('Mode sélection : Espace pour basculer la sélection.');
        }
    }

    function resetNeonPathBarLayout() {
        const slot = getSlot();
        if (!slot) {
            return;
        }
        slot.querySelectorAll('.dolphin-toolbar__path').forEach((group) => {
            group.style.marginLeft = '';
            group.style.width = '';
            group.style.maxWidth = '';
            group.style.minWidth = '';
            group.style.flex = '';
        });
    }

    function getPrimaryPathGroup() {
        const slot = getSlot();
        return slot && slot.querySelector('.dolphin-toolbar__path:not(.dolphin-toolbar__path--secondary)');
    }

    function syncNeonSplitToggleButton(open) {
        const splitToggle = getSlot() && getSlot().querySelector('#dolphin-split-toggle');
        if (!splitToggle) {
            return;
        }
        const ico = splitToggle.querySelector('.dolphin-ico');
        const label = splitToggle.querySelector('.dolphin-toolbar__btn-label');
        splitToggle.classList.toggle('dolphin-toolbar__btn--split-open', open);
        splitToggle.setAttribute('aria-pressed', open ? 'true' : 'false');
        if (open) {
            splitToggle.setAttribute('aria-label', 'Fermer la vue de droite');
            if (ico) {
                ico.className = 'dolphin-ico dolphin-ico--close-x';
            }
            if (label) {
                label.textContent = 'Fermer';
            }
        } else {
            splitToggle.setAttribute('aria-label', 'Scinder');
            if (ico) {
                ico.className = 'dolphin-ico dolphin-ico--split';
            }
            if (label) {
                label.textContent = 'Scinder';
            }
        }
    }

    function syncNeonDualPathLabels() {
        const slot = getSlot();
        const state = global.fileExplorerState;
        if (!slot || !state) {
            return;
        }
        const primaryEl = getPrimaryPathGroup() && getPrimaryPathGroup().querySelector('.nemo-app__path-current');
        const secondaryEl = slot.querySelector('.nemo-app__path-current--secondary');
        renderNeonPathCrumb(primaryEl, state.currentPath);
        renderNeonPathCrumb(secondaryEl, state.secondaryPath || state.currentPath);
    }

    function syncNeonSplitChrome() {
        const slot = getSlot();
        const state = global.fileExplorerState;
        if (!slot || !state) {
            return;
        }
        ensureHamburgerMenu();
        const primaryPathGroup = getPrimaryPathGroup();
        const open = !!state.splitView;
        const activePane = state.activePane || 'primary';
        const wasOpen = slot.dataset.neonSplitOpen === 'true';
        let secondaryPathGroup = null;

        if (open) {
            secondaryPathGroup = ensureSecondaryPathBar();
            if (secondaryPathGroup) {
                secondaryPathGroup.hidden = false;
            }
        } else {
            removeSecondaryPathBar();
        }

        if (primaryPathGroup) {
            primaryPathGroup.classList.toggle('dolphin-toolbar__path--active', open && activePane === 'primary');
        }
        if (secondaryPathGroup) {
            secondaryPathGroup.classList.toggle('dolphin-toolbar__path--active', open && activePane === 'secondary');
        }
        syncNeonSplitToggleButton(open);
        slot.dataset.neonSplitOpen = open ? 'true' : 'false';

        if (open) {
            syncNeonDualPathLabels();
        } else if (wasOpen) {
            resetNeonPathBarLayout();
            if (typeof global.updatePathDisplay === 'function') {
                global.updatePathDisplay();
            }
        }

        scheduleNeonPathBarAlign();
    }

    function alignNeonDolphinPathBar() {
        const slot = getSlot();
        if (!slot || slot.style.display === 'none') {
            return;
        }
        const toolbar = slot.querySelector('.dolphin-toolbar');
        const pathGroup = getPrimaryPathGroup();
        const grid = slot.querySelector('.nemo-app__content-grid[data-pane="primary"]')
            || slot.querySelector('.nemo-app__content-grid:not(.nemoElement--secondary)');
        const actions = slot.querySelector('.dolphin-toolbar__actions');
        const state = global.fileExplorerState;
        const splitOpen = !!(state && state.splitView);
        const secondaryPathGroup = slot.querySelector('#dolphin-toolbar-path-secondary');
        const secondaryGrid = slot.querySelector('.nemo-app__content-grid[data-pane="secondary"]');
        if (!toolbar || !pathGroup || !grid || !actions) {
            return;
        }
        if (grid.offsetParent === null || actions.offsetParent === null) {
            return;
        }

        const resetPathStyles = (group) => {
            if (!group) {
                return;
            }
            group.style.marginLeft = '0px';
            group.style.width = 'auto';
            group.style.maxWidth = 'none';
            group.style.minWidth = '0';
            group.style.flex = '';
        };

        resetPathStyles(pathGroup);
        if (splitOpen) {
            resetPathStyles(secondaryPathGroup);
        }

        if (!splitOpen) {
            const gridRect = grid.getBoundingClientRect();
            const pathRect = pathGroup.getBoundingClientRect();
            const splitBtn = slot.querySelector('#dolphin-split-toggle');
            const widthAnchor = splitBtn || actions;
            const anchorRect = widthAnchor.getBoundingClientRect();
            const delta = gridRect.left - pathRect.left;
            const width = Math.max(180, Math.round(anchorRect.left - gridRect.left - 8));

            pathGroup.style.marginLeft = `${Math.round(delta)}px`;
            pathGroup.style.width = `${width}px`;
            pathGroup.style.maxWidth = `${width}px`;
            pathGroup.style.minWidth = `${width}px`;
            pathGroup.style.flex = '0 0 auto';
            return;
        }

        const primaryGrid = grid.getBoundingClientRect();
        const secondaryRect = secondaryGrid && secondaryGrid.offsetParent !== null
            ? secondaryGrid.getBoundingClientRect()
            : null;
        const splitBtn = slot.querySelector('#dolphin-split-toggle');
        const splitRect = splitBtn ? splitBtn.getBoundingClientRect() : actions.getBoundingClientRect();
        const pathRect = pathGroup.getBoundingClientRect();
        const primaryDelta = primaryGrid.left - pathRect.left;
        const splitMid = secondaryRect
            ? secondaryRect.left - 8
            : primaryGrid.left + (splitRect.left - primaryGrid.left) / 2;
        const primaryWidth = Math.max(160, Math.round(splitMid - primaryGrid.left));
        pathGroup.style.marginLeft = `${Math.round(primaryDelta)}px`;
        pathGroup.style.width = `${primaryWidth}px`;
        pathGroup.style.maxWidth = `${primaryWidth}px`;
        pathGroup.style.minWidth = `${primaryWidth}px`;
        pathGroup.style.flex = '0 0 auto';

        if (secondaryPathGroup && secondaryRect) {
            const secPathRect = secondaryPathGroup.getBoundingClientRect();
            const secDelta = secondaryRect.left - secPathRect.left;
            const secondaryWidth = Math.max(140, Math.round(splitRect.left - secondaryRect.left - 8));
            secondaryPathGroup.style.marginLeft = `${Math.round(secDelta)}px`;
            secondaryPathGroup.style.width = `${secondaryWidth}px`;
            secondaryPathGroup.style.maxWidth = `${secondaryWidth}px`;
            secondaryPathGroup.style.minWidth = `${secondaryWidth}px`;
            secondaryPathGroup.style.flex = '0 0 auto';
        }
    }

    function ensureNeonSearchInActions() {
        const slot = getSlot();
        if (!slot) {
            return;
        }
        const actions = slot.querySelector('.dolphin-toolbar__actions');
        const search = slot.querySelector('.dolphin-toolbar__search');
        const menuBtn = slot.querySelector('#dolphin-main-menu');
        if (!actions || !search || !menuBtn) {
            return;
        }
        search.classList.add('dolphin-toolbar__btn--search');
        if (search.parentElement !== actions) {
            actions.insertBefore(search, menuBtn);
            return;
        }
        if (search.nextElementSibling !== menuBtn) {
            actions.insertBefore(search, menuBtn);
        }
    }

    function syncViewModeUi(mode) {
        const slot = getSlot();
        if (!slot) {
            return;
        }
        const current = mode || (global.fileExplorerState && global.fileExplorerState.viewMode) || 'icons';
        const triggerIco = slot.querySelector('.dolphin-view-mode-ico');
        if (triggerIco) {
            triggerIco.className = `dolphin-ico ${VIEW_ICONS[current] || VIEW_ICONS.icons} dolphin-view-mode-ico`;
        }
        slot.querySelectorAll('.dolphin-view-menu__item[data-view-mode]').forEach((item) => {
            const active = item.dataset.viewMode === current;
            item.setAttribute('aria-checked', active ? 'true' : 'false');
        });
        slot.querySelectorAll('.dolphin-toolbar__view-btn[data-view-mode]').forEach((btn) => {
            btn.classList.toggle('dolphin-toolbar__view-btn--active', btn.dataset.viewMode === current);
            if (btn.dataset.viewMode === current) {
                btn.setAttribute('aria-current', 'true');
            } else {
                btn.removeAttribute('aria-current');
            }
        });
    }

    function closeViewMenu() {
        const slot = getSlot();
        if (!slot) {
            return;
        }
        const menu = slot.querySelector('#dolphin-view-menu');
        const trigger = slot.querySelector('#dolphin-view-mode-btn');
        if (menu) {
            menu.hidden = true;
        }
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    }

    function openViewMenu() {
        const slot = getSlot();
        if (!slot) {
            return;
        }
        const menu = slot.querySelector('#dolphin-view-menu');
        const trigger = slot.querySelector('#dolphin-view-mode-btn');
        if (!menu || !trigger) {
            return;
        }
        syncViewModeUi();
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
    }

    function toggleViewMenu() {
        const slot = getSlot();
        const menu = slot && slot.querySelector('#dolphin-view-menu');
        if (!menu) {
            return;
        }
        if (menu.hidden) {
            openViewMenu();
        } else {
            closeViewMenu();
        }
    }

    function readViewConfigFromState() {
        const state = global.fileExplorerState || {};
        viewConfigDraft.mode = state.viewMode || 'icons';
        viewConfigDraft.hiddenFiles = !!state.showHiddenFiles;
        viewConfigBaseline = JSON.stringify(viewConfigDraft);
    }

    function ensureViewConfigDialog() {
        const slot = getSlot();
        const app = slot && slot.querySelector('.dolphin-app');
        if (!app || app.querySelector('#dolphin-view-config')) {
            return app && app.querySelector('#dolphin-view-config');
        }

        const dialog = global.document.createElement('div');
        dialog.id = 'dolphin-view-config';
        dialog.className = 'dolphin-view-config';
        dialog.hidden = true;
        dialog.innerHTML = `
            <div class="dolphin-view-config__panel" role="dialog" aria-modal="true" aria-labelledby="dolphin-view-config-title">
                <h2 class="dolphin-view-config__title" id="dolphin-view-config-title">Style d'affichage de la vue</h2>
                <div class="dolphin-view-config__row">
                    <label for="dolphin-view-config-mode">Type d'affichage :</label>
                    <select id="dolphin-view-config-mode" class="dolphin-view-config__select">
                        <option value="icons">Icônes</option>
                        <option value="compact">Synthétique</option>
                        <option value="list">Détails</option>
                    </select>
                </div>
                <div class="dolphin-view-config__row">
                    <span>Tri :</span>
                    <div style="display:flex;gap:0.45rem;">
                        <select id="dolphin-view-config-sort-order" class="dolphin-view-config__select" style="flex:1;">
                            <option value="asc">Croissant</option>
                            <option value="desc">Décroissant</option>
                        </select>
                        <select id="dolphin-view-config-sort-by" class="dolphin-view-config__select" style="flex:1;">
                            <option value="name">Nom</option>
                            <option value="size">Taille</option>
                            <option value="modified">Modifié</option>
                        </select>
                    </div>
                </div>
                <div class="dolphin-view-config__checks">
                    <label><input type="checkbox" id="dolphin-view-config-folders-first" checked> Afficher les dossiers d'abord</label>
                    <label><input type="checkbox" id="dolphin-view-config-previews" checked> Afficher un aperçu</label>
                    <label><input type="checkbox" id="dolphin-view-config-groups"> Afficher par groupes</label>
                    <label><input type="checkbox" id="dolphin-view-config-hidden"> Afficher les fichiers cachés</label>
                    <label><input type="checkbox" id="dolphin-view-config-hidden-last"> Afficher les fichiers cachés en dernier</label>
                </div>
                <div class="dolphin-view-config__actions">
                    <button type="button" class="dolphin-view-config__btn" id="dolphin-view-config-cancel">Annuler</button>
                    <button type="button" class="dolphin-view-config__btn" id="dolphin-view-config-apply" disabled>Appliquer</button>
                    <button type="button" class="dolphin-view-config__btn dolphin-view-config__btn--primary" id="dolphin-view-config-ok">Ok</button>
                </div>
            </div>`;
        app.appendChild(dialog);
        return dialog;
    }

    function populateViewConfigDialog() {
        readViewConfigFromState();
        const dialog = ensureViewConfigDialog();
        if (!dialog) {
            return;
        }
        dialog.querySelector('#dolphin-view-config-mode').value = viewConfigDraft.mode;
        dialog.querySelector('#dolphin-view-config-sort-order').value = viewConfigDraft.sortOrder;
        dialog.querySelector('#dolphin-view-config-sort-by').value = viewConfigDraft.sortBy;
        dialog.querySelector('#dolphin-view-config-folders-first').checked = viewConfigDraft.foldersFirst;
        dialog.querySelector('#dolphin-view-config-previews').checked = viewConfigDraft.previews;
        dialog.querySelector('#dolphin-view-config-groups').checked = viewConfigDraft.groups;
        dialog.querySelector('#dolphin-view-config-hidden').checked = viewConfigDraft.hiddenFiles;
        dialog.querySelector('#dolphin-view-config-hidden-last').checked = viewConfigDraft.hiddenLast;
        updateViewConfigApplyState();
    }

    function collectViewConfigDraftFromDialog() {
        const dialog = ensureViewConfigDialog();
        if (!dialog) {
            return;
        }
        viewConfigDraft.mode = dialog.querySelector('#dolphin-view-config-mode').value;
        viewConfigDraft.sortOrder = dialog.querySelector('#dolphin-view-config-sort-order').value;
        viewConfigDraft.sortBy = dialog.querySelector('#dolphin-view-config-sort-by').value;
        viewConfigDraft.foldersFirst = dialog.querySelector('#dolphin-view-config-folders-first').checked;
        viewConfigDraft.previews = dialog.querySelector('#dolphin-view-config-previews').checked;
        viewConfigDraft.groups = dialog.querySelector('#dolphin-view-config-groups').checked;
        viewConfigDraft.hiddenFiles = dialog.querySelector('#dolphin-view-config-hidden').checked;
        viewConfigDraft.hiddenLast = dialog.querySelector('#dolphin-view-config-hidden-last').checked;
    }

    function updateViewConfigApplyState() {
        const dialog = ensureViewConfigDialog();
        if (!dialog) {
            return;
        }
        collectViewConfigDraftFromDialog();
        const applyBtn = dialog.querySelector('#dolphin-view-config-apply');
        if (applyBtn) {
            applyBtn.disabled = JSON.stringify(viewConfigDraft) === viewConfigBaseline;
        }
    }

    function applyViewConfigDraft() {
        collectViewConfigDraftFromDialog();
        if (typeof global.setFileExplorerViewMode === 'function') {
            global.setFileExplorerViewMode(viewConfigDraft.mode);
        }
        const state = global.fileExplorerState;
        if (state && !!state.showHiddenFiles !== viewConfigDraft.hiddenFiles
            && typeof global.toggleExplorerHiddenFiles === 'function') {
            if (viewConfigDraft.hiddenFiles !== state.showHiddenFiles) {
                global.toggleExplorerHiddenFiles();
            }
        }
        syncViewModeUi(viewConfigDraft.mode);
        viewConfigBaseline = JSON.stringify(viewConfigDraft);
        updateViewConfigApplyState();
        global.setTimeout(alignNeonDolphinPathBar, 0);
    }

    function openViewConfigDialog() {
        closeViewMenu();
        populateViewConfigDialog();
        const dialog = ensureViewConfigDialog();
        if (dialog) {
            dialog.hidden = false;
        }
    }

    function closeViewConfigDialog() {
        const dialog = ensureViewConfigDialog();
        if (dialog) {
            dialog.hidden = true;
        }
    }

    function handleNeonDolphinClick(event) {
        const slot = getSlot();
        if (!slot || !slot.contains(event.target)) {
            return;
        }

        const hamburgerTrigger = event.target.closest('#dolphin-main-menu');
        if (hamburgerTrigger) {
            event.preventDefault();
            event.stopPropagation();
            toggleHamburgerMenu();
            return;
        }

        const hamburgerItem = event.target.closest('.dolphin-hamburger-menu__item[data-menu-id]');
        if (hamburgerItem && !hamburgerItem.disabled) {
            event.preventDefault();
            event.stopPropagation();
            runHamburgerAction(hamburgerItem.dataset.menuId);
            closeHamburgerMenu();
            return;
        }

        const trigger = event.target.closest('#dolphin-view-mode-btn');
        if (trigger) {
            event.preventDefault();
            event.stopPropagation();
            toggleViewMenu();
            return;
        }

        const modeItem = event.target.closest('.dolphin-view-menu__item[data-view-mode]');
        if (modeItem) {
            event.preventDefault();
            event.stopPropagation();
            const mode = modeItem.dataset.viewMode;
            if (mode && typeof global.setFileExplorerViewMode === 'function') {
                global.setFileExplorerViewMode(mode);
            }
            syncViewModeUi(mode);
            closeViewMenu();
            global.setTimeout(alignNeonDolphinPathBar, 0);
            return;
        }

        if (event.target.closest('#dolphin-view-config-open')) {
            event.preventDefault();
            event.stopPropagation();
            openViewConfigDialog();
            return;
        }

        if (event.target.closest('#dolphin-view-config-ok')) {
            event.preventDefault();
            applyViewConfigDraft();
            closeViewConfigDialog();
            return;
        }

        if (event.target.closest('#dolphin-view-config-apply')) {
            event.preventDefault();
            applyViewConfigDraft();
            return;
        }

        if (event.target.closest('#dolphin-view-config-cancel')
            || (event.target.closest('#dolphin-view-config') && !event.target.closest('.dolphin-view-config__panel'))) {
            event.preventDefault();
            closeViewConfigDialog();
            return;
        }

        if (!event.target.closest('.dolphin-toolbar__view')) {
            closeViewMenu();
        }
        if (!event.target.closest('.dolphin-toolbar__actions')) {
            closeHamburgerMenu();
        }
    }

    let neonCompactResizeObserver = null;

    function observeNeonCompactLayout() {
        const slot = getSlot();
        if (!slot || typeof global.ResizeObserver !== 'function') {
            return;
        }
        const panes = slot.querySelectorAll('.dolphin-content-pane');
        if (!panes.length) {
            return;
        }
        if (neonCompactResizeObserver) {
            neonCompactResizeObserver.disconnect();
        }
        neonCompactResizeObserver = new global.ResizeObserver(() => {
            scheduleNeonCompactLayout();
        });
        panes.forEach((pane) => neonCompactResizeObserver.observe(pane));
    }

    function bindNeonDolphinUi() {
        const slot = getSlot();
        if (!slot || !slot.querySelector('.dolphin-app')) {
            return;
        }
        if (!neonBindingsReady) {
            global.document.addEventListener('click', handleNeonDolphinClick, true);
            slot.addEventListener('change', (event) => {
                if (event.target.closest('#dolphin-view-config')) {
                    updateViewConfigApplyState();
                }
            });
            slot.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    closeViewConfigDialog();
                    closeViewMenu();
                }
                if (event.ctrlKey && event.key === '1') {
                    global.setFileExplorerViewMode && global.setFileExplorerViewMode('icons');
                    syncViewModeUi('icons');
                }
                if (event.ctrlKey && event.key === '2') {
                    global.setFileExplorerViewMode && global.setFileExplorerViewMode('compact');
                    syncViewModeUi('compact');
                }
                if (event.ctrlKey && event.key === '3') {
                    global.setFileExplorerViewMode && global.setFileExplorerViewMode('list');
                    syncViewModeUi('list');
                }
            });
            global.addEventListener('resize', notifyNeonWindowGeometryChanged);
            observeNemoWindowGeometry();
            neonBindingsReady = true;
        }
        ensureNeonSearchInActions();
        ensureSecondaryPathBar();
        ensureHamburgerMenu();
        syncViewModeUi();
        syncNeonSplitChrome();
        observeNemoWindowGeometry();
        observeNeonCompactLayout();
        alignNeonDolphinPathBar();
        scheduleNeonCompactLayout();
    }

    function watchForDolphinShell() {
        const slot = getSlot();
        if (!slot) {
            return;
        }
        if (slot.querySelector('.dolphin-app')) {
            bindNeonDolphinUi();
            return;
        }
        if (slot.dataset.neonDolphinWatch === 'true') {
            return;
        }
        slot.dataset.neonDolphinWatch = 'true';
        const observer = new MutationObserver(() => {
            if (slot.querySelector('.dolphin-app')) {
                observer.disconnect();
                slot.dataset.neonDolphinWatch = 'false';
                bindNeonDolphinUi();
                scheduleNeonChromeRefresh();
            }
        });
        observer.observe(slot, { childList: true, subtree: true });
    }

    function scheduleNeonChromeRefresh() {
        normalizeNeonRootLabels();
        watchForDolphinShell();
        bindNeonDolphinUi();
        ensureNeonSearchInActions();
        syncViewModeUi();
        syncNeonSplitChrome();
        normalizeNeonListViewCells();
        global.setTimeout(alignNeonDolphinPathBar, 0);
        global.setTimeout(alignNeonDolphinPathBar, 120);
        global.setTimeout(alignNeonDolphinPathBar, 400);
        global.setTimeout(alignNeonDolphinPathBar, 900);
        scheduleNeonCompactLayout();
    }

    function wrapExplorerFn(name, after) {
        const original = global[name];
        if (typeof original !== 'function') {
            return;
        }
        global[name] = function wrappedExplorerFn(...args) {
            patchManifestRootLabel();
            const result = original.apply(this, args);
            if (typeof after === 'function') {
                after();
            } else {
                scheduleNeonChromeRefresh();
            }
            return result;
        };
    }

    wrapExplorerFn('updateExplorerWindowTitle', normalizeNeonWindowTitle);
    wrapExplorerFn('updatePathDisplay', () => {
        syncNeonDualPathLabels();
        syncNeonSplitChrome();
    });
    wrapExplorerFn('setFileExplorerViewMode', () => {
        syncViewModeUi();
        scheduleNeonPathBarAlign();
        scheduleNeonCompactLayout();
        normalizeNeonListViewCells();
    });
    wrapExplorerFn('applyFileExplorerViewMode', () => {
        syncViewModeUi();
        scheduleNeonPathBarAlign();
        scheduleNeonCompactLayout();
        normalizeNeonListViewCells();
    });
    wrapExplorerFn('renderDirectory', () => {
        scheduleNeonCompactLayout();
        normalizeNeonListViewCells();
    });

    const updateChromeOriginal = global.updateDolphinExplorerChrome;
    global.updateDolphinExplorerChrome = function neonUpdateDolphinExplorerChrome(...args) {
        let result;
        if (typeof updateChromeOriginal === 'function') {
            result = updateChromeOriginal.apply(this, args);
        }
        syncNeonSplitChrome();
        scheduleNeonPathBarAlign();
        scheduleNeonCompactLayout();
        return result;
    };

    global.alignDolphinPathBarToContentGrid = function neonAlignDolphinPathBar() {
        const slot = getSlot();
        if (slot) {
            slot.querySelectorAll('.dolphin-toolbar__path').forEach((pathGroup) => {
                if (!global.fileExplorerState || !global.fileExplorerState.splitView) {
                    pathGroup.style.marginLeft = '';
                }
            });
        }
        alignNeonDolphinPathBar();
    };

    wrapNemoWindowGeometryHook('toggleWindowMaximized');
    wrapNemoWindowGeometryHook('maximizeWindowElement');
    wrapNemoWindowGeometryHook('restoreWindowElement');

    if (typeof global.openWindowByDataLink === 'function') {
        const openOriginal = global.openWindowByDataLink;
        global.openWindowByDataLink = function openWindowByDataLinkNeon(dataLink, ...rest) {
            const opened = openOriginal.call(this, dataLink, ...rest);
            if (String(dataLink) === 'nemo') {
                watchForDolphinShell();
                scheduleNeonChromeRefresh();
            }
            return opened;
        };
    }

    if (global.document) {
        global.document.addEventListener('DOMContentLoaded', scheduleNeonChromeRefresh);
    }
}(window));
