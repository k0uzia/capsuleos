/**
 * Shell fenêtre Linux — délègue au noyau commun (référence macOS Sonoma).
 */
(function initLinuxWindowContainer() {
    'use strict';

    const WINDOW_TITLE_MAP = {
        profile: 'À Propos',
        librewriter: 'Sans nom 1 - LibreOffice Writer',
        librecalc: 'Sans nom 1 - LibreOffice Calc',
        calculator: 'Calculatrice',
        clocks: 'Horloges',
        calendar: 'Calendrier',
        screenshot: 'Capture d\'écran',
        drawing: 'Sans titre — Dessin',
        file_roller: 'Gestionnaire d\'archives',
        mintdrivers: 'Gestionnaire de pilotes',
        mintinstall: 'Logithèque',
        system_monitor: 'Moniteur système',
        update_manager: 'Gestionnaire de mise à jour',
    };

    const WINDOW_TASK_MAP = {
        nemo: 'open-nemo',
        firefox: 'open-firefox',
        terminal: 'open-terminal',
        mainMenu: 'open-menu',
        visionneur_images: 'open-viewer',
        visionneur_pdf: 'open-viewer',
        lecteur_multimedia: 'open-viewer',
        profile: 'open-profile',
    };

    const LINUX_WINDOW_SIZE_SKIP = new Set(['mainMenu']);
    const CASCADE_STEP_PX = 28;
    const CASCADE_BASE_LEFT_PX = 36;
    const CASCADE_BASE_TOP_PX = 18;

    let linuxWindowSizeProbe = null;

    function isGnomeStartMenuContainer(container, dataLink) {
        return dataLink === 'mainMenu' && !!container.querySelector('#menu-gnome-root');
    }

    function getLinuxWindowSizeProbe() {
        if (!linuxWindowSizeProbe && typeof document !== 'undefined') {
            linuxWindowSizeProbe = document.createElement('div');
            linuxWindowSizeProbe.setAttribute('aria-hidden', 'true');
            linuxWindowSizeProbe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;';
            document.body.appendChild(linuxWindowSizeProbe);
        }
        return linuxWindowSizeProbe;
    }

    function readLinuxCssVarPx(varName, dimension) {
        if (!varName || typeof document === 'undefined') {
            return 0;
        }
        const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (!raw) {
            return 0;
        }
        const probe = getLinuxWindowSizeProbe();
        if (!probe) {
            return 0;
        }
        if (dimension === 'height') {
            probe.style.width = '0';
            probe.style.height = raw;
            const px = probe.offsetHeight;
            probe.style.height = '';
            return px;
        }
        probe.style.height = '0';
        probe.style.width = raw;
        const px = probe.offsetWidth;
        probe.style.width = '';
        return px;
    }

    function resolveLinuxWindowSizeVars(dataLink) {
        const appWidthVar = `--win-${dataLink}-width`;
        const appHeightVar = `--win-${dataLink}-height`;
        const appMinWidthVar = `--win-${dataLink}-min-width`;
        const appMinHeightVar = `--win-${dataLink}-min-height`;

        let width = readLinuxCssVarPx(appWidthVar, 'width');
        let height = readLinuxCssVarPx(appHeightVar, 'height');
        let minWidth = readLinuxCssVarPx(appMinWidthVar, 'width');
        let minHeight = readLinuxCssVarPx(appMinHeightVar, 'height');

        if (!width) width = readLinuxCssVarPx('--win-default-width', 'width');
        if (!height) height = readLinuxCssVarPx('--win-default-height', 'height');
        if (!minWidth) minWidth = readLinuxCssVarPx('--win-default-min-width', 'width');
        if (!minHeight) minHeight = readLinuxCssVarPx('--win-default-min-height', 'height');

        return { width: width, height: height, minWidth: minWidth, minHeight: minHeight };
    }

    function applyInitialLinuxWindowSize(container, dataLink) {
        if (!container || !dataLink || LINUX_WINDOW_SIZE_SKIP.has(dataLink)) {
            return;
        }
        if (container.dataset.sizeInit === 'true') {
            return;
        }
        if (isGnomeStartMenuContainer(container, dataLink)) {
            return;
        }
        const sizes = resolveLinuxWindowSizeVars(dataLink);
        if (!sizes.width || !sizes.height) {
            return;
        }
        container.style.bottom = 'auto';
        container.style.width = `${sizes.width}px`;
        container.style.height = `${sizes.height}px`;
        if (sizes.minWidth) {
            container.style.minWidth = `${sizes.minWidth}px`;
        }
        if (sizes.minHeight) {
            container.style.minHeight = `${sizes.minHeight}px`;
        }
        container.dataset.sizeInit = 'true';
    }

    function countVisibleDesktopWindows(exceptContainer) {
        const desktop = document.querySelector('object#desktop, #desktop');
        if (!desktop) {
            return 0;
        }
        return Array.from(desktop.querySelectorAll('.windowElement'))
            .filter((win) => win !== exceptContainer)
            .filter((win) => win.style.display !== 'none')
            .filter((win) => !LINUX_WINDOW_SIZE_SKIP.has(win.dataset.link))
            .length;
    }

    function readDockInsetPx() {
        const bodyId = document.body && document.body.id ? document.body.id : '';
        const gnomeNoPersistentDock = new Set(['fedora', 'rocky', 'alma']);
        if (gnomeNoPersistentDock.has(bodyId)) {
            const reserved = readLinuxCssVarPx('--fedora-dock-width', 'width');
            if (!reserved) {
                return 0;
            }
        }
        const dockEl = document.querySelector('#tableau.fedora-dock, aside.fedora-dock');
        if (dockEl) {
            const cs = getComputedStyle(dockEl);
            if (cs.display === 'none' || cs.visibility === 'hidden') {
                return 0;
            }
            const measured = dockEl.offsetWidth;
            if (measured > 0) {
                return measured;
            }
        }
        const dockVarByBody = {
            ubuntu: '--ubuntu-dock-width',
            popos: '--popos-dock-width',
            fedora: '--fedora-dock-width',
            rocky: '--fedora-dock-width',
            alma: '--fedora-dock-width',
        };
        const varName = dockVarByBody[bodyId];
        return varName ? (readLinuxCssVarPx(varName, 'width') || 0) : 0;
    }

    function readTopBarInsetPx() {
        return readLinuxCssVarPx('--fedora-top-bar-height', 'height')
            || readLinuxCssVarPx('--ubuntu-top-bar-height', 'height')
            || readLinuxCssVarPx('--head', 'height')
            || 0;
    }

    function applyCenteredPlacement(container) {
        if (!container || container.dataset.cascadeInit === 'true') {
            return;
        }
        const dock = readDockInsetPx();
        const topBar = readTopBarInsetPx();
        const workW = Math.max(0, window.innerWidth - dock);
        const workH = Math.max(0, window.innerHeight - topBar);
        const width = container.offsetWidth || readLinuxCssVarPx('--win-themes-width', 'width');
        const height = container.offsetHeight || readLinuxCssVarPx('--win-themes-height', 'height');
        const left = dock + Math.max(12, (workW - width) / 2);
        const top = topBar + Math.max(12, (workH - height) / 2);
        container.style.position = 'fixed';
        container.style.left = `${left}px`;
        container.style.top = `${top}px`;
        container.style.bottom = 'auto';
        container.style.right = 'auto';
        container.dataset.cascadeInit = 'true';
    }

    function applyCascadePlacement(container) {
        if (!container || container.dataset.cascadeInit === 'true') {
            return;
        }
        const slotId = container.dataset.link;
        if (!slotId || LINUX_WINDOW_SIZE_SKIP.has(slotId)) {
            return;
        }
        if (slotId === 'themes') {
            applyCenteredPlacement(container);
            return;
        }
        const index = countVisibleDesktopWindows(container);
        const left = CASCADE_BASE_LEFT_PX + (index * CASCADE_STEP_PX);
        const top = CASCADE_BASE_TOP_PX + (index * CASCADE_STEP_PX);
        container.style.position = 'absolute';
        container.style.left = `${left}px`;
        container.style.top = `${top}px`;
        container.dataset.cascadeInit = 'true';
    }

    function applyKdeWindowHeaderIcons(container) {
        if (typeof CapsuleWindowChrome !== 'undefined' && CapsuleWindowChrome.applyKdeWindowHeaderIcons) {
            CapsuleWindowChrome.applyKdeWindowHeaderIcons(container);
        }
    }

    if (typeof CapsuleWindowShell === 'undefined') {
        console.error('CapsuleOS: charger shells/common/capsule-window-shell.js avant windowContainer.js');
        return;
    }

    CapsuleWindowShell.init({
        displayOnOpen: 'flex',
        useStylesheetDisplay: true,
        titleMap: WINDOW_TITLE_MAP,
        taskMap: WINDOW_TASK_MAP,
        resolveTitle: function (slotId) {
            if (typeof window.getResolvedWindowTitle === 'function') {
                const resolved = window.getResolvedWindowTitle(slotId);
                if (resolved) {
                    return resolved;
                }
            }
            return WINDOW_TITLE_MAP[slotId] || slotId;
        },
        beforeOpen: function (container, slotId) {
            applyInitialLinuxWindowSize(container, slotId);
            applyKdeWindowHeaderIcons(container);
        },
        afterOpen: function (container, slotId) {
            window.requestAnimationFrame(() => {
                applyCascadePlacement(container);
                if (typeof window.CapsuleTaskbarWindowList !== 'undefined'
                    && typeof window.CapsuleTaskbarWindowList.refresh === 'function') {
                    window.CapsuleTaskbarWindowList.refresh();
                }
            });
            if (slotId === 'update_manager' && typeof window.initUpdateManagerApp === 'function') {
                window.initUpdateManagerApp();
            }
            if (slotId === 'mintinstall' && typeof window.initMintInstallApp === 'function') {
                window.initMintInstallApp();
            }
            if (slotId === 'system_monitor' && typeof window.initSystemMonitorApp === 'function') {
                window.initSystemMonitorApp();
            }
        },
    });

    const nativeOpen = window.openWindowByDataLink;
    window.openWindowByDataLink = function (dataLink, options) {
        if (options && options.newWindow === true && typeof window.openNewWindowByDataLink === 'function') {
            return window.openNewWindowByDataLink(dataLink);
        }
        const ok = nativeOpen(dataLink);
        if (ok && dataLink === 'update_manager' && typeof window.initUpdateManagerApp === 'function') {
            window.initUpdateManagerApp();
        }
        if (ok && dataLink === 'mintinstall' && typeof window.initMintInstallApp === 'function') {
            window.initMintInstallApp();
        }
        if (ok && dataLink === 'system_monitor' && typeof window.initSystemMonitorApp === 'function') {
            window.initSystemMonitorApp();
        }
        return ok;
    };
}());
