/**
 * KDE Neon — bascule panel dock ↔ barre pleine largeur (fenêtre maximisée).
 * Garde-fou : pas de ré-appel à maximizeWindowElement depuis l’observer (boucle infinie).
 */
(function initKdeNeonPlasmaPanelMode() {
    if (!document.body || document.body.id !== 'kde-neon') {
        return;
    }

    const body = document.body;
    const desktop = document.getElementById('desktop');
    const boundsBase = {
        mainSelector: 'object#desktop, #desktop',
        desktopSelector: 'object#desktop, #desktop',
        footerSelector: 'footer, #tableau',
    };

    let panelMode = null;
    let syncing = false;
    let observer = null;

    function getBoundsOptions() {
        return (window.CapsuleLinuxWindowContext
            && typeof window.CapsuleLinuxWindowContext.getContext === 'function'
            && window.CapsuleLinuxWindowContext.getContext().bounds)
            || (window.CAPSULE_WINDOW_CONTEXT && window.CAPSULE_WINDOW_CONTEXT.bounds)
            || boundsBase;
    }

    function resetWindowContextCache() {
        const ctx = window.CapsuleLinuxWindowContext || window.CapsuleWindowContext;
        if (ctx && typeof ctx.resetContextCache === 'function') {
            ctx.resetContextCache();
        }
    }

    function applyBoundsPolicy(expanded) {
        window.CAPSULE_WINDOW_CONTEXT = Object.assign({}, window.CAPSULE_WINDOW_CONTEXT || {}, {
            bounds: Object.assign({}, boundsBase, {
                subtractFooter: expanded,
            }),
        });
        resetWindowContextCache();
    }

    function hasMaximizedWindow() {
        return !!(desktop && desktop.querySelector('.windowElement[data-maximized="true"]'));
    }

    function applyMaximizedLayout(win) {
        if (!win || win.dataset.maximized !== 'true') {
            return;
        }
        const boundsOpts = getBoundsOptions();
        const work = (window.CapsuleWindowBounds
            && typeof window.CapsuleWindowBounds.getWorkAreaRect === 'function'
            && window.CapsuleWindowBounds.getWorkAreaRect(boundsOpts))
            || {
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight,
            };
        const box = {
            left: work.left,
            top: work.top,
            width: work.width,
            height: work.height,
        };
        if (window.CapsuleWindowPositioning
            && typeof window.CapsuleWindowPositioning.applyViewportBox === 'function') {
            window.CapsuleWindowPositioning.applyViewportBox(win, box, boundsOpts);
            return;
        }
        win.style.position = 'fixed';
        win.style.transform = 'none';
        win.style.marginLeft = '0';
        win.style.marginRight = '0';
        win.style.left = `${work.left}px`;
        win.style.top = `${work.top}px`;
        win.style.width = `${work.width}px`;
        win.style.height = `${work.height}px`;
    }

    function relayoutMaximizedWindows() {
        if (!desktop) {
            return;
        }
        desktop.querySelectorAll('.windowElement[data-maximized="true"]').forEach(applyMaximizedLayout);
    }

    function syncPanelMode() {
        if (syncing) {
            return;
        }
        const expanded = hasMaximizedWindow();
        const nextMode = expanded ? 'expanded' : 'dock';
        if (nextMode === panelMode) {
            return;
        }

        syncing = true;
        if (observer) {
            observer.disconnect();
        }
        try {
            panelMode = nextMode;
            body.dataset.plasmaPanel = nextMode;
            applyBoundsPolicy(expanded);
            if (expanded) {
                requestAnimationFrame(() => {
                    relayoutMaximizedWindows();
                });
            }
        } finally {
            if (observer && desktop) {
                observer.observe(desktop, {
                    attributes: true,
                    attributeFilter: ['data-maximized'],
                    subtree: true,
                });
            }
            syncing = false;
        }
    }

    function observeDesktop() {
        if (!desktop) {
            return;
        }
        observer = new MutationObserver((records) => {
            const touched = records.some((record) => (
                record.type === 'attributes'
                && record.attributeName === 'data-maximized'
            ));
            if (touched) {
                syncPanelMode();
            }
        });
        observer.observe(desktop, {
            attributes: true,
            attributeFilter: ['data-maximized'],
            subtree: true,
        });
        panelMode = null;
        syncPanelMode();
    }

    applyBoundsPolicy(false);
    body.dataset.plasmaPanel = 'dock';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeDesktop);
    } else {
        observeDesktop();
    }
}());
