/**
 * CapsuleOS window kernel (bundle généré).
 * Source : usr/lib/capsuleos/common/window/
 * Regénérer : node usr/lib/capsuleos/tools/build-capsule-window.mjs
 */
/**
 * Bornes fenêtre partagées (drag + resize).
 */
(function initCapsuleWindowBounds(global) {
    'use strict';

    const defaultBoundsOptions = {
        mainSelector: 'main',
        desktopSelector: '#desktop',
        footerSelector: 'footer',
    };

    function shouldSubtractFooter(opts) {
        if (opts.subtractFooter === false) {
            return false;
        }
        const selector = opts.footerSelector;
        return typeof selector === 'string' && selector.trim().length > 0;
    }

    function getWorkAreaRect(options = {}) {
        const opts = Object.assign({}, defaultBoundsOptions, options);
        const main = opts.mainSelector
            ? document.querySelector(opts.mainSelector)
            : null;
        const desktop = opts.desktopSelector
            ? document.querySelector(opts.desktopSelector)
            : null;

        let rect;
        if (main) {
            rect = main.getBoundingClientRect();
        } else if (desktop) {
            rect = desktop.getBoundingClientRect();
        } else {
            rect = document.documentElement.getBoundingClientRect();
        }

        let footerHeight = 0;
        if (shouldSubtractFooter(opts)) {
            const footer = document.querySelector(opts.footerSelector);
            footerHeight = footer ? footer.offsetHeight : 0;
        }

        return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: Math.max(120, rect.height - footerHeight),
            right: rect.right,
            bottom: rect.bottom - footerHeight,
        };
    }

    function clampPosition(element, left, top, options = {}) {
        const bounds = getWorkAreaRect(options);
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const maxLeft = bounds.right - width;
        const maxTop = bounds.bottom - height;

        return {
            left: Math.max(bounds.left, Math.min(left, maxLeft)),
            top: Math.max(bounds.top, Math.min(top, maxTop)),
        };
    }

    function clampSize(element, left, top, width, height, options = {}) {
        const bounds = getWorkAreaRect(options);
        const computed = window.getComputedStyle(element);
        const minWidth = parseFloat(computed.minWidth) || 320;
        const minHeight = parseFloat(computed.minHeight) || 180;

        let nextWidth = Math.max(minWidth, width);
        let nextHeight = Math.max(minHeight, height);
        let nextLeft = left;
        let nextTop = top;

        nextLeft = Math.max(bounds.left, nextLeft);
        nextTop = Math.max(bounds.top, nextTop);
        nextWidth = Math.min(nextWidth, bounds.right - nextLeft);
        nextHeight = Math.min(nextHeight, bounds.bottom - nextTop);
        nextWidth = Math.max(minWidth, nextWidth);
        nextHeight = Math.max(minHeight, nextHeight);

        return { left: nextLeft, top: nextTop, width: nextWidth, height: nextHeight };
    }

    global.CapsuleWindowBounds = {
        getWorkAreaRect,
        clampPosition,
        clampSize,
    };
}(typeof window !== 'undefined' ? window : globalThis));
/**
 * Ancrage fenêtre — object#desktop : position absolute (évite fixed + overflow).
 */
