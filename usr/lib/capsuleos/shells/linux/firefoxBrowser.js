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

function isMintFirefoxScope() {
    return !!(document.body && document.body.id === 'mint');
}

function ensureMintFirefoxTitlebar(windowElement, browserRoot) {
    if (!isMintFirefoxScope() || !windowElement || windowElement.dataset.link !== 'firefox') {
        return;
    }

    windowElement.classList.remove('firefox-window--fedora');

    const tabsbar = browserRoot && browserRoot.querySelector('.capsule-browser__tabsbar');
    let header = windowElement.querySelector(':scope > #windowHeader');
    const integrated = tabsbar && tabsbar.querySelector('#windowHeader');

    if (integrated && integrated !== header) {
        integrated.remove();
        header = windowElement.querySelector(':scope > #windowHeader');
    }

    if (header && tabsbar && tabsbar.contains(header)) {
        const anchor = windowElement.querySelector(':scope > #windowIframe') || browserRoot.parentElement;
        if (anchor && anchor.parentElement === windowElement) {
            windowElement.insertBefore(header, anchor);
        } else {
            windowElement.prepend(header);
        }
        header.classList.remove('firefox-window-controls--fedora');
        delete header.dataset.fedoraFirefoxControls;
    }

    if (header) {
        header.hidden = false;
        header.removeAttribute('aria-hidden');
        header.style.removeProperty('display');
    }

    const titleKey = 'firefox.windowTitle';
    const titleText = capsuleStr(titleKey, 'Mozilla Firefox');
    const titleEl = header && header.querySelector('#windowTitle');
    if (titleEl) {
        titleEl.textContent = titleText;
    }
    windowElement.setAttribute('data-title', titleText);

    if (window.CapsuleWindowChrome) {
        if (typeof window.CapsuleWindowChrome.ensureHeader === 'function') {
            window.CapsuleWindowChrome.ensureHeader(windowElement, 'firefox');
        }
        if (typeof window.CapsuleWindowChrome.afterInject === 'function') {
            window.CapsuleWindowChrome.afterInject(windowElement, 'firefox');
        }
    }
}

function getFirefoxContribPack() {
    if (typeof window === 'undefined' || !window.CAPSULE_FIREFOX_CONTRIB) {
        return null;
    }
    return window.CAPSULE_FIREFOX_CONTRIB;
}

