/**
 * Déplacement fenêtre (racine) — aligné sur le noyau Linux/Windows.
 * Conservé pour compatibilité ; les skins Windows chargent win-window-drag.js.
 */
const makeDraggable = (element) => {
    if (!element || element.dataset.dragInit === 'true') {
        return;
    }

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

    const getDragHandle = () => element.querySelector('#windowHeader') || element;

    const onMouseMove = (e) => {
        if (!isDragging) {
            return;
        }

        e.preventDefault();
        const next = clampPosition(e.clientX - offsetX, e.clientY - offsetY);
        element.style.position = 'fixed';
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

        const handle = getDragHandle();
        if (!handle.contains(e.target)) {
            return;
        }

        if (e.target.closest('button, input, textarea, select, a')) {
            return;
        }

        e.preventDefault();
        element.style.position = 'fixed';

        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        isDragging = true;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', stopDragging);
    };

    getDragHandle().addEventListener('mousedown', startDragging);
    element.dataset.dragInit = 'true';
};