(function initCapsuleWindowPositioning(global) {
    'use strict';

    const boundsApi = () => global.CapsuleWindowBounds;

    function resolveDesktopRoot(options = {}) {
        if (typeof document === 'undefined') {
            return null;
        }
        const selector = options.desktopSelector || options.mainSelector;
        if (!selector) {
            return null;
        }
        return document.querySelector(selector);
    }

    function shouldUseDesktopAnchor(element, options = {}) {
        const root = resolveDesktopRoot(options);
        if (!root || !element || !root.contains(element)) {
            return false;
        }
        if (root.tagName === 'OBJECT') {
            return true;
        }
        return root.id === 'desktop';
    }

    function desktopRootOffset(options = {}) {
        const root = resolveDesktopRoot(options);
        if (!root) {
            return { left: 0, top: 0 };
        }
        const rect = root.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
    }

    function applyViewportBox(element, box, options = {}) {
        if (!element || !box) {
            return box;
        }

        element.style.transform = 'none';
        element.style.marginLeft = '0';
        element.style.marginRight = '0';

        if (shouldUseDesktopAnchor(element, options)) {
            const offset = desktopRootOffset(options);
            element.style.position = 'absolute';
            element.style.left = `${box.left - offset.left}px`;
            element.style.top = `${box.top - offset.top}px`;
        } else {
            element.style.position = 'fixed';
            element.style.left = `${box.left}px`;
            element.style.top = `${box.top}px`;
        }

        if (box.width != null) {
            element.style.width = `${box.width}px`;
        }
        if (box.height != null) {
            element.style.height = `${box.height}px`;
        }

        return box;
    }

    function applyViewportPosition(element, left, top, options = {}) {
        if (!boundsApi() || typeof boundsApi().clampPosition !== 'function') {
            return null;
        }
        const clamped = boundsApi().clampPosition(element, left, top, options);
        return applyViewportBox(element, clamped, options);
    }

    function syncAnchorFromLayout(element, options = {}) {
        if (!element || element.style.display === 'none') {
            return;
        }
        if (!shouldUseDesktopAnchor(element, options)) {
            return;
        }
        const rect = element.getBoundingClientRect();
        applyViewportPosition(element, rect.left, rect.top, options);
    }

    function bindOpenSync() {
        if (typeof document === 'undefined') {
            return;
        }
        document.addEventListener('capsule:window-opened', (event) => {
            if (global.CAPSULE_WINDOW_FAMILY === 'linux') {
                return;
            }
            const detail = event.detail || {};
            if (!detail.container) {
                return;
            }
            const opts = global.CAPSULE_WINDOW_CONTEXT && global.CAPSULE_WINDOW_CONTEXT.bounds
                ? global.CAPSULE_WINDOW_CONTEXT.bounds
                : {};
            global.requestAnimationFrame(() => {
                syncAnchorFromLayout(detail.container, opts);
            });
        });
    }

    global.CapsuleWindowPositioning = {
        resolveDesktopRoot,
        shouldUseDesktopAnchor,
        desktopRootOffset,
        applyViewportBox,
        applyViewportPosition,
        syncAnchorFromLayout,
    };

    bindOpenSync();
}(typeof window !== 'undefined' ? window : globalThis));
/**
 * Pile de fenêtres (z-index, activation).
 */
(function initCapsuleWindowStack(global) {
    'use strict';

    let zCounter = 50;

    function activateWindow(container) {
        if (!container) {
            return;
        }

        document.querySelectorAll('.windowElementActive').forEach((win) => {
            win.classList.remove('windowElementActive');
        });

        container.classList.add('windowElementActive');
        container.style.zIndex = `${++zCounter}`;
    }

    function bringToFront(container) {
        if (!container) {
            return;
        }
        container.style.zIndex = `${++zCounter}`;
    }

    global.CapsuleWindowStack = {
        activateWindow,
        bringToFront,
        getZCounter: () => zCounter,
        resetZCounter: (value = 50) => {
            zCounter = value;
        },
    };
}(typeof window !== 'undefined' ? window : globalThis));
/**
 * Maximisation / restauration fenêtre (work-area).
 */
