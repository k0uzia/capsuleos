/**
 * Liste des fenêtres ouvertes — panel Cinnamon (Mint).
 * Mutualisé : actif si body#mint ou CAPSULE_EMBED_SKIN_KEY === 'mint'.
 */
(function initCapsuleTaskbarWindowList(global) {
    'use strict';

    const EXCLUDED_SLOTS = new Set(['mainMenu']);

    const WINDOW_LABELS = {
        nemo: 'Nemo',
        firefox: 'Firefox',
        terminal: 'Terminal',
        themes: 'Thèmes',
        profile: 'À Propos',
        checklist: 'Missions',
        librewriter: 'LibreOffice Writer',
        visionneur_images: 'Visionneur d\'images',
        visionneur_pdf: 'Visionneur PDF',
        lecteur_multimedia: 'Lecteur vidéo',
        update_manager: 'Mises à jour',
        text_editor: 'Éditeur de texte',
        calculator: 'Calculatrice',
        screenshot: 'Capture d\'écran',
        drawing: 'Dessin',
        file_roller: 'Gestionnaire d\'archives',
        'Dossier personnel': 'Dossier personnel',
    };

    function isMintPanel() {
        const bodyId = typeof document !== 'undefined' && document.body ? document.body.id : '';
        const skinKey = typeof global !== 'undefined' ? global.CAPSULE_EMBED_SKIN_KEY : '';
        return bodyId === 'mint' || skinKey === 'mint';
    }

    function resolveWindowLabel(dataLink, container) {
        if (container) {
            const titleEl = container.querySelector(':scope > #windowTitle');
            if (titleEl && titleEl.textContent) {
                const liveTitle = titleEl.textContent.replace(/\s+/g, ' ').trim();
                if (liveTitle) {
                    return liveTitle;
                }
            }
        }
        if (!dataLink) {
            return 'Fenêtre';
        }
        if (typeof global.getResolvedWindowTitle === 'function') {
            const resolved = global.getResolvedWindowTitle(dataLink);
            if (resolved) {
                return resolved;
            }
        }
        if (global.CAPSULE_WINDOW_TITLES && global.CAPSULE_WINDOW_TITLES[dataLink]) {
            return global.CAPSULE_WINDOW_TITLES[dataLink];
        }
        return WINDOW_LABELS[dataLink] || dataLink;
    }

    function isWindowVisible(container) {
        return !!(container && container.style.display !== 'none');
    }

    function getOpenWindows() {
        return Array.from(document.querySelectorAll('.windowElement'))
            .filter((container) => !EXCLUDED_SLOTS.has(container.dataset.link))
            .filter(isWindowVisible);
    }

    function focusWindow(dataLink) {
        const container = document.querySelector(`.windowElement[data-link="${dataLink}"]`);
        if (!container || !isWindowVisible(container)) {
            return;
        }
        if (typeof global.openWindowByDataLink === 'function') {
            global.openWindowByDataLink(dataLink);
            return;
        }
        container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }

    function renderWindowList(listEl) {
        const openWindows = getOpenWindows();
        const activeContainer = document.querySelector('.windowElementActive');
        const activeLink = activeContainer && !EXCLUDED_SLOTS.has(activeContainer.dataset.link)
            ? activeContainer.dataset.link
            : null;

        listEl.innerHTML = '';

        if (openWindows.length === 0) {
            listEl.hidden = true;
            return;
        }

        listEl.hidden = false;

        openWindows.forEach((container) => {
            const dataLink = container.dataset.link;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'taskbar-window-list__btn'
                + (dataLink === activeLink ? ' is-active' : '');
            btn.dataset.windowLink = dataLink;
            btn.setAttribute('role', 'listitem');
            btn.title = resolveWindowLabel(dataLink, container);
            btn.textContent = resolveWindowLabel(dataLink, container);

            btn.addEventListener('click', (event) => {
                event.preventDefault();
                if (dataLink === activeLink && isWindowVisible(container)) {
                    const applyHide = () => {
                        container.style.display = 'none';
                        container.classList.remove('active', 'windowElementActive');
                        if (typeof global.CustomEvent === 'function') {
                            global.document.dispatchEvent(new CustomEvent('capsule:window-minimized', {
                                detail: { container: container, slotId: dataLink },
                            }));
                            global.document.dispatchEvent(new CustomEvent('capsule:window-hidden', {
                                detail: { container: container, slotId: dataLink },
                            }));
                        }
                        renderWindowList(listEl);
                    };
                    if (typeof global.capsuleBeforeWindowHide === 'function') {
                        global.capsuleBeforeWindowHide(container, applyHide);
                    } else {
                        applyHide();
                    }
                    return;
                }
                focusWindow(dataLink);
            });

            listEl.appendChild(btn);
        });
    }

    function bindWindowObservers(listEl) {
        document.querySelectorAll('.windowElement').forEach((container) => {
            if (container.dataset.taskbarListObserved === 'true') {
                return;
            }
            const observer = new MutationObserver(() => {
                renderWindowList(listEl);
            });
            observer.observe(container, {
                attributes: true,
                attributeFilter: ['style', 'class'],
            });
            container.dataset.taskbarListObserved = 'true';
        });
    }

    function init() {
        if (!isMintPanel()) {
            return;
        }

        const listEl = document.getElementById('taskbar-window-list');
        if (!listEl) {
            return;
        }

        bindWindowObservers(listEl);
        renderWindowList(listEl);

        document.addEventListener('mousedown', (event) => {
            const target = event.target.closest('.windowElement');
            if (target && !EXCLUDED_SLOTS.has(target.dataset.link)) {
                window.requestAnimationFrame(() => renderWindowList(listEl));
            }
        });

        document.addEventListener('capsule:window-minimized', () => {
            window.requestAnimationFrame(() => renderWindowList(listEl));
        });

        document.addEventListener('capsule:window-hidden', () => {
            window.requestAnimationFrame(() => renderWindowList(listEl));
        });

        document.addEventListener('capsule:window-opened', () => {
            window.requestAnimationFrame(() => renderWindowList(listEl));
        });

        document.addEventListener('capsule:window-focused', () => {
            window.requestAnimationFrame(() => renderWindowList(listEl));
        });

        global.CapsuleTaskbarWindowList = {
            initialized: true,
            refresh: () => {
                renderWindowList(listEl);
                if (global.CapsuleTaskbarLauncherState
                    && typeof global.CapsuleTaskbarLauncherState.refresh === 'function') {
                    global.CapsuleTaskbarLauncherState.refresh();
                }
            },
        };
    }

    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }
}(typeof window !== 'undefined' ? window : globalThis));
