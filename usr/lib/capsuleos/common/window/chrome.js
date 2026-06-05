/**
 * Chrome fenêtre — registre providers et header template.
 * Résolution toolkit : CapsuleWindowHeaderContext (etc/capsuleos/contracts/window-chrome-contexts.json).
 */
(function initCapsuleWindowChrome(global) {
    'use strict';

    const providers = {};
    const targetsApi = () => global.CapsuleWindowDragTargets;

    function headerCtx() {
        return global.CapsuleWindowHeaderContext || null;
    }

    function isKdeFamily() {
        const ctx = headerCtx();
        if (ctx && typeof ctx.isKdeFamily === 'function') {
            return ctx.isKdeFamily();
        }
        return false;
    }

    function isNautilusFamilyExplorer() {
        const ctx = headerCtx();
        if (ctx && typeof ctx.isNautilusFamilyExplorer === 'function') {
            return ctx.isNautilusFamilyExplorer();
        }
        return false;
    }

    function isDolphinExplorerSlot(slotId) {
        const ctx = headerCtx();
        if (ctx && typeof ctx.isDolphinExplorerSlot === 'function') {
            return ctx.isDolphinExplorerSlot(slotId);
        }
        return false;
    }

    function isNautilusFamilySlot(slotId) {
        const ctx = headerCtx();
        if (ctx && typeof ctx.isNautilusFamilySlot === 'function') {
            return ctx.isNautilusFamilySlot(slotId);
        }
        return false;
    }

    function isFileRollerGtkCsdSlot(slotId) {
        const ctx = headerCtx();
        if (ctx && typeof ctx.resolveChromeProviderId === 'function') {
            return ctx.resolveChromeProviderId(slotId) === 'file-roller-gtk';
        }
        return slotId === 'file_roller';
    }

    function resolveChromeProviderId(slotId) {
        const ctx = headerCtx();
        if (ctx && typeof ctx.resolveChromeProviderId === 'function') {
            return ctx.resolveChromeProviderId(slotId);
        }
        if (slotId === 'nemo') {
            return 'nemo';
        }
        return 'default';
    }

    function relocateFileRollerWindowControls(container) {
        const header = container.querySelector(':scope > #windowHeader');
        const headerEnd = container.querySelector('.fr-app__header-end');
        if (!header || !headerEnd) {
            return false;
        }
        if (header.dataset.fileRollerCsd === 'true') {
            return true;
        }

        header.dataset.fileRollerCsd = 'true';
        container.classList.add('file-roller--csd');

        let csdWrap = headerEnd.querySelector('.fr-app__window-controls');
        if (!csdWrap) {
            csdWrap = document.createElement('div');
            csdWrap.className = 'fr-app__window-controls';
            csdWrap.setAttribute('role', 'group');
            csdWrap.setAttribute('aria-label', 'Contrôles de fenêtre');
            headerEnd.appendChild(csdWrap);
        }

        const minBtn = header.querySelector('#minimizeBtn');
        const maxBtn = header.querySelector('#resizeBtn');
        const closeBtn = header.querySelector('#closeBtn');
        [minBtn, maxBtn, closeBtn].forEach((btn) => {
            if (btn) {
                csdWrap.appendChild(btn);
            }
        });

        const title = header.querySelector('#windowTitle');
        if (title) {
            title.setAttribute('aria-hidden', 'true');
        }

        const appTitle = container.querySelector('.fr-app__title');
        if (appTitle && !appTitle.hasAttribute('data-window-drag-region')) {
            appTitle.setAttribute('data-window-drag-region', '');
        }

        return true;
    }

    function createHeaderTemplate() {
        const windowHeader = document.createElement('div');
        const left = document.createElement('nav');
        const title = document.createElement('span');
        const right = document.createElement('nav');
        const minimizeBtn = document.createElement('button');
        const maximizeBtn = document.createElement('button');
        const closeBtn = document.createElement('button');

        windowHeader.id = 'windowHeader';
        windowHeader.style.minWidth = 'calc(var(--full) - calc(var(--head) / 20))';

        title.id = 'windowTitle';
        title.textContent = document.title;

        minimizeBtn.id = 'minimizeBtn';
        maximizeBtn.id = 'resizeBtn';
        closeBtn.id = 'closeBtn';

        windowHeader.appendChild(left);
        windowHeader.appendChild(title);
        windowHeader.appendChild(right);
        right.appendChild(minimizeBtn);
        right.appendChild(maximizeBtn);
        right.appendChild(closeBtn);

        return windowHeader;
    }

    let headerTemplate = null;

    function getHeaderTemplate() {
        if (!headerTemplate) {
            headerTemplate = createHeaderTemplate();
        }
        return headerTemplate;
    }

    function applyKdeWindowHeaderIcons(container) {
        const ctx = headerCtx();
        const useKde = ctx && typeof ctx.shouldUseKdeHeaderIcons === 'function'
            ? ctx.shouldUseKdeHeaderIcons()
            : isKdeFamily();
        if (!container || !useKde) {
            return;
        }
        const headerIconUrl = (file) => {
            const logical = `./assets/images/toolkits/kde/header/${file}`;
            if (typeof global.resolveCapsuleResourceUrl === 'function') {
                return global.resolveCapsuleResourceUrl(logical);
            }
            const toolkitBase = global.CAPSULE_TOOLKIT_ASSETS_BASE
                || (global.CAPSULE_ASSETS_BASE
                    ? `${String(global.CAPSULE_ASSETS_BASE).replace(/\/+$/, '')}/images/toolkits/kde`
                    : null);
            return toolkitBase ? `${toolkitBase}/header/${file}` : logical;
        };
        const header = container.querySelector('#windowHeader');
        if (!header) {
            return;
        }
        const minBtn = header.querySelector('#minimizeBtn');
        const resBtn = header.querySelector('#resizeBtn');
        const clsBtn = header.querySelector('#closeBtn');

        if (minBtn) {
            minBtn.style.backgroundImage = `url("${headerIconUrl('minimize.svg')}")`;
        }
        if (resBtn) {
            resBtn.style.backgroundImage = `url("${headerIconUrl('window-restore.svg')}")`;
            resBtn.style.backgroundSize = 'calc(var(--head) / 2.55)';
        }
        if (clsBtn) {
            clsBtn.style.backgroundImage = `url("${headerIconUrl('window-close.svg')}")`;
        }
    }

    function applyPassthroughChromeHeader(header) {
        const api = targetsApi();
        if (!header) {
            return;
        }
        if (api && typeof api.markDragPassthrough === 'function') {
            api.markDragPassthrough(header);
        } else {
            header.setAttribute('data-window-drag-handle', '');
            header.setAttribute('data-window-drag-passthrough', 'true');
        }
        if (api && typeof api.ensureHeaderDragFill === 'function') {
            api.ensureHeaderDragFill(header);
        }
    }

    function applyDragHandlePolicy(container, slotId, providerId) {
        const header = container.querySelector(':scope > #windowHeader');
        const appHandle = container.querySelector('[data-window-drag-handle]');
        const ctx = headerCtx();
        const unifiedExplorer = ctx
            && typeof ctx.usesUnifiedExplorerTitleBar === 'function'
            && ctx.usesUnifiedExplorerTitleBar()
            && slotId === (ctx.EXPLORER_SLOT || 'nemo');

        if (providerId === 'nemo-gnome') {
            if (header) {
                applyPassthroughChromeHeader(header);
            }
            const nautilusHeader = container.querySelector(
                '.nautilus-app__win-head, .nautilus-app__headerbar, #nemoHeaderContainer'
            );
            if (nautilusHeader) {
                if (targetsApi() && typeof targetsApi().markDragPassthrough === 'function') {
                    targetsApi().markDragPassthrough(nautilusHeader);
                } else {
                    nautilusHeader.setAttribute('data-window-drag-handle', '');
                    nautilusHeader.setAttribute('data-window-drag-passthrough', 'true');
                }
            } else if (appHandle) {
                if (targetsApi() && typeof targetsApi().markDragPassthrough === 'function') {
                    targetsApi().markDragPassthrough(appHandle);
                } else {
                    appHandle.setAttribute('data-window-drag-handle', '');
                    appHandle.setAttribute('data-window-drag-passthrough', 'true');
                }
            }
            return;
        }

        if (providerId === 'dolphin' && header) {
            header.setAttribute('data-window-drag-handle', '');
            header.removeAttribute('data-window-drag-passthrough');
            return;
        }

        if (providerId === 'nemo') {
            if (unifiedExplorer && header && appHandle) {
                header.setAttribute('data-window-drag-handle', '');
                header.removeAttribute('data-window-drag-passthrough');
                appHandle.removeAttribute('data-window-drag-handle');
                appHandle.removeAttribute('data-window-drag-passthrough');
                return;
            }
            if (appHandle && header) {
                applyPassthroughChromeHeader(appHandle);
                header.removeAttribute('data-window-drag-handle');
                header.removeAttribute('data-window-drag-passthrough');
                return;
            }
            if (header) {
                header.setAttribute('data-window-drag-handle', '');
                header.removeAttribute('data-window-drag-passthrough');
            }
            return;
        }

        if (providerId === 'firefox-gnome' && appHandle) {
            if (targetsApi() && typeof targetsApi().markDragPassthrough === 'function') {
                targetsApi().markDragPassthrough(appHandle);
            } else {
                appHandle.setAttribute('data-window-drag-handle', '');
                appHandle.setAttribute('data-window-drag-passthrough', 'true');
            }
            if (header) {
                header.removeAttribute('data-window-drag-handle');
                header.removeAttribute('data-window-drag-passthrough');
            }
            return;
        }

        if (providerId === 'file-roller-gtk') {
            const headerbar = container.querySelector('.fr-app__headerbar');
            if (headerbar) {
                if (targetsApi() && typeof targetsApi().markDragPassthrough === 'function') {
                    targetsApi().markDragPassthrough(headerbar);
                } else {
                    headerbar.setAttribute('data-window-drag-handle', '');
                    headerbar.setAttribute('data-window-drag-passthrough', 'true');
                }
            }
            if (header) {
                header.removeAttribute('data-window-drag-handle');
                header.removeAttribute('data-window-drag-passthrough');
                header.setAttribute('aria-hidden', 'true');
            }
            return;
        }

        if (header) {
            header.setAttribute('data-window-drag-handle', '');
            header.removeAttribute('data-window-drag-passthrough');
            if (targetsApi() && typeof targetsApi().ensureHeaderDragFill === 'function') {
                targetsApi().ensureHeaderDragFill(header);
            }
        }
    }

    providers.default = {
        id: 'default',
        ensureHeader(container) {
            let header = container.querySelector(':scope > #windowHeader');
            if (!header) {
                header = getHeaderTemplate().cloneNode(true);
                container.insertBefore(header, container.firstChild);
            }
            return header;
        },
        afterInject(container, slotId) {
            applyKdeWindowHeaderIcons(container);
            applyDragHandlePolicy(container, slotId, 'default');
        },
    };

    providers.dolphin = {
        id: 'dolphin',
        ensureHeader(container) {
            return providers.default.ensureHeader(container);
        },
        afterInject(container, slotId) {
            applyKdeWindowHeaderIcons(container);
            applyDragHandlePolicy(container, slotId, 'dolphin');
        },
    };

    providers.nemo = {
        id: 'nemo',
        ensureHeader(container) {
            return providers.default.ensureHeader(container);
        },
        afterInject(container, slotId) {
            applyKdeWindowHeaderIcons(container);
            applyDragHandlePolicy(container, slotId, 'nemo');
        },
    };

    providers['nemo-gnome'] = {
        id: 'nemo-gnome',
        ensureHeader(container) {
            return providers.default.ensureHeader(container);
        },
        afterInject(container, slotId) {
            applyKdeWindowHeaderIcons(container);
            applyDragHandlePolicy(container, slotId, 'nemo-gnome');
        },
    };

    providers['firefox-gnome'] = {
        id: 'firefox-gnome',
        ensureHeader(container) {
            return providers.default.ensureHeader(container);
        },
        afterInject(container, slotId) {
            applyDragHandlePolicy(container, slotId, 'firefox-gnome');
        },
    };

    providers['terminal-gnome'] = providers.default;
    providers['terminal-cosmic'] = providers.default;

    providers['file-roller-gtk'] = {
        id: 'file-roller-gtk',
        ensureHeader(container) {
            return providers.default.ensureHeader(container);
        },
        afterInject(container, slotId) {
            relocateFileRollerWindowControls(container);
            applyDragHandlePolicy(container, slotId, 'file-roller-gtk');
        },
    };

    function registerChromeProvider(id, provider) {
        providers[id] = provider;
    }

    function getChromeProvider(slotId) {
        const id = resolveChromeProviderId(slotId);
        return providers[id] || providers.default;
    }

    function ensureHeader(container, slotId) {
        if (!container || slotId === 'mainMenu') {
            return null;
        }
        const isGnomeStartMenu = slotId === 'mainMenu'
            && !!container.querySelector('#menu-gnome-root');
        if (isGnomeStartMenu) {
            return null;
        }
        const provider = getChromeProvider(slotId);
        return provider.ensureHeader(container);
    }

    function stampChromeToolkitAttributes(container, slotId) {
        if (!container) {
            return;
        }
        const ctx = headerCtx();
        if (!ctx) {
            return;
        }
        const toolkitId = typeof ctx.resolveToolkitId === 'function'
            ? ctx.resolveToolkitId()
            : '';
        const providerId = resolveChromeProviderId(slotId);
        if (toolkitId) {
            container.setAttribute('data-window-chrome-toolkit', toolkitId);
        }
        if (providerId) {
            container.setAttribute('data-window-chrome-provider', providerId);
        }
    }

    function afterInject(container, slotId) {
        const provider = getChromeProvider(slotId);
        if (typeof provider.afterInject === 'function') {
            provider.afterInject(container, slotId);
        }
        stampChromeToolkitAttributes(container, slotId);
    }

    global.CapsuleWindowChrome = {
        registerChromeProvider,
        getChromeProvider,
        resolveChromeProviderId,
        ensureHeader,
        afterInject,
        applyKdeWindowHeaderIcons,
        getHeaderTemplate,
        isKdeFamily,
        isNautilusFamilyExplorer,
        isDolphinExplorerSlot,
        isNautilusFamilySlot,
    };
}(typeof window !== 'undefined' ? window : globalThis));