(function initCapsuleWindowMaximize(global) {
    'use strict';

    const bounds = () => global.CapsuleWindowBounds;

    function storeRestoreState(windowElement) {
        if (!windowElement || windowElement.dataset.maximized === 'true') {
            return;
        }

        windowElement.dataset.prevLeft = windowElement.style.left || '';
        windowElement.dataset.prevTop = windowElement.style.top || '';
        windowElement.dataset.prevWidth = windowElement.style.width || '';
        windowElement.dataset.prevHeight = windowElement.style.height || '';
        windowElement.dataset.prevPosition = windowElement.style.position || '';
        windowElement.dataset.prevTransform = windowElement.style.transform || '';
        windowElement.dataset.prevMarginLeft = windowElement.style.marginLeft || '';
        windowElement.dataset.prevMarginRight = windowElement.style.marginRight || '';
    }

    function restoreWindowElement(windowElement) {
        if (!windowElement) {
            return false;
        }

        windowElement.style.width = windowElement.dataset.prevWidth || '';
        windowElement.style.height = windowElement.dataset.prevHeight || '';
        windowElement.style.position = windowElement.dataset.prevPosition || 'fixed';
        windowElement.style.top = windowElement.dataset.prevTop || '';
        windowElement.style.left = windowElement.dataset.prevLeft || '';
        windowElement.style.transform = windowElement.dataset.prevTransform || '';
        windowElement.style.marginLeft = windowElement.dataset.prevMarginLeft || '';
        windowElement.style.marginRight = windowElement.dataset.prevMarginRight || '';
        windowElement.dataset.maximized = 'false';
        delete windowElement.dataset.tiled;
        return true;
    }

    function maximizeWindowElement(windowElement, options = {}) {
        if (!windowElement) {
            return false;
        }

        const work =(bounds() == null ? void 0 : bounds().getWorkAreaRect)(options) || {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
        };

        storeRestoreState(windowElement);

        const box = {
            left: work.left,
            top: work.top,
            width: work.width,
            height: work.height,
        };
        if (global.CapsuleWindowPositioning
            && typeof global.CapsuleWindowPositioning.applyViewportBox === 'function') {
            global.CapsuleWindowPositioning.applyViewportBox(windowElement, box, options);
        } else {
            windowElement.style.position = 'fixed';
            windowElement.style.transform = 'none';
            windowElement.style.marginLeft = '0';
            windowElement.style.marginRight = '0';
            windowElement.style.left = `${work.left}px`;
            windowElement.style.top = `${work.top}px`;
            windowElement.style.width = `${work.width}px`;
            windowElement.style.height = `${work.height}px`;
        }
        windowElement.dataset.maximized = 'true';
        return true;
    }

    function toggleWindowMaximized(windowElement, options = {}) {
        if (!windowElement) {
            return false;
        }
        if (windowElement.dataset.maximized === 'true') {
            return restoreWindowElement(windowElement);
        }
        return maximizeWindowElement(windowElement, options);
    }

    global.CapsuleWindowMaximize = {
        storeRestoreState,
        restoreWindowElement,
        maximizeWindowElement,
        toggleWindowMaximized,
    };

    global.restoreWindowElement = restoreWindowElement;
    global.maximizeWindowElement = maximizeWindowElement;
    global.toggleWindowMaximized = toggleWindowMaximized;
}(typeof window !== 'undefined' ? window : globalThis));
/**
 * Déplacement fenêtre (Pointer Events).
 */
