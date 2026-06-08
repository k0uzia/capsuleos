function capsuleStr(key, fallback) {
    const m = (typeof window !== 'undefined' && window.CAPSULE_STRINGS_MERGED) || {};
    if (m[key] !== undefined && m[key] !== null && String(m[key]).length > 0) {
        return String(m[key]);
    }
    return fallback;
}

function capsuleStrFmt(key, vars, fallback) {
    let s = capsuleStr(key, fallback);
    if (vars && typeof s === 'string') {
        Object.keys(vars).forEach((k) => {
            s = s.split(`{${k}}`).join(vars[k]);
        });
    }
    return s;
}

function supportsFirefoxGnomeChrome() {
    if (!document.body || !document.body.id) {
        return false;
    }
    return document.body.id === 'fedora'
        || document.body.id === 'rocky'
        || document.body.id === 'alma'
        || document.body.id === 'ubuntu'
        || document.body.id === 'popos';
}

function decorateFedoraFirefoxWindow(browserRoot) {
    if (!supportsFirefoxGnomeChrome()) {
        return;
    }

    const windowElement = browserRoot.closest('.windowElement');
    if (!windowElement || windowElement.dataset.link !== 'firefox') {
        return;
    }

    windowElement.classList.add('firefox-window--fedora');

    const moveControlsIntoTabsbar = () => {
        const tabsbar = browserRoot.querySelector('.capsule-browser__tabsbar');
        const header = windowElement.querySelector('#windowHeader');
        if (!tabsbar || !header) {
            return false;
        }

        if (global.CapsuleWindowDragTargets && typeof global.CapsuleWindowDragTargets.markDragPassthrough === 'function') {
            global.CapsuleWindowDragTargets.markDragPassthrough(tabsbar);
        } else {
            tabsbar.setAttribute('data-window-drag-handle', '');
            tabsbar.setAttribute('data-window-drag-passthrough', 'true');
        }

        if (header.dataset.fedoraFirefoxControls === 'true' && header.parentElement === tabsbar) {
            return true;
        }

        header.dataset.fedoraFirefoxControls = 'true';
        header.classList.add('firefox-window-controls--fedora');
        header.style.minWidth = '';
        header.style.maxWidth = '';
        header.style.width = '';
        tabsbar.appendChild(header);
        return true;
    };

    if (!moveControlsIntoTabsbar() && windowElement.dataset.fedoraFirefoxControlsObserver !== 'true') {
        windowElement.dataset.fedoraFirefoxControlsObserver = 'true';
        const observer = new MutationObserver(() => {
            if (moveControlsIntoTabsbar()) {
                observer.disconnect();
            }
        });
        observer.observe(windowElement, { childList: true });
    }
}

