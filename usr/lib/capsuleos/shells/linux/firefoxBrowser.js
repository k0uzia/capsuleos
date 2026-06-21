'use strict';

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
        || document.body.id === 'popos'
        || document.body.id === 'kali'
        || document.body.id === 'elementary'
        || document.body.id === 'anduinos';
}

function syncFirefoxGnomeDataset(browserRoot) {
    const root = browserRoot
        || document.querySelector('#firefox [data-firefox-gnome-root]');
    if (!root || !supportsFirefoxGnomeChrome()) {
        return;
    }
    const session = root.__capsuleFirefoxSession;
    if (!session) {
        return;
    }
    let activeTab = null;
    session.tabs.forEach((tab) => {
        if (tab.id === session.activeTabId) {
            activeTab = tab;
        }
    });
    if (!activeTab) {
        activeTab = session.tabs[0] || null;
    }
    const markers = [
        root,
        root.querySelector('[data-firefox-gnome-root]'),
    ].filter(Boolean);
    const view = activeTab ? activeTab.view : 'home';
    markers.forEach((node) => {
        node.dataset.firefoxGnomeInit = 'true';
        node.dataset.firefoxGnomeView = view;
        node.dataset.firefoxGnomeTabCount = String(session.tabs.length);
        node.dataset.firefoxGnomeActiveTabId = session.activeTabId || '';
        node.dataset.firefoxGnomeBookmarksVisible = session.bookmarksVisible ? 'true' : 'false';
        node.dataset.firefoxGnomeChrome = 'proton';
    });
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

        if (window.CapsuleWindowDragTargets && typeof window.CapsuleWindowDragTargets.markDragPassthrough === 'function') {
            window.CapsuleWindowDragTargets.markDragPassthrough(tabsbar);
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

        if (window.CapsuleWindowChrome
            && typeof window.CapsuleWindowChrome.syncFirefoxGnomeChrome === 'function') {
            window.CapsuleWindowChrome.syncFirefoxGnomeChrome(windowElement);
        } else if (window.CapsuleWindowDragTargets) {
            const fill = header.querySelector('.window-drag-region--header-fill');
            if (fill) {
                fill.remove();
            }
            header.removeAttribute('data-window-drag-handle');
            header.removeAttribute('data-window-drag-passthrough');
        }

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
    const siteView = browserRoot.querySelector('[data-browser-site]');
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
    const btnProfile = browserRoot.querySelector('[data-browser-action="profile"]');
    const btnPocket = browserRoot.querySelector('[data-browser-action="pocket"]');

    if (!form || !addressInput || !status || !homeView || !redirectView || !redirectFrame
        || !bookmarksBar || !tabsList || !btnReload || !btnBack || !btnForward) {
        return;
    }

    decorateFedoraFirefoxWindow(browserRoot);

    const defaultTabLabel = capsuleStr('firefox.tabNewLabel', 'Nouvel onglet');

    const resolver = (typeof window !== 'undefined' && window.CapsuleSimulatedWebResolver)
        ? window.CapsuleSimulatedWebResolver
        : null;

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
        if (resolver && typeof resolver.normalizeInput === 'function') {
            return resolver.normalizeInput(value);
        }
        return String(value || '').trim();
    }

    function normalizeUrlHost(value) {
        if (resolver && typeof resolver.normalizeUrlHost === 'function') {
            return resolver.normalizeUrlHost(value);
        }
        let host = normalizeInput(value).toLowerCase();
        host = host.replace(/^https?:\/\//, '');
        host = host.replace(/\/.*$/, '');
        host = host.replace(/^www\./, '');
        return host;
    }

    function isHomeTarget(value) {
        if (resolver && typeof resolver.isHomeTarget === 'function') {
            return resolver.isHomeTarget(value);
        }
        const normalized = normalizeInput(value).toLowerCase();
        return normalized === ''
            || normalized === 'accueil'
            || normalized === 'about:newtab'
            || normalized === 'capsuleos://accueil';
    }

    function resolveNavigation(rawValue) {
        if (resolver && typeof resolver.resolveInput === 'function') {
            return resolver.resolveInput(rawValue);
        }
        const value = normalizeInput(rawValue);
        if (isHomeTarget(value)) {
            return { type: 'home' };
        }
        return {
            type: 'web',
            siteId: 'lacapsule',
            address: 'lacapsule.org',
            url: (typeof window !== 'undefined' && window.CAPSULE_SITE_HOME)
                ? String(window.CAPSULE_SITE_HOME)
                : '/index.html',
        };
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

    function tabLabelForView(view, address, resolution) {
        if (resolution && resolution.type === 'mnt' && resolution.label) {
            return resolution.label;
        }
        if (view === 'web' && resolution && resolution.siteId === 'lacapsule') {
            return capsuleStr('firefox.tabOsLaCapsuleLabel', 'La Capsule');
        }
        if (view === 'web' && address && !isHomeTarget(address)) {
            return address;
        }
        if (view === 'error' && address) {
            return address;
        }
        return defaultTabLabel;
    }

    function switchView(view) {
        const showHome = view === 'home';
        const showWeb = view === 'web' || view === 'error';
        const showModule = view === 'module';

        homeView.hidden = !showHome;
        redirectView.hidden = !showWeb;
        if (siteView) {
            siteView.hidden = !showModule;
        }

        homeView.style.display = showHome ? 'flex' : 'none';
        redirectView.style.display = showWeb ? 'block' : 'none';
        if (siteView) {
            siteView.style.display = showModule ? 'block' : 'none';
        }

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
        if (tab.view === 'web' || tab.view === 'error') {
            const targetUrl = tab.resolution && tab.resolution.url
                ? tab.resolution.url
                : '';
            if (targetUrl && redirectFrame.src !== targetUrl) {
                redirectFrame.src = targetUrl;
            }
        }
        if (tab.view === 'module') {
            redirectFrame.src = 'about:blank';
        }
        renderTabs();
        syncFirefoxGnomeDataset(browserRoot);
    }

    function persistActiveTab(view, address, label, resolution) {
        const tab = getActiveTab();
        if (!tab) {
            return;
        }
        tab.view = view;
        tab.address = address || '';
        tab.resolution = resolution || null;
        tab.label = label || tabLabelForView(view, tab.address, resolution);
        applyActiveTabToUi();
    }

    function showHome(message) {
        persistActiveTab('home', '', defaultTabLabel, null);
        if (message) {
            setStatus(message);
        } else {
            setStatus('');
        }
    }

    function showWebPage(resolution, message) {
        const address = resolution.address || resolution.siteId || '';
        persistActiveTab('web', address, tabLabelForView('web', address, resolution), resolution);
        setStatus(
            message || capsuleStr('firefox.statusWebLoading', 'Chargement de la page…')
        );
        redirectFrame.src = resolution.url || '';
    }

    function showErrorPage(resolution, message) {
        const address = resolution.address || '';
        persistActiveTab('error', address, tabLabelForView('error', address, resolution), resolution);
        setStatus(message || '');
        redirectFrame.src = resolution.url || '';
    }

    function showModulePage(resolution, message) {
        const address = resolution.moduleId || '';
        persistActiveTab('module', address, tabLabelForView('module', address, resolution), resolution);
        setStatus(
            message || capsuleStrFmt(
                'firefox.statusMntOpen',
                { label: resolution.label || resolution.moduleId },
                'Ouverture du module pédagogique…'
            )
        );
        redirectFrame.src = 'about:blank';
        renderModulePanel(resolution);
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('capsule:open-mnt-scenario', {
                detail: {
                    moduleId: resolution.moduleId,
                    scenarioId: resolution.scenarioId,
                    path: resolution.path,
                },
            }));
        }
    }

    function renderModulePanel(resolution) {
        if (!siteView || !resolution) {
            return;
        }
        siteView.replaceChildren();
        const index = resolver && typeof resolver.getIndex === 'function'
            ? resolver.getIndex()
            : (typeof window !== 'undefined' && window.CAPSULE_SIMULATED_WEB_INDEX) || {};
        const modules = index.modules || {};
        const entry = modules[resolution.moduleId] || {};
        const label = resolution.label || entry.labelFr || resolution.moduleId || '';
        const article = document.createElement('article');
        article.className = 'capsule-browser-site__page capsule-browser-site__page--mnt';
        article.setAttribute('data-browser-mnt-module', resolution.moduleId || '');

        const title = document.createElement('h1');
        title.className = 'capsule-browser-site__title';
        title.textContent = label;

        const lead = document.createElement('p');
        lead.className = 'capsule-browser-site__lead';
        lead.textContent = capsuleStrFmt(
            'firefox.mntPanelLead',
            { module: label },
            'Module pédagogique CapsuleOS — parcours monté sous /mnt.'
        );

        const hint = document.createElement('p');
        hint.className = 'capsule-browser-site__hint';
        hint.textContent = capsuleStr(
            'firefox.mntPanelHint',
            'Les Missions et les applications du scénario s\'ouvrent automatiquement si disponibles sur ce bureau.'
        );

        article.appendChild(title);
        article.appendChild(lead);
        article.appendChild(hint);
        siteView.appendChild(article);
    }

    function applyNavigation(resolution, message) {
        if (!resolution || resolution.type === 'home') {
            showHome(message || capsuleStr('firefox.statusHomeShown', 'Page Accueil affichee.'));
            return;
        }
        if (resolution.type === 'web') {
            showWebPage(resolution, message);
            return;
        }
        if (resolution.type === 'mnt') {
            showModulePage(resolution, message);
            return;
        }
        if (resolution.type === 'error') {
            showErrorPage(resolution, message);
            return;
        }
        showErrorPage({
            type: 'error',
            address: '',
            url: resolver ? resolver.webPageUrl('neterror') : '',
        });
    }

    function navigateFromInput(rawValue, message) {
        applyNavigation(resolveNavigation(rawValue), message);
    }

    function renderTabs() {
        tabsList.replaceChildren();

        state.tabs.forEach((tab) => {
            const isActive = tab.id === state.activeTabId;
            const tabBtn = document.createElement('button');
            tabBtn.type = 'button';
            tabBtn.className = 'capsule-browser__tab firefox-tab'
                + (isActive ? ' capsule-browser__tab--active' : '');
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
        syncFirefoxGnomeDataset(browserRoot);
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
        if (tab && (tab.view === 'web' || tab.view === 'error') && tab.resolution) {
            redirectFrame.src = tab.resolution.url || '';
            setStatus(
                capsuleStr('firefox.statusWebReloaded', 'Page rechargée.')
            );
            return;
        }
        if (tab && tab.view === 'module' && tab.resolution) {
            showModulePage(tab.resolution);
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

    if (btnProfile) {
        btnProfile.addEventListener('click', function onProfileClick() {
            setStatus(capsuleStr('firefox.statusProfileSoon', 'Profil Firefox : bientôt disponible.'));
        });
    }

    if (btnPocket) {
        btnPocket.addEventListener('click', function onPocketClick() {
            setStatus(capsuleStr('firefox.statusPocketSoon', 'Pocket : bientôt disponible.'));
        });
    }

    let menuPopover = browserRoot.querySelector('[data-browser-menu]');
    if (!menuPopover && btnMenu) {
        menuPopover = document.createElement('div');
        menuPopover.className = 'capsule-browser__menu-popover firefox-appmenu';
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

    function handleFirefoxShortcutKeys(event) {
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
    }

    browserRoot.__capsuleFirefoxHandleKeys = handleFirefoxShortcutKeys;

    browserRoot.setAttribute('tabindex', '-1');
    if (browserRoot.dataset.firefoxKeysBound !== 'true') {
        browserRoot.addEventListener('keydown', function onFirefoxKeys(event) {
            handleFirefoxShortcutKeys(event);
        });
        browserRoot.dataset.firefoxKeysBound = 'true';
    }

    if (document.documentElement.dataset.firefoxGlobalKeysBound !== 'true') {
        document.addEventListener('keydown', function onGlobalFirefoxKeys(event) {
            const win = document.getElementById('firefox');
            if (!win || !win.classList.contains('windowElementActive')) {
                return;
            }
            const app = win.querySelector('[data-firefox-app]');
            if (app && typeof app.__capsuleFirefoxHandleKeys === 'function') {
                app.__capsuleFirefoxHandleKeys(event);
            }
        });
        document.documentElement.dataset.firefoxGlobalKeysBound = 'true';
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

        const shortcutKey = route === 'os-lacapsule' ? 'os-lacapsule' : route;
        if (resolver && typeof resolver.resolveShortcut === 'function' && shortcutKey) {
            const resolution = resolver.resolveShortcut(shortcutKey);
            if (resolution) {
                applyNavigation(resolution, capsuleStrFmt(
                    'firefox.statusFavoriteOsLaCapsule',
                    { label: label },
                    'Favori "' + label + '" ouvert.'
                ));
                return;
            }
        }

        if (isHomeTarget(label) || isHomeTarget(route)) {
            showHome(capsuleStr('firefox.statusFavoriteHome', 'Favori "Accueil" ouvert.'));
            return;
        }

        navigateFromInput(route || label, capsuleStrFmt(
            'firefox.statusFavoriteOsLaCapsule',
            { label: label },
            'Favori "' + label + '" ouvert.'
        ));
    });

    if (newtabShortcuts) {
        newtabShortcuts.addEventListener('click', function onNewtabShortcutsClick(event) {
            const addBtn = event.target.closest('[data-browser-newtab-action="add"]');
            if (addBtn && newtabShortcuts.contains(addBtn)) {
                event.preventDefault();
                setStatus(capsuleStr('firefox.statusNewtabAddSoon', 'Ajout de raccourci : bientôt disponible.'));
                return;
            }

            const link = event.target.closest('[data-browser-newtab-link]');
            if (!link || !newtabShortcuts.contains(link)) {
                return;
            }

            event.preventDefault();
            const key = link.getAttribute('data-browser-newtab-link') || '';

            if (resolver && typeof resolver.resolveShortcut === 'function' && key) {
                const resolution = resolver.resolveShortcut(key);
                if (resolution) {
                    applyNavigation(resolution, capsuleStr(
                        'firefox.statusFavoriteOsLaCapsule',
                        'Favori « La Capsule » ouvert.'
                    ));
                    return;
                }
            }

            navigateFromInput(key, capsuleStrFmt(
                'firefox.statusNewtabShortcutSoon',
                { label: link.textContent.replace(/\s+/g, ' ').trim() },
                'Raccourci non mappe pour le moment.'
            ));
        });
    }

    redirectFrame.addEventListener('load', function onRedirectLoad() {
        const tab = getActiveTab();
        if (tab && tab.view === 'web') {
            setStatus(
                capsuleStr('firefox.statusWebShown', 'Page affichée.')
            );
        }
        if (tab && tab.view === 'error') {
            setStatus('');
        }
    });

    redirectFrame.addEventListener('error', function onRedirectError() {
        const tab = getActiveTab();
        if (tab && (tab.view === 'web' || tab.view === 'error')) {
            showErrorPage({
                type: 'error',
                address: tab.address || '',
                url: resolver ? resolver.webPageUrl('neterror') : '',
            }, capsuleStr(
                'firefox.statusErrorWeb',
                'Erreur de chargement : impossible d\'ouvrir la page.'
            ));
        }
    });

    browserRoot.__capsuleFirefoxSession = state;
    browserRoot.dataset.initialized = 'true';
    setBookmarksVisible(supportsFirefoxGnomeChrome());
    showHome('');
    syncFirefoxGnomeDataset(browserRoot);
}

window.syncFirefoxGnomeDataset = syncFirefoxGnomeDataset;

function purgeFirefoxWindowRuntime(windowElement) {
    const root = windowElement || document.getElementById('firefox');
    const app = root && root.querySelector('[data-firefox-app]');
    if (!app) {
        return;
    }
    delete app.__capsuleFirefoxSession;
    delete app.__capsuleFirefoxHandleKeys;
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
    const siteView = app.querySelector('[data-browser-site]');
    if (siteView) {
        siteView.hidden = true;
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
