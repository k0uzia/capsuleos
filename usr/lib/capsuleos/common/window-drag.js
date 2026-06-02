/**
 * Déplacement fenêtre CapsuleOS (cross-OS).
 * @param {HTMLElement} element
 * @param {{ requireHeader?: boolean }} [options] — Windows : true (défaut false)
 */
const makeDraggable = (element, options = {}) => {
    if (!element || element.dataset.dragInit === 'true') {
        return;
    }

    const requireHeader = options.requireHeader === true;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const getBoundsRect = () => {
        const main = document.querySelector('main');
        if (main) {
            return main.getBoundingClientRect();
        }
        const desktop = document.getElementById('desktop');
        if (desktop) {
            return desktop.getBoundingClientRect();
        }
        return document.documentElement.getBoundingClientRect();
    };

    const clampPosition = (left, top) => {
        const bounds = getBoundsRect();
        const maxLeft = bounds.right - element.offsetWidth;
        const maxTop = bounds.bottom - element.offsetHeight;

        return {
            left: Math.max(bounds.left, Math.min(left, maxLeft)),
            top: Math.max(bounds.top, Math.min(top, maxTop))
        };
    };

    const getDragHandle = () => {
        if (requireHeader) {
            return element.querySelector('#windowHeader');
        }
        return element.querySelector('[data-window-drag-handle]')
            || element.querySelector('#windowHeader')
            || element;
    };

    const isDragHandleEvent = (target) => {
        const dragHandle = getDragHandle();
        if (!dragHandle) {
            return false;
        }
        return dragHandle === element || dragHandle.contains(target);
    };

    const restoreBeforeDragging = (e) => {
        if (element.dataset.maximized !== 'true' || typeof window.restoreWindowElement !== 'function') {
            return;
        }

        const maximizedRect = element.getBoundingClientRect();
        const pointerRatioX = maximizedRect.width > 0
            ? (e.clientX - maximizedRect.left) / maximizedRect.width
            : 0.5;
        const pointerOffsetY = e.clientY - maximizedRect.top;

        window.restoreWindowElement(element);

        const restoredWidth = element.offsetWidth || maximizedRect.width;
        const restoredHeight = element.offsetHeight || maximizedRect.height;
        offsetX = Math.max(0, Math.min(restoredWidth * pointerRatioX, restoredWidth));
        offsetY = Math.max(0, Math.min(pointerOffsetY, restoredHeight));

        const nextPosition = clampPosition(e.clientX - offsetX, e.clientY - offsetY);
        element.style.transform = 'none';
        element.style.marginLeft = '0';
        element.style.marginRight = '0';
        element.style.position = 'fixed';
        element.style.left = `${nextPosition.left}px`;
        element.style.top = `${nextPosition.top}px`;
    };

    const onMouseMove = (e) => {
        if (!isDragging) {
            return;
        }

        e.preventDefault();
        const next = clampPosition(e.clientX - offsetX, e.clientY - offsetY);
        element.style.position = 'fixed';
        element.style.transform = 'none';
        element.style.marginLeft = '0';
        element.style.marginRight = '0';
        element.style.left = `${next.left}px`;
        element.style.top = `${next.top}px`;
    };

    const stopDragging = () => {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', stopDragging);
    };

    const startDragging = (e) => {
        if (e.button !== 0) {
            return;
        }

        if (!isDragHandleEvent(e.target)) {
            return;
        }

        if (e.target.closest('button, input, textarea, select, a')) {
            return;
        }

        e.preventDefault();
        restoreBeforeDragging(e);

        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        isDragging = true;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', stopDragging);
    };

    const handle = getDragHandle();
    if (!handle) {
        return;
    }

    if (requireHeader) {
        handle.addEventListener('mousedown', startDragging);
    } else {
        element.addEventListener('mousedown', startDragging);
    }

    element.dataset.dragInit = 'true';
};