(function initCapsuleWindowDrag(global) {
    'use strict';

    const boundsApi = () => global.CapsuleWindowBounds;
    const maxApi = () => global.CapsuleWindowMaximize;
    const targetsApi = () => global.CapsuleWindowDragTargets;

    function resolveDragHandle(element, options) {
        const api = targetsApi();
        if (api && typeof api.resolveDragHandle === 'function') {
            return api.resolveDragHandle(element, options);
        }
        if (options.dragHandle && options.dragHandle !== 'auto') {
            return element.querySelector(options.dragHandle);
        }
        if (options.requireHeader === true) {
            return element.querySelector('#windowHeader');
        }
        return element.querySelector('[data-window-drag-handle]')
            || element.querySelector('#windowHeader')
            || element;
    }

    function isDragStartTarget(element, target, options) {
        const api = targetsApi();
        if (api && typeof api.isTitlebarPointerTarget === 'function') {
            return api.isTitlebarPointerTarget(element, target, options);
        }
        const dragHandle = resolveDragHandle(element, options);
        if (!dragHandle || !(dragHandle === element || dragHandle.contains(target))) {
            return false;
        }
        if (target.closest('button, input, textarea, select, a, label')) {
            return false;
        }
        return true;
    }

    function applyPosition(element, left, top, boundsOptions) {
        if (global.CapsuleWindowPositioning
            && typeof global.CapsuleWindowPositioning.applyViewportPosition === 'function') {
            global.CapsuleWindowPositioning.applyViewportPosition(element, left, top, boundsOptions);
            return;
        }
        const next = boundsApi().clampPosition(element, left, top, boundsOptions);
        element.style.position = 'fixed';
        element.style.transform = 'none';
        element.style.marginLeft = '0';
        element.style.marginRight = '0';
        element.style.left = `${next.left}px`;
        element.style.top = `${next.top}px`;
    }

    function restoreBeforeDragging(element, event, boundsOptions) {
        if (element.dataset.maximized !== 'true' || (typeof maxApi().restoreWindowElement !== 'function')) {
            return null;
        }

        const maximizedRect = element.getBoundingClientRect();
        const pointerRatioX = maximizedRect.width > 0
            ? (event.clientX - maximizedRect.left) / maximizedRect.width
            : 0.5;
        const pointerOffsetY = event.clientY - maximizedRect.top;

        maxApi().restoreWindowElement(element);

        const restoredWidth = element.offsetWidth || maximizedRect.width;
        const restoredHeight = element.offsetHeight || maximizedRect.height;
        const offsetX = Math.max(0, Math.min(restoredWidth * pointerRatioX, restoredWidth));
        const offsetY = Math.max(0, Math.min(pointerOffsetY, restoredHeight));

        applyPosition(element, event.clientX - offsetX, event.clientY - offsetY, boundsOptions);
        return { offsetX, offsetY };
    }

    function enableDrag(element, options) {
        options = options || {};
        if (!element || element.dataset.dragInit === 'true') {
            return;
        }

        const boundsOptions = options.bounds || {};
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let activePointerId = null;

        const onPointerMove = (event) => {
            if (!isDragging || event.pointerId !== activePointerId) {
                return;
            }
            event.preventDefault();
            applyPosition(element, event.clientX - offsetX, event.clientY - offsetY, boundsOptions);
        };

        const stopDragging = (event) => {
            if (!isDragging) {
                return;
            }
            if (event && event.pointerId !== activePointerId) {
                return;
            }
            isDragging = false;
            activePointerId = null;
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', stopDragging);
            document.removeEventListener('pointercancel', stopDragging);
            if (global.CapsuleWindowEdgeTiling
                && typeof global.CapsuleWindowEdgeTiling.trySnapAfterDrag === 'function') {
                global.CapsuleWindowEdgeTiling.trySnapAfterDrag(element, boundsOptions);
            }
        };

        const startDragging = (event) => {
            if (event.button !== 0 && event.pointerType === 'mouse') {
                return;
            }
            if (!isDragStartTarget(element, event.target, options)) {
                return;
            }

            event.preventDefault();

            const restored = restoreBeforeDragging(element, event, boundsOptions);
            if (restored) {
                offsetX = restored.offsetX;
                offsetY = restored.offsetY;
            } else {
                const rect = element.getBoundingClientRect();
                offsetX = event.clientX - rect.left;
                offsetY = event.clientY - rect.top;
            }

            isDragging = true;
            activePointerId = event.pointerId;

            if (typeof event.target.setPointerCapture === 'function') {
                try {
                    event.target.setPointerCapture(event.pointerId);
                } catch (error) {
                    /* ignore */
                }
            }

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', stopDragging);
            document.addEventListener('pointercancel', stopDragging);
        };

        const handle = resolveDragHandle(element, options);
        if (!handle) {
            return;
        }

        const listenerTarget = options.requireHeader === true ? handle : element;
        listenerTarget.addEventListener('pointerdown', startDragging);

        element.dataset.dragInit = 'true';
    }

    function disableDrag(element) {
        if (!element) {
            return;
        }
        delete element.dataset.dragInit;
    }

    global.CapsuleWindowDrag = {
        enableDrag,
        disableDrag,
        resolveDragHandle,
        isDragStartTarget,
    };
    global.makeDraggable = enableDrag;
}(typeof window !== 'undefined' ? window : globalThis));
/**
 * Redimensionnement bordures fenêtre.
 */
