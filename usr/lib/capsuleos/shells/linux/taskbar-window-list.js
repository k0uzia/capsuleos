/**
 * Liste des fenêtres ouvertes — panel Cinnamon (Mint).
 * Mutualisé : actif si body#mint ou CAPSULE_EMBED_SKIN_KEY === 'mint'.
 */
(function initCapsuleTaskbarWindowList(global) {
    'use strict';

    const EXCLUDED_SLOTS = new Set(['mainMenu']);

    const WINDOW_ICONS = {
        nemo: '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/system-file-manager.webp',
        firefox: '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/firefox.webp',
        terminal: '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/org.gnome.Terminal.webp',
        text_editor: '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/accessories-text-editor.webp',
        update_manager: '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/mintupdate.webp',
        mintinstall: '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/mintinstall.webp',
        themes: '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/preferences-desktop-theme.webp',
        calculator: '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/org.gnome.Calculator.webp',
        librewriter: '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/libreoffice-writer.webp',
    };

    const WINDOW_LABELS = {
        nemo: 'Nemo',
        firefox: 'Firefox',
        terminal: 'Terminal',
        themes: 'Thèmes',
        profile: 'À Propos',
        checklist: 'Missions',
        librewriter: 'LibreOffice Writer',
        librecalc: 'LibreOffice Calc',
        visionneur_images: 'Visionneur d\'images',
        visionneur_pdf: 'Visionneur PDF',
        lecteur_multimedia: 'Lecteur vidéo',
        update_manager: 'Gestionnaire de mises à jour',
        mintinstall: 'Logithèque',
        system_monitor: 'Moniteur système',
        text_editor: 'Éditeur de texte',
        calculator: 'Calculatrice',
        clocks: 'Horloges',
        calendar: 'Calendrier',
        screenshot: 'Capture d\'écran',
        drawing: 'Dessin',
        file_roller: 'Gestionnaire d\'archives',
        mintdrivers: 'Gestionnaire de pilotes',
        baobab: 'Analyseur d\'espace disque',
        webapp_manager: 'Applications Web',
        sticky: 'Notes',
        warpinator: 'Warpinator',
        hypnotix: 'Hypnotix',
        transmission: 'Transmission',
        mintbackup: 'Sauvegarde',
        bulky: 'Renommer fichiers',
        timeshift: 'Timeshift',
        thunderbird: 'Thunderbird',
        mintwelcome: 'Accueil Mint',
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

    function markWindowRunning(container) {
        if (!container) {
            return;
        }
        if (global.CapsuleTaskbarLauncherState
            && typeof global.CapsuleTaskbarLauncherState.markRunning === 'function') {
            global.CapsuleTaskbarLauncherState.markRunning(container);
            return;
        }
        container.dataset.capsuleRunning = 'true';
    }

    function getOpenWindows() {
        return Array.from(document.querySelectorAll('.windowElement'))
            .filter((container) => !EXCLUDED_SLOTS.has(container.dataset.link))
            .filter(isWindowVisible);
    }

    function getRunningWindows() {
        return Array.from(document.querySelectorAll('.windowElement'))
            .filter((container) => !EXCLUDED_SLOTS.has(container.dataset.link))
            .filter((container) => {
                return isWindowVisible(container)
                    || (container.dataset && container.dataset.capsuleRunning === 'true');
            });
    }

    function resolveWindowIcon(dataLink) {
        if (WINDOW_ICONS[dataLink]) {
            return WINDOW_ICONS[dataLink];
        }
        return '';
    }

    function focusWindow(dataLink) {
        const container = document.querySelector(`.windowElement[data-link="${dataLink}"]`);
        if (!container) {
            return;
        }
        if (typeof global.openWindowByDataLink === 'function') {
            global.openWindowByDataLink(dataLink);
            return;
        }
        if (!isWindowVisible(container)) {
            return;
        }
        container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }

    function renderWindowList(listEl) {
        const runningWindows = getRunningWindows();
        const activeContainer = document.querySelector('.windowElementActive');
        const activeLink = activeContainer && !EXCLUDED_SLOTS.has(activeContainer.dataset.link)
            ? activeContainer.dataset.link
            : null;

        listEl.innerHTML = '';

        if (runningWindows.length === 0) {
            listEl.hidden = true;
            return;
        }

        listEl.hidden = false;

        runningWindows.forEach((container) => {
            const dataLink = container.dataset.link;
            const visible = isWindowVisible(container);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'taskbar-window-list__btn'
                + (visible && dataLink === activeLink ? ' is-active' : '')
                + (visible ? '' : ' is-minimized');
            btn.dataset.windowLink = dataLink;
            btn.setAttribute('role', 'listitem');
            btn.title = resolveWindowLabel(dataLink, container);

            const iconSrc = resolveWindowIcon(dataLink);
            if (iconSrc) {
                const img = document.createElement('img');
                img.className = 'taskbar-window-list__icon';
                img.src = iconSrc;
                img.alt = '';
                btn.appendChild(img);
            }
            const label = document.createElement('span');
            label.className = 'taskbar-window-list__label';
            label.textContent = resolveWindowLabel(dataLink, container);
            btn.appendChild(label);

            btn.addEventListener('click', (event) => {
                event.preventDefault();
                if (visible && dataLink === activeLink) {
                    const applyHide = () => {
                        markWindowRunning(container);
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