function initFirefoxBrowser() {
    const browserRoot = document.querySelector('#firefox [data-firefox-app]');
    if (!browserRoot || browserRoot.dataset.initialized === 'true') {
        return;
    }

    const form = browserRoot.querySelector('[data-browser-form]');
    const addressInput = browserRoot.querySelector('[data-browser-address]');
    const status = browserRoot.querySelector('[data-browser-status]');
    const homeView = browserRoot.querySelector('[data-browser-home]');
    const redirectView = browserRoot.querySelector('[data-browser-redirect]');
    const redirectFrame = browserRoot.querySelector('[data-browser-redirect-frame]');
    const bookmarksBar = browserRoot.querySelector('[data-browser-bookmarks]');
    const tabsList = browserRoot.querySelector('[data-browser-tabs]');
    const newtabForm = browserRoot.querySelector('[data-browser-newtab-form]');
    const newtabInput = browserRoot.querySelector('[data-browser-newtab-input]');
    const newtabShortcuts = browserRoot.querySelector('.capsule-browser-newtab__shortcuts');

    const btnHomes = browserRoot.querySelectorAll('[data-browser-action="home"]');
    const btnReload = browserRoot.querySelector('[data-browser-action="reload"]');
    const btnBack = browserRoot.querySelector('[data-browser-action="back"]');
    const btnForward = browserRoot.querySelector('[data-browser-action="forward"]');
    const btnNewTab = browserRoot.querySelector('[data-browser-action="new-tab"]');
    const btnToggleBookmarks = browserRoot.querySelector('[data-browser-action="toggle-bookmarks"]');
    const btnLibrary = browserRoot.querySelector('[data-browser-action="library"]');
    const btnMenu = browserRoot.querySelector('[data-browser-action="menu"]');

    if (!form || !addressInput || !status || !homeView || !redirectView || !redirectFrame
        || !bookmarksBar || !tabsList || !btnHomes.length || !btnReload || !btnBack || !btnForward) {
        return;
    }

    decorateFedoraFirefoxWindow(browserRoot);

    const OS_LACAPSULE_PAGE = (typeof window !== 'undefined' && window.CAPSULE_SITE_HOME)
        ? String(window.CAPSULE_SITE_HOME)
        : '/index.html';

    const defaultTabLabel = capsuleStr('firefox.tabNewLabel', 'Nouvel onglet');

    const state = {
        tabCounter: 1,
        activeTabId: 'tab-1',
        bookmarksVisible: false,
        tabs: [{
            id: 'tab-1',
            label: defaultTabLabel,
            view: 'home',
            address: ''
        }]
    };

    function normalizeInput(value) {
        return String(value || '').trim().toLowerCase();
    }

    function isHomeTarget(value) {
        const normalized = normalizeInput(value);
        return normalized === ''
            || normalized === 'accueil'
            || normalized === 'about:newtab'
            || normalized === 'capsuleos://accueil';
    }

    function isOsLaCapsuleTarget(value) {
        const normalized = normalizeInput(value);
        return normalized === 'os-lacapsule'
            || normalized === 'capsuleos://os-lacapsule'
            || normalized === 'la capsule';
    }

    function getActiveTab() {
        let found = null;
        state.tabs.forEach((tab) => {
            if (tab.id === state.activeTabId) {
                found = tab;
            }
        });
        return found || state.tabs[0];
    }

    function setStatus(message) {
        if (!message) {
            status.hidden = true;
            status.textContent = '';
            return;
        }
        status.hidden = false;
        status.textContent = message;
    }

    function tabLabelForView(view, address) {
        if (view === 'os-lacapsule') {
            return capsuleStr('firefox.tabOsLaCapsuleLabel', 'La Capsule');
        }
        if (address && !isHomeTarget(address)) {
            return address;
        }
        return defaultTabLabel;
    }

    function switchView(view) {
        const showHomeView = view === 'home';

        homeView.hidden = !showHomeView;
        redirectView.hidden = showHomeView;

        homeView.style.display = showHomeView ? 'flex' : 'none';
        redirectView.style.display = showHomeView ? 'none' : 'block';

        browserRoot.setAttribute('data-browser-current-view', view);
    }

    function syncAddressInput(address) {
        if (isHomeTarget(address)) {
            addressInput.value = '';
            if (newtabInput) {
                newtabInput.value = '';
            }
            return;
        }
        addressInput.value = address;
    }

    function applyActiveTabToUi() {
        const tab = getActiveTab();
        if (!tab) {
            return;
        }
        switchView(tab.view);
        syncAddressInput(tab.address);
        renderTabs();
    }

    function persistActiveTab(view, address, label) {
        const tab = getActiveTab();
        if (!tab) {
            return;
        }
        tab.view = view;
        tab.address = address || '';
        tab.label = label || tabLabelForView(view, tab.address);
        applyActiveTabToUi();
    }

    function showHome(message) {
        persistActiveTab('home', '', defaultTabLabel);
        if (message) {
            setStatus(message);
        } else {
            setStatus('');
        }
    }

    function showOsLaCapsule(message) {
        const address = 'os-lacapsule';
        persistActiveTab('os-lacapsule', address, tabLabelForView('os-lacapsule', address));
        setStatus(
            capsuleStr('firefox.statusOsLaCapsuleLoading', 'Chargement de la page os-lacapsule...')
        );
        redirectFrame.src = OS_LACAPSULE_PAGE;
        if (message) {
            setStatus(message);
        }
    }

    function navigateFromInput(rawValue, message) {
        const value = String(rawValue || '').trim();
        if (isHomeTarget(value)) {
            showHome(message || capsuleStr('firefox.statusHomeShown', 'Page Accueil affichee.'));
            return;
        }
        if (isOsLaCapsuleTarget(value)) {
            showOsLaCapsule(message);
            return;
        }
        showOsLaCapsule(
            capsuleStr('firefox.statusSubmitRedirect', 'Toute saisie est redirigee vers os-lacapsule.')
        );
    }

    function renderTabs() {
        tabsList.replaceChildren();

        state.tabs.forEach((tab) => {
            const isActive = tab.id === state.activeTabId;
            const tabBtn = document.createElement('button');
            tabBtn.type = 'button';
            tabBtn.className = 'capsule-browser__tab' + (isActive ? ' capsule-browser__tab--active' : '');
            tabBtn.setAttribute('data-browser-tab-id', tab.id);
            tabBtn.setAttribute('role', 'tab');
            tabBtn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            if (isActive) {
                tabBtn.setAttribute('aria-current', 'page');
            }

            const icon = document.createElement('span');
            icon.className = 'capsule-browser__tab-icon capsule-browser__tab-icon--firefox';
            icon.setAttribute('aria-hidden', 'true');

            const label = document.createElement('span');
            label.className = 'capsule-browser__tab-label';
            label.textContent = tab.label;

            const closeBtn = document.createElement('span');
            closeBtn.className = 'capsule-browser__tab-close';
            closeBtn.setAttribute('data-browser-tab-close', tab.id);
            closeBtn.setAttribute('role', 'button');
            closeBtn.setAttribute('aria-label', capsuleStr('firefox.tabCloseAria', 'Fermer l’onglet'));
            closeBtn.textContent = '\u00D7';

            tabBtn.appendChild(icon);
            tabBtn.appendChild(label);
            tabBtn.appendChild(closeBtn);
            tabsList.appendChild(tabBtn);
        });
    }

    function activateTab(tabId) {
        state.activeTabId = tabId;
        applyActiveTabToUi();
    }

    function addTab() {
        state.tabCounter += 1;
        const tabId = 'tab-' + String(state.tabCounter);
        state.tabs.push({
            id: tabId,
            label: defaultTabLabel,
            view: 'home',
            address: ''
        });
        activateTab(tabId);
        setStatus('');
    }

    function closeTab(tabId) {
        if (state.tabs.length <= 1) {
            showHome('');
            return;
        }

        let removeIndex = -1;
        state.tabs.forEach((tab, index) => {
            if (tab.id === tabId) {
                removeIndex = index;
            }
        });

        if (removeIndex < 0) {
            return;
        }

        const wasActive = state.activeTabId === tabId;
        state.tabs.splice(removeIndex, 1);

        if (wasActive) {
            const nextTab = state.tabs[removeIndex] || state.tabs[removeIndex - 1] || state.tabs[0];
            activateTab(nextTab.id);
            return;
        }

        renderTabs();
    }

    function setBookmarksVisible(visible) {
        state.bookmarksVisible = visible;
        bookmarksBar.hidden = !visible;
        if (btnToggleBookmarks) {
            btnToggleBookmarks.setAttribute('aria-pressed', visible ? 'true' : 'false');
            btnToggleBookmarks.classList.toggle('capsule-browser__btn--active', visible);
        }
    }

    form.addEventListener('submit', function onAddressSubmit(event) {
        event.preventDefault();
        navigateFromInput(addressInput.value);
    });

    if (newtabForm && newtabInput) {
        newtabForm.addEventListener('submit', function onNewtabSubmit(event) {
            event.preventDefault();
            navigateFromInput(newtabInput.value);
        });
    }

    btnHomes.forEach((btnHome) => {
        btnHome.addEventListener('click', function onHomeClick() {
            showHome(capsuleStr('firefox.statusHomeShown', 'Page Accueil affichee.'));
        });
    });

    btnReload.addEventListener('click', function onReloadClick() {
        const tab = getActiveTab();
        if (tab && tab.view === 'os-lacapsule') {
            redirectFrame.src = OS_LACAPSULE_PAGE;
            setStatus(
                capsuleStr('firefox.statusOsLaCapsuleReloaded', 'Page os-lacapsule rechargee.')
            );
            return;
        }

        showHome(capsuleStr('firefox.statusHomeReloaded', 'Page Accueil rechargee.'));
    });

    btnBack.addEventListener('click', function onBackClick() {
        setStatus('');
    });

    btnForward.addEventListener('click', function onForwardClick() {
        setStatus('');
    });

    if (btnNewTab) {
        btnNewTab.addEventListener('click', function onNewTabClick() {
            addTab();
        });
    }

    if (btnToggleBookmarks) {
        btnToggleBookmarks.addEventListener('click', function onToggleBookmarksClick() {
            setBookmarksVisible(!state.bookmarksVisible);
        });
    }

    if (btnLibrary) {
        btnLibrary.addEventListener('click', function onLibraryClick() {
            setStatus(capsuleStr('firefox.statusLibrarySoon', 'Bibliothèque : bientôt disponible.'));
        });
    }

    let menuPopover = browserRoot.querySelector('[data-browser-menu]');
    if (!menuPopover && btnMenu) {
        menuPopover = document.createElement('div');
        menuPopover.className = 'capsule-browser__menu-popover';
        menuPopover.hidden = true;
        menuPopover.setAttribute('data-browser-menu', '');
        menuPopover.setAttribute('role', 'menu');
        const menuItems = [
            capsuleStr('firefox.menuNewTab', 'Nouvel onglet'),
            capsuleStr('firefox.menuNewWindow', 'Nouvelle fenêtre'),
            capsuleStr('firefox.menuHistory', 'Historique'),
            capsuleStr('firefox.menuDownloads', 'Téléchargements'),
            capsuleStr('firefox.menuQuit', 'Quitter'),
        ];
        menuItems.forEach(function appendMenuItem(label) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'capsule-browser__menu-item';
            item.setAttribute('role', 'menuitem');
            item.textContent = label;
            menuPopover.appendChild(item);
        });
        const menuHost = btnMenu.parentElement;
        if (menuHost) {
            menuHost.appendChild(menuPopover);
        }
    }

    function closeMenuPopover() {
        if (!menuPopover || !btnMenu) {
            return;
        }
        menuPopover.hidden = true;
        btnMenu.setAttribute('aria-expanded', 'false');
    }

    function toggleMenuPopover() {
        if (!menuPopover || !btnMenu) {
            return;
        }
        const open = menuPopover.hidden;
        menuPopover.hidden = !open;
        btnMenu.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    if (btnMenu) {
        btnMenu.addEventListener('click', function onMenuClick(event) {
            event.preventDefault();
            event.stopPropagation();
            toggleMenuPopover();
        });
    }

    if (menuPopover) {
        menuPopover.addEventListener('click', function onMenuItemClick(event) {
            const item = event.target.closest('.capsule-browser__menu-item');
            if (!item || !menuPopover.contains(item)) {
                return;
            }
            event.preventDefault();
            const label = item.textContent || '';
            closeMenuPopover();
            if (label.indexOf('Nouvel onglet') >= 0) {
                addTab();
                return;
            }
            setStatus(
                capsuleStrFmt('firefox.statusMenuItem', { label: label }, 'Menu : ' + label)
            );
        });
    }

    document.addEventListener('click', function onDocMenuClose(event) {
        if (!menuPopover || menuPopover.hidden) {
            return;
        }
        if (menuPopover.contains(event.target) || event.target === btnMenu) {
            return;
        }
        closeMenuPopover();
    });

    browserRoot.setAttribute('tabindex', '-1');
    if (browserRoot.dataset.firefoxKeysBound !== 'true') {
        browserRoot.addEventListener('keydown', function onFirefoxKeys(event) {
            if (!event.ctrlKey) {
                return;
            }
            const key = event.key;
            if (key === 't' || key === 'T') {
                event.preventDefault();
                addTab();
                return;
            }
            if (key === 'l' || key === 'L') {
                event.preventDefault();
                addressInput.focus();
                addressInput.select();
            }
        });
        browserRoot.dataset.firefoxKeysBound = 'true';
    }

    tabsList.addEventListener('click', function onTabsListClick(event) {
        const closeTarget = event.target.closest('[data-browser-tab-close]');
        if (closeTarget && tabsList.contains(closeTarget)) {
            event.preventDefault();
            event.stopPropagation();
            closeTab(closeTarget.getAttribute('data-browser-tab-close'));
            return;
        }

        const tabBtn = event.target.closest('[data-browser-tab-id]');
        if (!tabBtn || !tabsList.contains(tabBtn)) {
            return;
        }

        event.preventDefault();
        activateTab(tabBtn.getAttribute('data-browser-tab-id'));
        setStatus('');
    });

    bookmarksBar.addEventListener('click', function onBookmarksBarClick(event) {
        const bookmark = event.target.closest('[data-browser-bookmark]');
        if (!bookmark || !bookmarksBar.contains(bookmark)) {
            return;
        }

        event.preventDefault();
        const label = bookmark.getAttribute('data-browser-bookmark') || 'favori';
        const route = bookmark.getAttribute('data-browser-route') || 'noop';

        if (route === 'home') {
            showHome(capsuleStr('firefox.statusFavoriteHome', 'Favori "Accueil" ouvert.'));
            return;
        }

        if (route === 'os-lacapsule') {
            showOsLaCapsule(
                capsuleStrFmt(
                    'firefox.statusFavoriteOsLaCapsule',
                    { label: label },
                    'Favori "' + label + '" ouvert.'
                )
            );
            return;
        }

        if (isHomeTarget(label)) {
            showHome(capsuleStr('firefox.statusFavoriteHome', 'Favori "Accueil" ouvert.'));
            return;
        }

        if (isOsLaCapsuleTarget(label)) {
            showOsLaCapsule(
                capsuleStrFmt(
                    'firefox.statusFavoriteOsLaCapsule',
                    { label: label },
                    'Favori "' + label + '" ouvert.'
                )
            );
            return;
        }

        setStatus(
            capsuleStrFmt(
                'firefox.statusBookmarkUnmapped',
                { label: label },
                'Favori "' + label + '" non mappe pour le moment.'
            )
        );
    });

    if (newtabShortcuts) {
        newtabShortcuts.addEventListener('click', function onNewtabShortcutsClick(event) {
            const link = event.target.closest('[data-browser-newtab-link]');
            if (!link || !newtabShortcuts.contains(link)) {
                return;
            }

            event.preventDefault();
            const key = link.getAttribute('data-browser-newtab-link') || '';

            if (key === 'os-lacapsule') {
                showOsLaCapsule(
                    capsuleStr('firefox.statusFavoriteOsLaCapsule', 'Favori « La Capsule » ouvert.')
                );
                return;
            }

            setStatus(
                capsuleStrFmt(
                    'firefox.statusNewtabShortcutSoon',
                    { label: link.textContent.replace(/\s+/g, ' ').trim() },
                    'Raccourci non mappe pour le moment.'
                )
            );
        });
    }

    redirectFrame.addEventListener('load', function onRedirectLoad() {
        const tab = getActiveTab();
        if (tab && tab.view === 'os-lacapsule') {
            setStatus(
                capsuleStr('firefox.statusOsLaCapsuleShown', 'Page os-lacapsule affichee.')
            );
        }
    });

    redirectFrame.addEventListener('error', function onRedirectError() {
        showHome(
            capsuleStr(
                'firefox.statusErrorOsLaCapsule',
                "Erreur de chargement: impossible d'ouvrir la page os-lacapsule."
            )
        );
    });

    browserRoot.__capsuleFirefoxSession = state;
    browserRoot.dataset.initialized = 'true';
    setBookmarksVisible(false);
    showHome('');
}