(function initCapsuleWindowResize(global) {
    'use strict';

    const boundsApi = () => global.CapsuleWindowBounds;

    class Resizer {
        constructor(element, options = {}) {
            this.element = element;
            this.BORDER_SIZE =(options.borderSize != null ? options.borderSize : 5);
            this.boundsOptions = options.bounds || {};
            this.resizing = false;
            this.resizeDirection = '';
            this.startX = 0;
            this.startY = 0;
            this.startLeft = 0;
            this.startTop = 0;
            this.startWidth = 0;
            this.startHeight = 0;

            this.onPointerDown = this.startResize.bind(this);
            this.onPointerMove = this.checkBorder.bind(this);
            this.onPointerUp = this.stopResize.bind(this);
            this.onCursorMove = this.changeCursor.bind(this);

            this.element.addEventListener('pointerdown', this.onPointerDown);
            this.element.addEventListener('pointermove', this.onCursorMove);
        }

        startResize(e) {
            if (e.button !== 0 && e.pointerType === 'mouse') {
                return;
            }
            if (e.target.closest('#windowHeader, button, input, textarea, select, a, label')) {
                return;
            }

            const rect = this.element.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            const left = offsetX <= this.BORDER_SIZE;
            const right = offsetX >= rect.width - this.BORDER_SIZE;
            const top = offsetY <= this.BORDER_SIZE;
            const bottom = offsetY >= rect.height - this.BORDER_SIZE;

            let direction = '';
            if (top && left) direction = 'top-left';
            else if (top && right) direction = 'top-right';
            else if (bottom && left) direction = 'bottom-left';
            else if (bottom && right) direction = 'bottom-right';
            else if (left) direction = 'left';
            else if (right) direction = 'right';
            else if (top) direction = 'top';
            else if (bottom) direction = 'bottom';

            if (!direction) {
                return;
            }

            e.preventDefault();
            this.resizing = true;
            this.resizeDirection = direction;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.startLeft = rect.left;
            this.startTop = rect.top;
            this.startWidth = rect.width;
            this.startHeight = rect.height;
            this.activePointerId = e.pointerId;

            document.addEventListener('pointermove', this.onPointerMove);
            document.addEventListener('pointerup', this.onPointerUp);
            document.addEventListener('pointercancel', this.onPointerUp);
        }

        checkBorder(e) {
            if (!this.resizing || e.pointerId !== this.activePointerId) {
                return;
            }
            e.preventDefault();

            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;

            let newWidth = this.startWidth;
            let newLeft = this.startLeft;
            let newHeight = this.startHeight;
            let newTop = this.startTop;

            switch (this.resizeDirection) {
                case 'left':
                    newWidth -= dx;
                    newLeft += dx;
                    break;
                case 'right':
                    newWidth += dx;
                    break;
                case 'top':
                    newHeight -= dy;
                    newTop += dy;
                    break;
                case 'bottom':
                    newHeight += dy;
                    break;
                case 'top-left':
                    newWidth -= dx;
                    newLeft += dx;
                    newHeight -= dy;
                    newTop += dy;
                    break;
                case 'top-right':
                    newWidth += dx;
                    newHeight -= dy;
                    newTop += dy;
                    break;
                case 'bottom-left':
                    newWidth -= dx;
                    newLeft += dx;
                    newHeight += dy;
                    break;
                case 'bottom-right':
                    newWidth += dx;
                    newHeight += dy;
                    break;
                default:
                    break;
            }

            const clamped = boundsApi().clampSize(
                this.element,
                newLeft,
                newTop,
                newWidth,
                newHeight,
                this.boundsOptions,
            );

            if (global.CapsuleWindowPositioning
                && typeof global.CapsuleWindowPositioning.applyViewportBox === 'function') {
                global.CapsuleWindowPositioning.applyViewportBox(this.element, clamped, this.boundsOptions);
            } else {
                this.element.style.position = 'fixed';
                this.element.style.width = `${clamped.width}px`;
                this.element.style.height = `${clamped.height}px`;
                this.element.style.left = `${clamped.left}px`;
                this.element.style.top = `${clamped.top}px`;
            }
        }

        stopResize(e) {
            if (!this.resizing) {
                return;
            }
            if (e && e.pointerId !== this.activePointerId) {
                return;
            }

            this.resizing = false;
            this.resizeDirection = '';
            this.activePointerId = null;
            this.element.style.cursor = 'auto';
            document.removeEventListener('pointermove', this.onPointerMove);
            document.removeEventListener('pointerup', this.onPointerUp);
            document.removeEventListener('pointercancel', this.onPointerUp);
        }

        changeCursor(e) {
            if (this.resizing) {
                return;
            }

            const rect = this.element.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            const left = offsetX <= this.BORDER_SIZE;
            const right = offsetX >= rect.width - this.BORDER_SIZE;
            const top = offsetY <= this.BORDER_SIZE;
            const bottom = offsetY >= rect.height - this.BORDER_SIZE;

            if ((left && top) || (right && bottom)) {
                this.element.style.cursor = 'nwse-resize';
            } else if ((right && top) || (left && bottom)) {
                this.element.style.cursor = 'nesw-resize';
            } else if (left || right) {
                this.element.style.cursor = 'ew-resize';
            } else if (top || bottom) {
                this.element.style.cursor = 'ns-resize';
            } else {
                this.element.style.cursor = 'auto';
            }
        }
    }

    function enableResize(element, options = {}) {
        if (!element || element.dataset.resizeInit === 'true') {
            return null;
        }
        const instance = new Resizer(element, options);
        element.dataset.resizeInit = 'true';
        return instance;
    }

    global.CapsuleWindowResize = { Resizer, enableResize };
    global.Resizer = Resizer;
}(typeof window !== 'undefined' ? window : globalThis));
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
/**
 * Façade CapsuleWindow — cycle de vie fenêtre.
 */
