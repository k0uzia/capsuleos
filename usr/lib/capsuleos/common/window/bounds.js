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