function purgeFirefoxWindowRuntime(windowElement) {
    const root = windowElement || document.getElementById('firefox');
    const app = root && root.querySelector('[data-firefox-app]');
    if (!app) {
        return;
    }
    delete app.__capsuleFirefoxSession;
    delete app.dataset.initialized;

    const addressInput = app.querySelector('[data-browser-address]');
    const status = app.querySelector('[data-browser-status]');
    const homeView = app.querySelector('[data-browser-home]');
    const redirectView = app.querySelector('[data-browser-redirect]');
    const redirectFrame = app.querySelector('[data-browser-redirect-frame]');
    const tabsList = app.querySelector('[data-browser-tabs]');
    const newtabInput = app.querySelector('[data-browser-newtab-input]');

    if (addressInput) {
        addressInput.value = '';
    }
    if (newtabInput) {
        newtabInput.value = '';
    }
    if (status) {
        status.hidden = true;
        status.textContent = '';
    }
    if (tabsList) {
        tabsList.innerHTML = '';
    }
    if (redirectFrame) {
        redirectFrame.src = 'about:blank';
    }
    if (redirectView) {
        redirectView.hidden = true;
    }
    if (homeView) {
        homeView.hidden = false;
    }
}

function reopenFirefoxWindow(windowElement) {
    purgeFirefoxWindowRuntime(windowElement);
    if (typeof initFirefoxBrowser === 'function') {
        initFirefoxBrowser();
    }
}

if (typeof window !== 'undefined'
    && window.CapsuleWindowMemory
    && typeof window.CapsuleWindowMemory.register === 'function') {
    const sessionTier = (window.CapsuleMemoryConventions && window.CapsuleMemoryConventions.TIERS)
        ? window.CapsuleMemoryConventions.TIERS.SESSION
        : (window.CapsuleWindowMemory.TIERS && window.CapsuleWindowMemory.TIERS.SESSION);
    window.CapsuleWindowMemory.register({
        slotId: 'firefox',
        tier: sessionTier || 'session',
        resolveStorageKeys: () => [],
        purgeRuntime: purgeFirefoxWindowRuntime,
        onReopen: reopenFirefoxWindow,
    });
}

window.initFirefoxBrowser = initFirefoxBrowser;
window.initMintFirefoxBrowser = initFirefoxBrowser;