function applyFirefoxContribPack(browserRoot, refs) {
    const pack = getFirefoxContribPack();
    if (!pack || !browserRoot || !refs) {
        return false;
    }

    const searchCfg = pack.searchEngine || {};
    const engineKey = searchCfg.defaultEngine || 'google';
    const engine = (searchCfg.engines || {})[engineKey] || {};
    const placeholder = engine.placeholderFr
        || capsuleStr('firefox.addressPlaceholder', 'Rechercher avec Google ou saisir une adresse');

    if (refs.addressInput) {
        refs.addressInput.placeholder = placeholder;
    }
    if (refs.newtabInput) {
        refs.newtabInput.placeholder = placeholder;
    }

    if (refs.bookmarksBar) {
        refs.bookmarksBar.innerHTML = '';
        (pack.bookmarks || []).forEach((entry) => {
            const label = entry.labelFr || entry.label || 'favori';
            const route = entry.route || 'noop';
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'capsule-browser__bookmark';
            if (entry.primary) {
                link.classList.add('capsule-browser__bookmark--primary');
            }
            if (route === 'noop') {
                link.classList.add('capsule-browser__bookmark--import');
            }
            link.setAttribute('data-browser-bookmark', label);
            link.setAttribute('data-browser-route', route);
            link.textContent = label;
            refs.bookmarksBar.appendChild(link);
        });
    }

    if (refs.newtabShortcuts) {
        refs.newtabShortcuts.querySelectorAll('[data-browser-newtab-link]').forEach((node) => {
            node.remove();
        });
        const addButton = refs.newtabShortcuts.querySelector('[data-browser-newtab-action="add"]');
        (pack.newtabShortcuts || []).forEach((entry) => {
            const key = entry.key || entry.siteId || '';
            if (!key) {
                return;
            }
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'capsule-browser-newtab__shortcut capsule-browser-newtab__shortcut--' + key;
            link.setAttribute('data-browser-newtab-link', key);
            link.textContent = entry.labelFr || entry.label || key;
            if (entry.sponsored) {
                const sponsored = document.createElement('span');
                sponsored.className = 'capsule-browser-newtab__sponsored';
                sponsored.textContent = capsuleStr('firefox.newtabSponsored', 'Sponsorisé');
                link.appendChild(sponsored);
            }
            if (addButton) {
                refs.newtabShortcuts.insertBefore(link, addButton);
            } else {
                refs.newtabShortcuts.appendChild(link);
            }
        });
    }

    browserRoot.dataset.firefoxContribLoaded = 'true';
    browserRoot.dataset.firefoxContribVersion = String((pack.manifest && pack.manifest.version) || 1);
    browserRoot.dataset.firefoxContribShortcuts = String((pack.newtabShortcuts || []).length);
    return true;
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
        if (browserRoot && browserRoot.dataset.firefoxContribLoaded) {
            node.dataset.firefoxContribLoaded = browserRoot.dataset.firefoxContribLoaded;
            node.dataset.firefoxContribShortcuts = browserRoot.dataset.firefoxContribShortcuts || '';
        }
        if (activeTab && activeTab.history) {
            node.dataset.firefoxGnomeCanGoBack = activeTab.historyIndex > 0 ? 'true' : 'false';
            node.dataset.firefoxGnomeCanGoForward = activeTab.historyIndex < activeTab.history.length - 1
                ? 'true'
                : 'false';
        }
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
    const newtabShortcuts = browserRoot.querySelector('[data-browser-newtab-shortcuts]');
    const panelHistory = browserRoot.querySelector('[data-browser-panel="history"]');
    const panelDownloads = browserRoot.querySelector('[data-browser-panel="downloads"]');
    const historyList = browserRoot.querySelector('[data-browser-history-list]');

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

    const windowElement = browserRoot.closest('.windowElement');
    if (isMintFirefoxScope()) {
        ensureMintFirefoxTitlebar(windowElement, browserRoot);
    } else {
        decorateFedoraFirefoxWindow(browserRoot);
    }

    applyFirefoxContribPack(browserRoot, {
        addressInput: addressInput,
        newtabInput: newtabInput,
        bookmarksBar: bookmarksBar,
        newtabShortcuts: newtabShortcuts,
    });

    const defaultTabLabel = capsuleStr('firefox.tabNewLabel', 'Nouvel onglet');

    const resolver = (typeof window !== 'undefined' && window.CapsuleSimulatedWebResolver)
        ? window.CapsuleSimulatedWebResolver
        : null;

    function makeHomeEntry() {
        return {
            view: 'home',
            address: '',
            label: defaultTabLabel,
            resolution: null,
        };
    }

    function createTabState(id) {
        const entry = makeHomeEntry();
        return {
            id: id,
            label: defaultTabLabel,
            view: 'home',
            address: '',
            resolution: null,
            history: [entry],
            historyIndex: 0,
        };
    }

    const state = {
        tabCounter: 1,
        activeTabId: 'tab-1',
        bookmarksVisible: false,
        openPanel: null,
        sessionHistory: [],
        demoDownloads: [{
            id: 'demo-1',
            name: capsuleStr('firefox.downloadDemoName', 'guide-capsuleos-simulation.pdf'),
            size: capsuleStr('firefox.downloadDemoSize', '248 Ko'),
            state: 'complete',
        }],
        tabs: [createTabState('tab-1')],
    };

    function normalizeInput(value) {
        if (resolver && typeof resolver.normalizeInput === 'function') {
            return resolver.normalizeInput(value);
        }
        return String(value || '').trim();
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

    function setLoading(loading) {
        browserRoot.dataset.browserLoading = loading ? 'true' : 'false';
        btnReload.classList.toggle('capsule-browser__btn--loading', !!loading);
        btnReload.disabled = !!loading;
    }

    function tabLabelForView(view, address, resolution) {
        if (resolution && resolution.type === 'mnt' && resolution.label) {
            return resolution.label;
        }
        if (view === 'web' && resolution && resolution.siteId === 'lacapsule') {
            return capsuleStr('firefox.tabOsLaCapsuleLabel', 'La Capsule');
        }
        if (view === 'web' && resolution && resolution.siteId === 'search-google') {
            const q = resolution.url && resolution.url.indexOf('q=') >= 0
                ? decodeURIComponent((resolution.url.split('q=')[1] || '').split('&')[0])
                : '';
            return q
                ? capsuleStrFmt('firefox.tabSearchLabel', { query: q }, 'Recherche : ' + q)
                : capsuleStr('firefox.tabSearchDefault', 'Recherche Google');
        }
        if (view === 'web' && address && !isHomeTarget(address)) {
            return address;
        }
        if (view === 'error' && address) {
            return address;
        }
        return defaultTabLabel;
    }

    function resolutionToEntry(resolution) {
        if (!resolution || resolution.type === 'home') {
            return makeHomeEntry();
        }
        if (resolution.type === 'web') {
            const address = resolution.address || resolution.siteId || '';
            return {
                view: 'web',
                address: address,
                label: tabLabelForView('web', address, resolution),
                resolution: resolution,
            };
        }
        if (resolution.type === 'mnt') {
            const address = resolution.moduleId || '';
            return {
                view: 'module',
                address: address,
                label: tabLabelForView('module', address, resolution),
                resolution: resolution,
            };
        }
        if (resolution.type === 'error') {
            const address = resolution.address || '';
            return {
                view: 'error',
                address: address,
                label: tabLabelForView('error', address, resolution),
                resolution: resolution,
            };
        }
        return makeHomeEntry();
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

    function syncNavButtons() {
        const tab = getActiveTab();
        const canBack = !!(tab && tab.history && tab.historyIndex > 0);
        const canForward = !!(tab && tab.history && tab.historyIndex < tab.history.length - 1);
        btnBack.disabled = !canBack;
        btnForward.disabled = !canForward;
    }

    function recordSessionHistory(tab, entry) {
        state.sessionHistory.push({
            tabId: tab.id,
            view: entry.view,
            address: entry.address,
            label: entry.label,
            ts: Date.now(),
        });
        if (state.sessionHistory.length > 80) {
            state.sessionHistory.shift();
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

    function applyEntryToTab(tab, entry, options) {
        const opts = options || {};
        tab.view = entry.view;
        tab.address = entry.address || '';
        tab.resolution = entry.resolution || null;
        tab.label = entry.label || defaultTabLabel;

        switchView(tab.view);
        syncAddressInput(tab.address);

        if (tab.view === 'web' || tab.view === 'error') {
            const targetUrl = tab.resolution && tab.resolution.url ? tab.resolution.url : '';
            if (targetUrl) {
                setLoading(true);
                if (redirectFrame.src !== targetUrl) {
                    redirectFrame.src = targetUrl;
                } else {
                    setLoading(false);
                }
            }
        } else if (tab.view === 'module') {
            redirectFrame.src = 'about:blank';
            setLoading(false);
            renderModulePanel(tab.resolution);
            if (tab.resolution && typeof document !== 'undefined') {
                document.dispatchEvent(new CustomEvent('capsule:open-mnt-scenario', {
                    detail: {
                        moduleId: tab.resolution.moduleId,
                        scenarioId: tab.resolution.scenarioId,
                        path: tab.resolution.path,
                    },
                }));
            }
        } else {
            redirectFrame.src = 'about:blank';
            setLoading(false);
        }

        if (opts.message) {
            setStatus(opts.message);
        }

        renderTabs();
        syncNavButtons();
        renderHistoryPanel();
        syncFirefoxGnomeDataset(browserRoot);
    }

    function pushNavigation(resolution, message) {
        const tab = getActiveTab();
        if (!tab) {
            return;
        }
        const entry = resolutionToEntry(resolution);
        if (tab.historyIndex < tab.history.length - 1) {
            tab.history = tab.history.slice(0, tab.historyIndex + 1);
        }
        tab.history.push(entry);
        tab.historyIndex = tab.history.length - 1;
        recordSessionHistory(tab, entry);
        applyEntryToTab(tab, entry, { message: message });
    }

    function applyActiveTabToUi() {
        const tab = getActiveTab();
        if (!tab || !tab.history || tab.history.length === 0) {
            return;
        }
        const entry = tab.history[tab.historyIndex] || tab.history[0];
        applyEntryToTab(tab, entry, {});
    }

    function goBack() {
        const tab = getActiveTab();
        if (!tab || tab.historyIndex <= 0) {
            return;
        }
        tab.historyIndex -= 1;
        applyEntryToTab(tab, tab.history[tab.historyIndex], {});
        setStatus('');
    }

    function goForward() {
        const tab = getActiveTab();
        if (!tab || tab.historyIndex >= tab.history.length - 1) {
            return;
        }
        tab.historyIndex += 1;
        applyEntryToTab(tab, tab.history[tab.historyIndex], {});
        setStatus('');
    }

    function applyNavigation(resolution, message) {
        if (!resolution || resolution.type === 'home') {
            pushNavigation({ type: 'home' }, message || capsuleStr('firefox.statusHomeShown', 'Page Accueil affichee.'));
            return;
        }
        if (resolution.type === 'web') {
            pushNavigation(resolution, message || capsuleStr('firefox.statusWebLoading', 'Chargement de la page…'));
            return;
        }
        if (resolution.type === 'mnt') {
            pushNavigation(resolution, message || capsuleStrFmt(
                'firefox.statusMntOpen',
                { label: resolution.label || resolution.moduleId },
                'Ouverture du module pédagogique…'
            ));
            return;
        }
        if (resolution.type === 'error') {
            pushNavigation(resolution, message || '');
            return;
        }
        pushNavigation({
            type: 'error',
            address: '',
            url: resolver ? resolver.webPageUrl('neterror') : '',
        });
    }

    function navigateFromInput(rawValue, message) {
        applyNavigation(resolveNavigation(rawValue), message);
    }

    function faviconStyleForTab(tab) {
        if (!tab || !tab.resolution || tab.resolution.type !== 'web' || !tab.resolution.siteId) {
            return '';
        }
        if (resolver && typeof resolver.faviconUrlForSiteId === 'function') {
            return resolver.faviconUrlForSiteId(tab.resolution.siteId);
        }
        return '';
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
            const favicon = faviconStyleForTab(tab);
            icon.className = 'capsule-browser__tab-icon capsule-browser__tab-icon--firefox'
                + (favicon ? ' capsule-browser__tab-icon--site' : '');
            if (favicon) {
                icon.style.backgroundImage = 'url("' + favicon + '")';
            }
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

    function renderHistoryPanel() {
        if (!historyList) {
            return;
        }
        historyList.replaceChildren();
        const items = state.sessionHistory.slice().reverse();
        if (!items.length) {
            const empty = document.createElement('p');
            empty.className = 'capsule-browser-panel__empty';
            empty.textContent = capsuleStr('firefox.historyEmpty', 'Aucune entrée dans l’historique de session.');
            historyList.appendChild(empty);
            return;
        }
        items.forEach((item, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'capsule-browser-panel__item';
            btn.setAttribute('data-browser-history-index', String(state.sessionHistory.length - 1 - index));
            btn.textContent = item.label || item.address || defaultTabLabel;
            historyList.appendChild(btn);
        });
    }

    function togglePanel(name) {
        const next = state.openPanel === name ? null : name;
        state.openPanel = next;
        if (panelHistory) {
            panelHistory.hidden = next !== 'history';
        }
        if (panelDownloads) {
            panelDownloads.hidden = next !== 'downloads';
        }
        browserRoot.dataset.browserOpenPanel = next || '';
        if (next === 'history') {
            renderHistoryPanel();
        }
    }

    function activateTab(tabId) {
        state.activeTabId = tabId;
        applyActiveTabToUi();
    }

    function addTab() {
        state.tabCounter += 1;
        const tabId = 'tab-' + String(state.tabCounter);
        state.tabs.push(createTabState(tabId));
        activateTab(tabId);
        setStatus('');
    }

    function closeTab(tabId) {
        if (state.tabs.length <= 1) {
            pushNavigation({ type: 'home' }, '');
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

    function frameUrlWithCacheBust(url) {
        if (!url) {
            return url;
        }
        const sep = url.indexOf('?') >= 0 ? '&' : '?';
        return url + sep + '_capsule=' + String(Date.now());
    }

    function reloadActiveTab() {
        const tab = getActiveTab();
        if (tab && (tab.view === 'web' || tab.view === 'error') && tab.resolution) {
            setLoading(true);
            redirectFrame.src = frameUrlWithCacheBust(tab.resolution.url || '');
            setStatus(capsuleStr('firefox.statusWebReloaded', 'Page rechargée.'));
            return;
        }
        if (tab && tab.view === 'module' && tab.resolution) {
            applyEntryToTab(tab, tab.history[tab.historyIndex], {});
            return;
        }
        applyEntryToTab(tab, makeHomeEntry(), {
            message: capsuleStr('firefox.statusHomeReloaded', 'Page Accueil rechargee.'),
        });
    }

    function quitFirefoxWindow() {
        const win = browserRoot.closest('.windowElement') || document.getElementById('firefox');
        const closeBtn = win && win.querySelector('#closeBtn');
        if (closeBtn) {
            closeBtn.click();
            return;
        }
        if (win) {
            win.style.display = 'none';
            win.classList.remove('windowElementActive');
        }
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

    browserRoot.__capsuleFirefoxNavigate = function capsuleFirefoxNavigate(href) {
        navigateFromInput(href, '');
    };

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
            pushNavigation({ type: 'home' }, capsuleStr('firefox.statusHomeShown', 'Page Accueil affichee.'));
        });
    });

    btnReload.addEventListener('click', function onReloadClick() {
        reloadActiveTab();
    });

    btnBack.addEventListener('click', function onBackClick() {
        goBack();
    });

    btnForward.addEventListener('click', function onForwardClick() {
        goForward();
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
            { action: 'new-tab', label: capsuleStr('firefox.menuNewTab', 'Nouvel onglet') },
            { action: 'new-window', label: capsuleStr('firefox.menuNewWindow', 'Nouvelle fenêtre') },
            { action: 'history', label: capsuleStr('firefox.menuHistory', 'Historique') },
            { action: 'downloads', label: capsuleStr('firefox.menuDownloads', 'Téléchargements') },
            { action: 'quit', label: capsuleStr('firefox.menuQuit', 'Quitter') },
        ];
        menuItems.forEach(function appendMenuItem(item) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'capsule-browser__menu-item';
            btn.setAttribute('role', 'menuitem');
            btn.setAttribute('data-browser-menu-action', item.action);
            btn.textContent = item.label;
            menuPopover.appendChild(btn);
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

    function handleMenuAction(action) {
        closeMenuPopover();
        if (action === 'new-tab') {
            addTab();
            return;
        }
        if (action === 'new-window') {
            setStatus(capsuleStr('firefox.statusNewWindowSoon', 'Nouvelle fenêtre : non disponible dans cette simulation.'));
            return;
        }
        if (action === 'history') {
            togglePanel('history');
            return;
        }
        if (action === 'downloads') {
            togglePanel('downloads');
            return;
        }
        if (action === 'quit') {
            quitFirefoxWindow();
        }
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
            const item = event.target.closest('[data-browser-menu-action]');
            if (!item || !menuPopover.contains(item)) {
                return;
            }
            event.preventDefault();
            handleMenuAction(item.getAttribute('data-browser-menu-action'));
        });
    }

    browserRoot.querySelectorAll('[data-browser-panel-close]').forEach((btn) => {
        btn.addEventListener('click', function onPanelClose() {
            togglePanel(state.openPanel);
        });
    });

    if (historyList) {
        historyList.addEventListener('click', function onHistoryClick(event) {
            const item = event.target.closest('[data-browser-history-index]');
            if (!item || !historyList.contains(item)) {
                return;
            }
            const index = Number(item.getAttribute('data-browser-history-index'));
            const record = state.sessionHistory[index];
            if (!record) {
                return;
            }
            if (record.view === 'home') {
                pushNavigation({ type: 'home' }, '');
                return;
            }
            if (record.address) {
                navigateFromInput(record.address, '');
            }
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
        const key = event.key;
        if (event.altKey && key === 'ArrowLeft') {
            event.preventDefault();
            goBack();
            return;
        }
        if (event.altKey && key === 'ArrowRight') {
            event.preventDefault();
            goForward();
            return;
        }
        if (key === 'F5' || (event.ctrlKey && (key === 'r' || key === 'R'))) {
            event.preventDefault();
            reloadActiveTab();
            return;
        }
        if (event.ctrlKey && (key === 'w' || key === 'W')) {
            event.preventDefault();
            closeTab(state.activeTabId);
            return;
        }
        if (!event.ctrlKey) {
            return;
        }
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

        if (route === 'noop') {
            setStatus(capsuleStr('firefox.bookmarkImportHint', 'Import des marque-pages : bientôt disponible.'));
            return;
        }

        if (route === 'home') {
            pushNavigation({ type: 'home' }, capsuleStr('firefox.statusFavoriteHome', 'Favori "Accueil" ouvert.'));
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
            pushNavigation({ type: 'home' }, capsuleStr('firefox.statusFavoriteHome', 'Favori "Accueil" ouvert.'));
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
        setLoading(false);
        const tab = getActiveTab();
        if (tab && tab.view === 'web') {
            setStatus(capsuleStr('firefox.statusWebShown', 'Page affichée.'));
        }
        if (tab && tab.view === 'error') {
            setStatus('');
        }
    });

    redirectFrame.addEventListener('error', function onRedirectError() {
        setLoading(false);
        const tab = getActiveTab();
        if (!tab || (tab.view !== 'web' && tab.view !== 'error')) {
            return;
        }
        const errorResolution = {
            type: 'error',
            address: tab.address || '',
            url: resolver ? resolver.webPageUrl('neterror', { host: tab.address || '' }) : '',
        };
        const entry = resolutionToEntry(errorResolution);
        tab.history[tab.historyIndex] = entry;
        applyEntryToTab(tab, entry, {
            message: capsuleStr(
                'firefox.statusErrorWeb',
                'Erreur de chargement : impossible d\'ouvrir la page.'
            ),
        });
    });

    browserRoot.__capsuleFirefoxSession = state;
    browserRoot.dataset.initialized = 'true';
    setBookmarksVisible(supportsFirefoxGnomeChrome());
    applyEntryToTab(getActiveTab(), makeHomeEntry(), {});
    syncNavButtons();
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
    delete app.__capsuleFirefoxNavigate;
    delete app.dataset.initialized;
    delete app.dataset.browserLoading;
    delete app.dataset.browserOpenPanel;

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
