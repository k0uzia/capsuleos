/**
 * Chrome fenêtre — registre providers et header template.
 */
(function initCapsuleWindowChrome(global) {
    'use strict';

    const providers = {};
    const targetsApi = () => global.CapsuleWindowDragTargets;

    function isKdeFamily() {
        const skinKey = global.CAPSULE_EMBED_SKIN_KEY;
        const explorerTemplate = global.CAPSULE_EXPLORER_TEMPLATE;
        const bodyId = document.body ? document.body.id : null;

        if (explorerTemplate === 'dolphin') {
            return true;
        }
        if (skinKey === 'opensuse' || skinKey === 'mxkde' || skinKey === 'debiankde') {
            return true;
        }
        return bodyId === 'opensuse' || bodyId === 'mx-kde' || bodyId === 'debian-kde';
    }

    function isDolphinExplorerSlot(slotId) {
        return slotId === 'nemo' && global.CAPSULE_EXPLORER_TEMPLATE === 'dolphin';
    }

    function isNautilusFamilyExplorer() {
        const template = global.CAPSULE_EXPLORER_TEMPLATE;
        return template === 'nemo-gnome'
            || template === 'nautilus'
            || template === 'nemo-cosmic'
            || template === 'nautilus-cosmic';
    }

    function isNautilusFamilySlot(slotId) {
        return slotId === 'nemo' && isNautilusFamilyExplorer();
    }

    function resolveChromeProviderId(slotId) {
        if (isDolphinExplorerSlot(slotId)) {
            return 'dolphin';
        }
        if (isNautilusFamilySlot(slotId)) {
            return 'nemo-gnome';
        }
        if (slotId === 'nemo') {
            return 'nemo';
        }
        if (slotId === 'firefox') {
            const skin = global.CAPSULE_EMBED_SKIN_KEY;
            if (skin === 'fedora' || skin === 'ubuntu' || skin === 'popos') {
                return 'firefox-gnome';
            }
        }
        if (slotId === 'terminal') {
            const skin = global.CAPSULE_EMBED_SKIN_KEY;
            if (skin === 'popos') {
                return 'terminal-cosmic';
            }
            if (skin === 'fedora' || skin === 'ubuntu') {
                return 'terminal-gnome';
            }
        }
        return 'default';
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
        if (!container || !isKdeFamily()) {
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
            const mintUnifiedChrome = global.document
                && global.document.body
                && global.document.body.id === 'mint';
            if (mintUnifiedChrome && header && appHandle) {
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

    function afterInject(container, slotId) {
        const provider = getChromeProvider(slotId);
        if (typeof provider.afterInject === 'function') {
            provider.afterInject(container, slotId);
        }
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
    };
}(typeof window !== 'undefined' ? window : globalThis));
