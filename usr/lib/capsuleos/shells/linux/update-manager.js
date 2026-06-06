/**
 * Update Manager (simulation) — Mint : accueil VM, liste, installation simulée.
 */
(function initUpdateManagerApp() {
    var WELCOME_KEY = 'capsule-mintupdate-welcome-dismissed';
    var MIRROR_KEY = 'capsule-mintupdate-mirror-dismissed';
    var busy = false;

    function findRoot() {
        return document.getElementById('updateManagerApp');
    }

    function isMintSkin() {
        if (typeof document === 'undefined' || !document.body) {
            return false;
        }
        if (document.body.id === 'mint') {
            return true;
        }
        return typeof window !== 'undefined' && window.CAPSULE_EMBED_SKIN_KEY === 'mint';
    }

    function welcomeDismissed() {
        try {
            return window.localStorage.getItem(WELCOME_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function setWelcomeDismissed() {
        try {
            window.localStorage.setItem(WELCOME_KEY, '1');
        } catch (e) {
            /* hors ligne */
        }
    }

    function mirrorDismissed() {
        try {
            return window.localStorage.getItem(MIRROR_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function setMirrorDismissed() {
        try {
            window.localStorage.setItem(MIRROR_KEY, '1');
        } catch (e) {
            /* hors ligne */
        }
    }

    function applyMirrorBanner(root) {
        var banner = root.querySelector('#um-mirror-banner');
        if (!banner) {
            return;
        }
        if (mirrorDismissed()) {
            hideMirrorBanner(banner);
            return;
        }
        banner.hidden = false;
        banner.removeAttribute('aria-hidden');
        banner.style.display = '';
    }

    function detectLayout() {
        const root = findRoot();
        if (!root) {
            return;
        }
        const isPopOs = typeof document !== 'undefined'
            && document.body
            && (document.body.id === 'popos'
                || (typeof window !== 'undefined' && window.CAPSULE_EMBED_SKIN_KEY === 'popos'));
        const isOpenSuse = typeof document !== 'undefined'
            && document.body
            && (document.body.id === 'opensuse'
                || (typeof window !== 'undefined' && window.CAPSULE_EMBED_SKIN_KEY === 'opensuse'));

        if (isPopOs) {
            root.dataset.umLayout = 'cosmic';
            return;
        }
        if (isOpenSuse) {
            root.dataset.umLayout = 'kde';
            return;
        }
        root.dataset.umLayout = root.dataset.umLayout || 'mint';
    }

    function bindTrayOnce() {
        const trayBtn = document.querySelector('[data-update-manager-tray]');
        if (!trayBtn || trayBtn.dataset.umTrayInit === 'true') {
            return;
        }
        if (document.body && document.body.id === 'kde-neon') {
            return;
        }
        trayBtn.dataset.umTrayInit = 'true';
        trayBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (typeof window.openWindowByDataLink === 'function') {
                window.openWindowByDataLink('update_manager');
            }
        });
    }

    function setStatus(text) {
        const el = document.getElementById('um-status-text');
        if (el) {
            el.textContent = text;
        }
    }

    function showFeedback(root, text, restoreMs) {
        var delay = restoreMs || 2500;
        var statusFooter = root.querySelector('.update-manager__status');
        if (root.dataset.umView === 'updates' && statusFooter) {
            statusFooter.hidden = false;
            setStatus(text);
            return;
        }
        var emptyText = root.querySelector('.update-manager__empty-text');
        var empty = root.querySelector('#um-empty');
        if (emptyText && empty && !empty.hidden) {
            var previous = emptyText.textContent;
            emptyText.textContent = text;
            window.setTimeout(function restoreEmptyText() {
                if (emptyText.textContent === text) {
                    emptyText.textContent = previous;
                }
            }, delay);
            return;
        }
        setStatus(text);
    }

    function setTrayBadgeVisible(isVisible) {
        const trayBtn = document.querySelector('[data-update-manager-tray]');
        if (!trayBtn) {
            return;
        }
        trayBtn.dataset.hasUpdates = isVisible ? 'true' : 'false';
        trayBtn.setAttribute('aria-label', isVisible ? 'Mises à jour disponibles' : 'Aucune mise à jour');
    }

    function getActiveTabId(root) {
        var active = root.querySelector('[data-um-tab].is-active');
        return active ? active.getAttribute('data-um-tab') : 'info';
    }

    function buildPanelHtml(tabId, pkgName, pkgDesc, pkgVersion) {
        var labelMap = {
            info: 'Renseignements',
            packages: 'Paquets',
            changelog: 'Journal des changements'
        };
        var label = labelMap[tabId] || 'Renseignements';
        if (!pkgName) {
            return '<p class="update-manager__placeholder">Sélectionnez une mise à jour pour afficher des '
                + label.toLowerCase() + '.</p>';
        }
        if (tabId === 'packages') {
            return '<p class="update-manager__placeholder"><strong>' + pkgName + '</strong> — paquet binaire '
                + '(simulation).</p>';
        }
        if (tabId === 'changelog') {
            return '<p class="update-manager__placeholder"><strong>' + pkgName + '</strong> — correctifs et '
                + 'améliorations (simulation).</p>';
        }
        return '<p class="update-manager__placeholder"><strong>' + pkgName + '</strong><br>'
            + pkgDesc + '<br>Nouvelle version : ' + pkgVersion + '</p>';
    }

    function setActiveTab(tabId, root) {
        if (!root) {
            root = findRoot();
        }
        if (!root) {
            return;
        }
        root.querySelectorAll('[data-um-tab]').forEach((btn) => {
            btn.classList.toggle('is-active', btn.getAttribute('data-um-tab') === tabId);
        });
        var panel = root.querySelector('#um-panel');
        var selected = root.querySelector('#um-tablewrap tbody tr.is-selected');
        if (!panel) {
            return;
        }
        if (selected) {
            var pkg = selected.querySelector('.update-manager__pkg');
            var desc = selected.querySelector('.update-manager__desc');
            var version = selected.querySelector('.update-manager__version');
            panel.innerHTML = buildPanelHtml(
                tabId,
                pkg ? pkg.textContent : '',
                desc ? desc.textContent : '',
                version ? version.textContent : ''
            );
            return;
        }
        panel.innerHTML = buildPanelHtml(tabId, '', '', '');
    }

    function countSelected(root) {
        var boxes = root.querySelectorAll('#um-tablewrap tbody input[type="checkbox"]');
        var checked = 0;
        var total = boxes.length;
        var i;
        for (i = 0; i < boxes.length; i++) {
            if (boxes[i].checked) {
                checked++;
            }
        }
        return { checked: checked, total: total };
    }

    function updateSelectionStatus(root) {
        var counts = countSelected(root);
        var installBtn = root.querySelector('[data-um-action="install"]');
        if (counts.checked === 0) {
            setStatus('Aucune mise à jour sélectionnée');
            if (installBtn && root.dataset.umView === 'updates' && !busy) {
                installBtn.disabled = true;
            }
            return;
        }
        if (counts.checked === counts.total) {
            setStatus('129 mises à jour sont sélectionnées (1,1 Go)');
        } else {
            setStatus(counts.checked + ' mise(s) sélectionnée(s) dans la liste (129 au total, 1,1 Go)');
        }
        if (installBtn && root.dataset.umView === 'updates' && !busy) {
            installBtn.disabled = false;
        }
    }

    function setToolbarState(root, mode) {
        if (!root || busy) {
            return;
        }
        var all = root.querySelectorAll('[data-um-action]');
        var i;
        for (i = 0; i < all.length; i++) {
            var btn = all[i];
            var action = btn.getAttribute('data-um-action');
            if (mode === 'updates') {
                btn.disabled = action === 'install' ? countSelected(root).checked === 0 : false;
            } else if (action === 'refresh') {
                btn.disabled = false;
            } else {
                btn.disabled = true;
            }
        }
    }

    function setBusy(root, isBusy) {
        busy = isBusy;
        root.dataset.umBusy = isBusy ? 'true' : 'false';
        var tools = root.querySelectorAll('[data-um-action]');
        var i;
        for (i = 0; i < tools.length; i++) {
            tools[i].disabled = isBusy;
        }
        if (!isBusy) {
            setToolbarState(root, root.dataset.umView || 'uptodate');
            if (root.dataset.umView === 'updates') {
                updateSelectionStatus(root);
            }
        }
    }

    function showWelcome(root) {
        root.dataset.umView = 'welcome';
        var welcome = root.querySelector('#um-welcome');
        var main = root.querySelector('#um-main');
        if (welcome) {
            welcome.hidden = false;
        }
        if (main) {
            main.hidden = true;
        }
        setToolbarState(root, 'welcome');
        setStatus('');
    }

    function showMainView(root, view) {
        root.dataset.umView = view;
        var welcome = root.querySelector('#um-welcome');
        var main = root.querySelector('#um-main');
        var empty = root.querySelector('#um-empty');
        var table = root.querySelector('#um-tablewrap');
        var bottom = root.querySelector('.update-manager__bottom');
        var statusFooter = root.querySelector('.update-manager__status');
        if (welcome) {
            welcome.hidden = true;
        }
        if (main) {
            main.hidden = false;
        }
        if (view === 'updates') {
            if (empty) {
                empty.hidden = true;
            }
            if (table) {
                table.hidden = false;
            }
            if (bottom) {
                bottom.hidden = false;
            }
            if (statusFooter) {
                statusFooter.hidden = false;
            }
            setToolbarState(root, 'updates');
            updateSelectionStatus(root);
            return;
        }
        if (empty) {
            empty.hidden = false;
        }
        if (table) {
            table.hidden = true;
        }
        if (bottom) {
            bottom.hidden = true;
        }
        if (statusFooter) {
            statusFooter.hidden = true;
        }
        setToolbarState(root, 'uptodate');
        setStatus('');
        if (view === 'uptodate') {
            applyMirrorBanner(root);
        }
    }

    function selectRow(root, row) {
        var rows = root.querySelectorAll('#um-tablewrap tbody tr');
        var i;
        for (i = 0; i < rows.length; i++) {
            rows[i].classList.remove('is-selected');
        }
        if (row) {
            row.classList.add('is-selected');
        }
        setActiveTab(getActiveTabId(root), root);
    }

    function selectFirstRow(root) {
        var first = root.querySelector('#um-tablewrap tbody tr');
        if (first) {
            selectRow(root, first);
        }
    }

    function runRefreshSimulation(root) {
        setBusy(root, true);
        setStatus('Recherche de mises à jour…');
        window.setTimeout(function onRefreshDone() {
            var welcome = root.querySelector('#um-welcome');
            if (welcome && !welcome.hidden) {
                setWelcomeDismissed();
            }
            showMainView(root, 'updates');
            selectFirstRow(root);
            setBusy(root, false);
        }, 900);
    }

    function runInstallSimulation(root) {
        var steps = [
            { text: 'Préparation de l\'installation…', ms: 700 },
            { text: 'Téléchargement des paquets…', ms: 900 },
            { text: 'Application des mises à jour (35 %)…', ms: 800 },
            { text: 'Application des mises à jour (72 %)…', ms: 800 },
            { text: 'Finalisation et nettoyage…', ms: 700 }
        ];
        var idx = 0;
        setBusy(root, true);
        setStatus(steps[0].text);

        function nextStep() {
            if (idx >= steps.length) {
                setTrayBadgeVisible(false);
                showMainView(root, 'uptodate');
                setBusy(root, false);
                return;
            }
            setStatus(steps[idx].text);
            window.setTimeout(nextStep, steps[idx].ms);
            idx++;
        }

        window.setTimeout(nextStep, steps[0].ms);
    }

    function onAction(action, root) {
        if (action === 'install') {
            runInstallSimulation(root);
            return;
        }
        if (action === 'refresh') {
            runRefreshSimulation(root);
            return;
        }
        if (action === 'selectAll') {
            var boxes = root.querySelectorAll('#um-tablewrap tbody input[type="checkbox"]');
            var i;
            for (i = 0; i < boxes.length; i++) {
                boxes[i].checked = true;
            }
            updateSelectionStatus(root);
            return;
        }
        if (action === 'clear') {
            var checks = root.querySelectorAll('#um-tablewrap tbody input[type="checkbox"]');
            var j;
            for (j = 0; j < checks.length; j++) {
                checks[j].checked = false;
            }
            updateSelectionStatus(root);
        }
    }

    function closeAllMenus(root) {
        root.querySelectorAll('.update-manager__menu').forEach(function closeMenu(menu) {
            var trigger = menu.querySelector('.update-manager__menu-trigger');
            var dropdown = menu.querySelector('.update-manager__menu-dropdown');
            if (!dropdown) {
                return;
            }
            dropdown.hidden = true;
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function closeUpdateManagerWindow(root) {
        var win = root.closest('[data-link="update_manager"]');
        if (!win) {
            return;
        }
        var closeBtn = win.querySelector('#closeBtn');
        if (closeBtn) {
            closeBtn.click();
        }
    }

    function setRowsChecked(root, predicate) {
        var rows = root.querySelectorAll('#um-tablewrap tbody tr');
        var i;
        for (i = 0; i < rows.length; i++) {
            var checkbox = rows[i].querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = predicate(rows[i], i);
            }
        }
        updateSelectionStatus(root);
    }

    function syncAutoRefreshMenu(root) {
        var item = root.querySelector('[data-um-menu-action="auto-refresh"]');
        if (!item) {
            return;
        }
        var enabled = root.dataset.umAutoRefresh === 'true';
        item.classList.toggle('is-checked', enabled);
    }

    function onMenuAction(action, root) {
        closeAllMenus(root);
        if (action === 'preferences') {
            showFeedback(root, 'Préférences du gestionnaire de mise à jour (simulation).');
            return;
        }
        if (action === 'close') {
            closeUpdateManagerWindow(root);
            return;
        }
        if (action === 'select-security' || action === 'select-kernels') {
            if (root.dataset.umView !== 'updates') {
                runRefreshSimulation(root);
                window.setTimeout(function afterRefresh() {
                    setRowsChecked(root, function pickRow(row, index) {
                        return index < 3;
                    });
                    showFeedback(root, action === 'select-security'
                        ? 'Mises à jour de sécurité sélectionnées (simulation).'
                        : 'Mises à jour des noyaux sélectionnées (simulation).', 3000);
                }, 950);
                return;
            }
            setRowsChecked(root, function pickRow(row, index) {
                return index < 3;
            });
            showFeedback(root, action === 'select-security'
                ? 'Mises à jour de sécurité sélectionnées (simulation).'
                : 'Mises à jour des noyaux sélectionnées (simulation).', 3000);
            return;
        }
        if (action === 'selectAll') {
            onAction('selectAll', root);
            return;
        }
        if (action === 'clear') {
            onAction('clear', root);
            return;
        }
        if (action === 'show-updates') {
            runRefreshSimulation(root);
            return;
        }
        if (action === 'auto-refresh') {
            var next = root.dataset.umAutoRefresh !== 'true';
            root.dataset.umAutoRefresh = next ? 'true' : 'false';
            syncAutoRefreshMenu(root);
            showFeedback(root, next
                ? 'Actualisation automatique activée (simulation).'
                : 'Actualisation automatique désactivée (simulation).');
            return;
        }
        if (action === 'history') {
            showFeedback(root, 'Historique des mises à jour (simulation).');
            return;
        }
        if (action === 'help') {
            window.alert('Gestionnaire de mise à jour\nmintupdate 7.1.4\nSimulation CapsuleOS');
            return;
        }
        if (action === 'about') {
            window.alert('Gestionnaire de mise à jour\nmintupdate 7.1.4\nLinux Mint 22.3\nSimulation CapsuleOS');
        }
    }

    function hideMirrorBanner(banner) {
        if (!banner) {
            return;
        }
        banner.hidden = true;
        banner.setAttribute('aria-hidden', 'true');
        banner.style.display = 'none';
    }

    function onMirrorResponse(choice, root) {
        closeAllMenus(root);
        var banner = root.querySelector('#um-mirror-banner');
        setMirrorDismissed();
        hideMirrorBanner(banner);
        if (choice === 'yes') {
            showFeedback(root, 'Ouverture des sources logicielles…', 1400);
            return;
        }
    }

    function bindMirrorButtons(root) {
        var banner = root.querySelector('#um-mirror-banner');
        if (!banner || banner.dataset.umMirrorInit === 'true') {
            return;
        }
        banner.dataset.umMirrorInit = 'true';
        banner.querySelectorAll('[data-um-mirror], .update-manager__banner-btn').forEach(function bindMirror(btn) {
            btn.addEventListener('click', function onMirrorClick(event) {
                event.preventDefault();
                event.stopPropagation();
                if (busy) {
                    return;
                }
                var choice = btn.getAttribute('data-um-mirror');
                if (!choice) {
                    choice = btn.textContent.trim().toLowerCase() === 'oui' ? 'yes' : 'no';
                }
                onMirrorResponse(choice, root);
            });
        });
    }

    function setupMenus(root) {
        root.querySelectorAll('.update-manager__menu').forEach(function bindMenu(menu) {
            var trigger = menu.querySelector('.update-manager__menu-trigger');
            var dropdown = menu.querySelector('.update-manager__menu-dropdown');
            if (!trigger || !dropdown) {
                return;
            }

            trigger.addEventListener('click', function onTriggerClick(e) {
                e.stopPropagation();
                if (busy) {
                    return;
                }
                var wasOpen = !dropdown.hidden;
                closeAllMenus(root);
                if (!wasOpen) {
                    dropdown.hidden = false;
                    trigger.setAttribute('aria-expanded', 'true');
                }
            });

            trigger.addEventListener('mouseenter', function onTriggerEnter() {
                if (busy) {
                    return;
                }
                var anyOpen = root.querySelector('.update-manager__menu-dropdown:not([hidden])');
                if (anyOpen && dropdown.hidden) {
                    closeAllMenus(root);
                    dropdown.hidden = false;
                    trigger.setAttribute('aria-expanded', 'true');
                }
            });

            dropdown.querySelectorAll('[data-um-menu-action]').forEach(function bindEntry(entry) {
                entry.addEventListener('click', function onEntryClick(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (busy) {
                        return;
                    }
                    onMenuAction(entry.getAttribute('data-um-menu-action'), root);
                });
            });
        });

        document.addEventListener('click', function onDocClick(event) {
            if (!root.contains(event.target)) {
                closeAllMenus(root);
            }
        }, true);

        root.addEventListener('keydown', function onEscape(event) {
            if (event.key === 'Escape') {
                closeAllMenus(root);
            }
        });

        syncAutoRefreshMenu(root);
    }

    function bindMintInteractions(root) {
        setupMenus(root);
        bindMirrorButtons(root);

        root.addEventListener('click', function onMintClick(event) {
            if (busy) {
                return;
            }
            var welcomeBtn = event.target.closest('[data-um-welcome]');
            if (welcomeBtn && root.contains(welcomeBtn)) {
                event.preventDefault();
                var cmd = welcomeBtn.getAttribute('data-um-welcome');
                if (cmd === 'help') {
                    onMenuAction('help', root);
                    return;
                }
                if (cmd === 'finish') {
                    setWelcomeDismissed();
                    showMainView(root, 'uptodate');
                }
                return;
            }
            var menuAction = event.target.closest('[data-um-menu-action]');
            if (menuAction && root.contains(menuAction)) {
                return;
            }
            var mirrorBtn = event.target.closest('[data-um-mirror], .update-manager__banner-btn');
            if (mirrorBtn && root.contains(mirrorBtn)) {
                return;
            }
            var tab = event.target.closest('[data-um-tab]');
            if (tab && root.contains(tab)) {
                event.preventDefault();
                setActiveTab(tab.getAttribute('data-um-tab'), root);
                return;
            }
            var row = event.target.closest('#um-tablewrap tbody tr');
            if (row && root.contains(row) && !event.target.closest('input[type="checkbox"]')) {
                selectRow(root, row);
                return;
            }
            var tool = event.target.closest('[data-um-action]');
            if (tool && root.contains(tool) && !tool.disabled) {
                event.preventDefault();
                onAction(tool.getAttribute('data-um-action'), root);
            }
        });

        root.addEventListener('change', function onMintChange(event) {
            var checkbox = event.target;
            if (!checkbox || checkbox.type !== 'checkbox') {
                return;
            }
            if (!root.contains(checkbox) || !checkbox.closest('#um-tablewrap tbody')) {
                return;
            }
            updateSelectionStatus(root);
        });
    }

    function bindOnce() {
        const root = findRoot();
        if (!root || root.dataset.umInit === 'true') {
            return;
        }
        if (root.classList.contains('update-manager--ubuntu')) {
            root.dataset.umInit = 'true';
            root.addEventListener('click', (event) => {
                const action = event.target.closest('[data-um-ubuntu-action]');
                if (!action || !root.contains(action)) {
                    return;
                }
                event.preventDefault();
                const id = action.getAttribute('data-um-ubuntu-action');
                if (id === 'check') {
                    setStatus('Recherche de mises à jour… (simulation)');
                    return;
                }
                if (id === 'updateAll') {
                    setStatus('Toutes les mises à jour installées (simulation).');
                    setTrayBadgeVisible(false);
                    return;
                }
                if (id === 'updateOne') {
                    setStatus('Mise à jour installée (simulation).');
                }
            });
            return;
        }
        if (root.classList.contains('update-manager--gnome')) {
            root.dataset.umInit = 'true';
            root.addEventListener('click', (event) => {
                const action = event.target.closest('[data-um-gnome-action]');
                if (!action || !root.contains(action)) {
                    return;
                }
                event.preventDefault();
                const id = action.getAttribute('data-um-gnome-action');
                if (id === 'check') {
                    setStatus('Recherche de mises à jour… (simulation)');
                    return;
                }
                if (id === 'updateAll') {
                    setStatus('Toutes les mises à jour installées (simulation).');
                    setTrayBadgeVisible(false);
                    return;
                }
                if (id === 'updateOne') {
                    setStatus('Mise à jour installée (simulation).');
                }
            });
            return;
        }
        detectLayout();

        root.dataset.umInit = 'true';

        if (root.dataset.umLayout === 'cosmic') {
            root.addEventListener('click', (event) => {
                const action = event.target.closest('[data-um-cosmic-action]');
                if (action && root.contains(action)) {
                    event.preventDefault();
                    setStatus('Mises à jour vérifiées (simulation).');
                }
            });
            return;
        }

        if (root.dataset.umLayout === 'kde') {
            const isMxKde = typeof document !== 'undefined'
                && document.body
                && (document.body.id === 'mx-kde'
                    || (typeof window !== 'undefined' && window.CAPSULE_EMBED_SKIN_KEY === 'mxkde'));
            if (isMxKde) {
                const badge = root.querySelector('.kde-updates__badge');
                if (badge) {
                    badge.textContent = '3';
                    badge.setAttribute('aria-label', '3 mises à jour');
                }
            }
            root.addEventListener('click', (event) => {
                const action = event.target.closest('[data-um-kde-action]');
                if (action && root.contains(action)) {
                    event.preventDefault();
                    const id = action.getAttribute('data-um-kde-action');
                    if (id === 'refresh') {
                        setStatus('Mises à jour rafraîchies (simulation).');
                    } else {
                        setStatus('Toutes les mises à jour installées (simulation).');
                        setTrayBadgeVisible(false);
                    }
                }
            });
            return;
        }

        bindMintInteractions(root);

        if (isMintSkin() && !welcomeDismissed()) {
            showWelcome(root);
        } else if (isMintSkin()) {
            showMainView(root, 'uptodate');
        } else {
            var welcome = root.querySelector('#um-welcome');
            var main = root.querySelector('#um-main');
            var table = root.querySelector('#um-tablewrap');
            var empty = root.querySelector('#um-empty');
            if (welcome) {
                welcome.hidden = true;
            }
            if (main) {
                main.hidden = false;
            }
            if (empty) {
                empty.hidden = true;
            }
            if (table) {
                table.hidden = false;
            }
            setToolbarState(root, 'updates');
            updateSelectionStatus(root);
        }
        setActiveTab('info', root);
    }

    window.initUpdateManagerApp = bindOnce;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindTrayOnce);
    } else {
        bindTrayOnce();
    }
})();
