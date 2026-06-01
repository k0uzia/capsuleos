/**
 * Déplacement des fenêtres iframe Windows (position: fixed, zone = main).
 */
const makeDraggable = (element) => {
    if (!element || element.dataset.dragInit === 'true') {
        return;
    }

    const header = element.querySelector('#windowHeader');
    if (!header) {
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

    header.addEventListener('mousedown', startDragging);
    element.dataset.dragInit = 'true';
};