(function initCapsuleWindowManager(global) {
    'use strict';

    const bounds = () => global.CapsuleWindowBounds;
    const stack = () => global.CapsuleWindowStack;
    const max = () => global.CapsuleWindowMaximize;
    const drag = () => global.CapsuleWindowDrag;
    const resize = () => global.CapsuleWindowResize;
    const chrome = () => global.CapsuleWindowChrome;

    function callFactory(factory, method) {
        var mod = factory();
        var args = Array.prototype.slice.call(arguments, 2);
        if (mod && typeof mod[method] === 'function') {
            return mod[method].apply(mod, args);
        }
    }

    function initWindow(element, config) {
        config = config || {};
        if (!element || element.dataset.capsuleWindowInit === 'true') {
            return element;
        }

        const slotId = config.slotId || element.dataset.link || '';
        const boundsOptions = config.bounds || {};

        if (config.ensureHeader !== false) {
            callFactory(chrome, 'ensureHeader', element, slotId);
            callFactory(chrome, 'afterInject', element, slotId);
        }

        if (config.resizable !== false) {
            var resizeOpts = Object.assign({ bounds: boundsOptions }, config.resize || {});
            callFactory(resize, 'enableResize', element, resizeOpts);
        }

        if (config.draggable !== false) {
            const dragOptions = {
                requireHeader: config.requireHeader === true,
                dragHandle: config.dragHandle || 'auto',
                bounds: boundsOptions,
            };
            callFactory(drag, 'enableDrag', element, dragOptions);
        }

        element.dataset.capsuleWindowInit = 'true';
        return element;
    }

    function ensureChrome(container, slotId, options) {
        options = options || {};
        if (!container) {
            return;
        }

        callFactory(chrome, 'ensureHeader', container, slotId);
        callFactory(chrome, 'afterInject', container, slotId);

        if (options.forceDrag) {
            callFactory(drag, 'disableDrag', container);
        }

        const isGnomeStartMenu = slotId === 'mainMenu'
            && !!container.querySelector('#menu-gnome-root');
        if (!isGnomeStartMenu && options.initInteraction !== false) {
            initWindowInteraction(container, slotId, options);
        }
    }

    function initWindowInteraction(container, slotId, options) {
        options = options || {};
        const isGnomeStartMenu = slotId === 'mainMenu'
            && !!container.querySelector('#menu-gnome-root');
        if (!container || isGnomeStartMenu) {
            return;
        }

        if (options.forceDrag && container.dataset.dragInit === 'true') {
            callFactory(drag, 'disableDrag', container);
        }

        if (container.dataset.dragInit !== 'true') {
            callFactory(drag, 'enableDrag', container, {
                requireHeader: options.requireHeader === true,
                dragHandle: options.dragHandle || 'auto',
                bounds: options.bounds || {},
            });
        }

        if (container.dataset.resizeInit !== 'true') {
            callFactory(resize, 'enableResize', container, { bounds: options.bounds || {} });
        }

        const pos = global.CapsuleWindowPositioning;
        if (global.CAPSULE_WINDOW_FAMILY !== 'linux'
            && pos
            && typeof pos.syncAnchorFromLayout === 'function') {
            pos.syncAnchorFromLayout(container, options.bounds || {});
        }
    }

    function ensureChromeAfterSlotInject(container, slotId) {
        if (!container || container.style.display === 'none') {
            return;
        }
        ensureChrome(container, slotId, { forceDrag: true, initInteraction: true });
    }

    function activateWindow(container) {
        callFactory(stack, 'activateWindow', container);
    }

    global.CapsuleWindow = {
        initWindow,
        ensureChrome,
        ensureHeader: function (container, slotId) {
            return callFactory(chrome, 'ensureHeader', container, slotId);
        },
        initWindowInteraction,
        ensureChromeAfterSlotInject,
        activateWindow,
        enableDrag: function (el, opts) {
            return callFactory(drag, 'enableDrag', el, opts);
        },
        enableResize: function (el, opts) {
            return callFactory(resize, 'enableResize', el, opts);
        },
        getWorkAreaRect: function (opts) {
            return callFactory(bounds, 'getWorkAreaRect', opts);
        },
        restoreWindowElement: function (el) {
            return callFactory(max, 'restoreWindowElement', el);
        },
        maximizeWindowElement: function (el, opts) {
            return callFactory(max, 'maximizeWindowElement', el, opts);
        },
        toggleWindowMaximized: function (el, opts) {
            return callFactory(max, 'toggleWindowMaximized', el, opts);
        },
        registerChromeProvider: function (id, p) {
            return callFactory(chrome, 'registerChromeProvider', id, p);
        },
        getHeaderTemplate: function () {
            var c = chrome();
            return c ? c.getHeaderTemplate() : undefined;
        },
        createHeaderTemplate: function () {
            var c = chrome();
            var template = c ? c.getHeaderTemplate() : null;
            return template ? template.cloneNode(true) : null;
        },
    };

    global.ensureWindowChromeAfterSlotInject = ensureChromeAfterSlotInject;
}(typeof window !== 'undefined' ? window : globalThis));
