/**
 * Sélecteur Alt+Tab simplifié — Linux Mint (Cinnamon).
 */
(function initCinnamonAltTab(global) {
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
        librecalc: 'LibreOffice Calc',
        visionneur_images: 'Visionneur d\'images',
        visionneur_pdf: 'Visionneur PDF',
        lecteur_multimedia: 'Lecteur vidéo',
        update_manager: 'Mises à jour',
        text_editor: 'Éditeur de texte',
        calculator: 'Calculatrice',
        clocks: 'Horloges',
        calendar: 'Calendrier',
        screenshot: 'Capture d\'écran',
        drawing: 'Dessin',
        file_roller: 'Gestionnaire d\'archives',
        mintdrivers: 'Gestionnaire de pilotes',
    };

    let overlay = null;
    let listEl = null;
    let open = false;
    let entries = [];
    let selectedIndex = 0;
    function isMintDesktop() {
        return global.document && global.document.body && global.document.body.id === 'mint';
    }

    function resolveLabel(dataLink) {
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

    function resolveIconSrc(dataLink) {
        const launcher = global.document.querySelector(
            `a[target="windowElement"][data-link="${dataLink}"] img`
        );
        return launcher ? launcher.getAttribute('src') : '';
    }

    function isVisible(container) {
        return !!(container && container.style.display !== 'none');
    }

    function collectEntries() {
        return Array.from(global.document.querySelectorAll('.windowElement'))
            .filter((el) => el.dataset.link && !EXCLUDED_SLOTS.has(el.dataset.link))
            .filter(isVisible)
            .sort((a, b) => {
                const za = Number.parseInt(a.style.zIndex, 10) || 0;
                const zb = Number.parseInt(b.style.zIndex, 10) || 0;
                return zb - za;
            })
            .map((container) => ({
                container: container,
                dataLink: container.dataset.link,
                label: resolveLabel(container.dataset.link),
                iconSrc: resolveIconSrc(container.dataset.link),
            }));
    }

    function ensureOverlay() {
        if (overlay) {
            return;
        }
        overlay = global.document.createElement('div');
        overlay.id = 'cinnamon-alt-tab';
        overlay.className = 'cinnamon-alt-tab';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', 'Sélecteur de fenêtres');
        overlay.hidden = true;

        const backdrop = global.document.createElement('div');
        backdrop.className = 'cinnamon-alt-tab__backdrop';
        backdrop.setAttribute('aria-hidden', 'true');

        const panel = global.document.createElement('div');
        panel.className = 'cinnamon-alt-tab__panel';
        panel.setAttribute('role', 'listbox');

        listEl = global.document.createElement('div');
        listEl.className = 'cinnamon-alt-tab__list';
        listEl.style.display = 'contents';

        const hint = global.document.createElement('p');
        hint.className = 'cinnamon-alt-tab__hint';
        hint.textContent = 'Tab pour parcourir · Relâcher Alt pour choisir · Échap pour annuler';

        panel.appendChild(listEl);
        overlay.appendChild(backdrop);
        overlay.appendChild(panel);
        overlay.appendChild(hint);
        global.document.body.appendChild(overlay);

        overlay.addEventListener('click', (event) => {
            if (!open) {
                return;
            }
            const item = event.target.closest('.cinnamon-alt-tab__item');
            if (!item) {
                return;
            }
            const index = Number.parseInt(item.dataset.index, 10);
            if (Number.isNaN(index) || index < 0 || index >= entries.length) {
                return;
            }
            selectedIndex = index;
            renderList();
            confirmSelection();
        });
    }

    function renderList() {
        if (!listEl) {
            return;
        }
        listEl.innerHTML = '';
        entries.forEach((entry, index) => {
            const btn = global.document.createElement('button');
            btn.type = 'button';
            btn.className = 'cinnamon-alt-tab__item'
                + (index === selectedIndex ? ' is-selected' : '');
            btn.setAttribute('role', 'option');
            btn.setAttribute('aria-selected', index === selectedIndex ? 'true' : 'false');
            btn.dataset.index = String(index);

            if (entry.iconSrc) {
                const img = global.document.createElement('img');
                img.className = 'cinnamon-alt-tab__icon';
                img.src = entry.iconSrc;
                img.alt = '';
                btn.appendChild(img);
            } else {
                const ph = global.document.createElement('span');
                ph.className = 'cinnamon-alt-tab__icon cinnamon-alt-tab__icon--placeholder';
                ph.setAttribute('aria-hidden', 'true');
                btn.appendChild(ph);
            }

            const label = global.document.createElement('span');
            label.className = 'cinnamon-alt-tab__label';
            label.textContent = entry.label;
            btn.appendChild(label);

            listEl.appendChild(btn);
        });
    }

    function focusEntry(entry) {
        if (!entry || !entry.container) {
            return;
        }
        if (typeof global.CapsuleWindowShell !== 'undefined'
            && global.CapsuleWindowShell.activateWindow) {
            global.CapsuleWindowShell.activateWindow(entry.container);
        } else {
            entry.container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        }
        entry.container.style.display = entry.container.style.display || 'flex';
        const link = global.document.querySelector(`a[data-link="${entry.dataLink}"]`);
        if (link) {
            link.classList.add('active-link');
        }
        if (typeof global.CapsuleTaskbarWindowList !== 'undefined'
            && typeof global.CapsuleTaskbarWindowList.refresh === 'function') {
            global.CapsuleTaskbarWindowList.refresh();
        }
    }

    function openSwitcher(reverse) {
        entries = collectEntries();
        if (entries.length === 0) {
            return;
        }
        ensureOverlay();
        const active = global.document.querySelector('.windowElementActive');
        const activeLink = active && active.dataset.link;
        let idx = entries.findIndex((e) => e.dataLink === activeLink);
        if (idx < 0) {
            idx = 0;
        }
        selectedIndex = reverse
            ? (idx - 1 + entries.length) % entries.length
            : (idx + 1) % entries.length;
        renderList();
        overlay.hidden = false;
        open = true;
    }

    function cycle(reverse) {
        if (!open || entries.length === 0) {
            openSwitcher(reverse);
            return;
        }
        selectedIndex = reverse
            ? (selectedIndex - 1 + entries.length) % entries.length
            : (selectedIndex + 1) % entries.length;
        renderList();
    }

    function confirmSelection() {
        if (!open) {
            return;
        }
        const entry = entries[selectedIndex];
        if (entry) {
            focusEntry(entry);
        }
        closeSwitcher();
    }

    function closeSwitcher() {
        if (!overlay) {
            open = false;
            return;
        }
        overlay.hidden = true;
        open = false;
        entries = [];
        selectedIndex = 0;
    }

    function onKeyDown(event) {
        if (!isMintDesktop()) {
            return;
        }
        if (event.key !== 'Tab' || !event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }
        event.preventDefault();
        if (!open) {
            openSwitcher(event.shiftKey);
        } else {
            cycle(event.shiftKey);
        }
    }

    function onKeyUp(event) {
        if (!isMintDesktop()) {
            return;
        }
        if (event.key === 'Alt' && open) {
            confirmSelection();
            return;
        }
        if (event.key === 'Escape' && open) {
            event.preventDefault();
            closeSwitcher();
        }
    }

    function run() {
        if (!isMintDesktop()) {
            return;
        }
        global.document.addEventListener('keydown', onKeyDown);
        global.document.addEventListener('keyup', onKeyUp);
    }

    if (typeof global.document !== 'undefined') {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    global.CapsuleCinnamonAltTab = {
        open: openSwitcher,
        close: closeSwitcher,
    };
}(typeof window !== 'undefined' ? window : globalThis));
