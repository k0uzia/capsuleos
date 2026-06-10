/**
 * Logithèque — mintinstall 8.4 (Software Manager) sur Mint.
 */
(function initMintInstallAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Logithèque';

    var MINT_CAT_BY_SLOT = {
        firefox: 'internet',
        thunderbird: 'internet',
        transmission: 'internet',
        librewriter: 'office',
        librecalc: 'office',
        libreoffice_impress: 'office',
        libreoffice_draw: 'office',
        libreoffice_startcenter: 'office',
        drawing: 'graphics',
        lecteur_multimedia: 'multimedia',
        rhythmbox: 'multimedia',
        calculator: 'accessories',
        text_editor: 'accessories',
        file_roller: 'accessories',
        calendar: 'accessories',
        simple_scan: 'accessories',
        warpinator: 'internet',
        timeshift: 'accessories'
    };

    var MINT_ICON_BY_SLOT = {
        firefox: './assets/images/vendors/mint/panel/firefox.webp',
        thunderbird: './assets/images/toolkits/cinnamon/apps/thunderbird.png',
        transmission: './assets/images/toolkits/cinnamon/apps/transmission.png',
        librewriter: './assets/images/vendors/mint/panel/libreoffice-writer.webp',
        librecalc: './assets/images/toolkits/cinnamon/apps/libreoffice-calc',
        libreoffice_impress: './assets/images/toolkits/cinnamon/apps/libreoffice-impress',
        libreoffice_draw: './assets/images/toolkits/cinnamon/apps/libreoffice-draw',
        libreoffice_startcenter: './assets/images/toolkits/cinnamon/apps/libreoffice-startcenter',
        drawing: './assets/images/toolkits/cinnamon/apps/com.github.maoschanz.drawing.png',
        lecteur_multimedia: './assets/images/toolkits/cinnamon/apps/io.github.celluloid_player.Celluloid',
        rhythmbox: './assets/images/toolkits/cinnamon/apps/rhythmbox.png',
        calculator: './assets/images/vendors/mint/panel/org.gnome.Calculator.webp',
        text_editor: './assets/images/vendors/mint/panel/accessories-text-editor.webp'
    };

    var CATALOG_FALLBACK = [
        { id: 'firefox', name: 'Firefox', desc: 'Navigateur web', cat: 'internet', icon: './assets/images/vendors/mint/panel/firefox.webp' },
        { id: 'librewriter', name: 'LibreOffice Writer', desc: 'Traitement de texte', cat: 'office', icon: './assets/images/vendors/mint/panel/libreoffice-writer.webp' },
        { id: 'librecalc', name: 'LibreOffice Calc', desc: 'Tableur', cat: 'office', icon: './assets/images/toolkits/cinnamon/apps/libreoffice-calc' },
        { id: 'libreoffice_impress', name: 'LibreOffice Impress', desc: 'Présentations', cat: 'office', icon: './assets/images/toolkits/cinnamon/apps/libreoffice-impress' },
        { id: 'libreoffice_draw', name: 'LibreOffice Draw', desc: 'Dessin vectoriel', cat: 'office', icon: './assets/images/toolkits/cinnamon/apps/libreoffice-draw' }
    ];

    function mapStoreEntryToMint(entry) {
        var slot = entry.storeSlot || entry.slot;
        if (!slot) {
            return null;
        }
        return {
            id: slot,
            name: entry.title,
            desc: entry.sub || entry.desc || entry.title,
            cat: MINT_CAT_BY_SLOT[slot] || 'accessories',
            icon: entry.iconPath || MINT_ICON_BY_SLOT[slot] || './assets/images/toolkits/cinnamon/apps/default.png',
            defaultInstalled: entry.defaultInstalled === true,
            storeInstallable: entry.storeInstallable === true
        };
    }

    function buildCatalogFromRegistry() {
        var store = global.CapsuleMintStore;
        if (!store || typeof store.getStoreList !== 'function') {
            return null;
        }
        var list = store.getStoreList();
        if (!list.length) {
            return null;
        }
        var out = [];
        var i;
        for (i = 0; i < list.length; i += 1) {
            var mapped = mapStoreEntryToMint(list[i]);
            if (mapped) {
                out.push(mapped);
            }
        }
        return out.length ? out : null;
    }

    function buildDiscoverCatalog(installed) {
        var store = global.CapsuleMintStore;
        if (!store || typeof store.getDiscoverApps !== 'function') {
            return [];
        }
        var list = store.getDiscoverApps(installed || {});
        if (!list.length) {
            return [];
        }
        var out = [];
        var i;
        for (i = 0; i < list.length; i += 1) {
            var mapped = mapStoreEntryToMint(list[i]);
            if (mapped) {
                out.push(mapped);
            }
        }
        return out;
    }

    function getCatalog() {
        return buildCatalogFromRegistry() || CATALOG_FALLBACK;
    }

    function renderFeaturedDiscover(root, installed) {
        var featuredEl = root.querySelector('.mi-app__featured');
        if (!featuredEl) {
            return;
        }
        var discover = buildDiscoverCatalog(installed);
        if (!discover.length) {
            return;
        }
        featuredEl.innerHTML = '';
        var di;
        for (di = 0; di < discover.length && di < 8; di += 1) {
            var entry = discover[di];
            var card = global.document.createElement('li');
            card.className = 'mi-app__featured-card';
            card.setAttribute('data-mi-pkg', entry.id);
            var icon = global.document.createElement('img');
            icon.src = resolveIconUrl(entry.icon);
            icon.alt = '';
            icon.width = 48;
            icon.height = 48;
            var name = global.document.createElement('span');
            name.className = 'mi-app__featured-name';
            name.textContent = entry.name;
            card.appendChild(icon);
            card.appendChild(name);
            featuredEl.appendChild(card);
        }
    }

    var CAT_LABELS = {
        home: 'Accueil',
        all: 'Tous les logiciels',
        flatpak: 'Flatpak',
        internet: 'Internet',
        office: 'Bureautique',
        graphics: 'Graphisme',
        games: 'Jeux',
        multimedia: 'Multimédia',
        education: 'Éducation',
        accessories: 'Accessoires',
        installed: 'Installés',
        development: 'Développement'
    };

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'mintinstall') {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function syncWindowTitle(winEl) {
        if (!winEl) {
            return;
        }
        var wmTitle = winEl.querySelector('#windowTitle');
        if (wmTitle) {
            wmTitle.textContent = WINDOW_TITLE;
        }
        winEl.setAttribute('data-title', WINDOW_TITLE);
    }

    function showPage(root, pageId) {
        var pages = root.querySelectorAll('[data-mi-page]');
        var pi;
        for (pi = 0; pi < pages.length; pi += 1) {
            var page = pages[pi];
            if (page.getAttribute('data-mi-page') === pageId) {
                page.removeAttribute('hidden');
            } else {
                page.setAttribute('hidden', 'hidden');
            }
        }
    }

    function setActiveCategory(root, catId) {
        var buttons = root.querySelectorAll('[data-mi-cat]');
        var bi;
        for (bi = 0; bi < buttons.length; bi += 1) {
            var btn = buttons[bi];
            if (btn.getAttribute('data-mi-cat') === catId) {
                btn.classList.add('is-active');
            } else {
                btn.classList.remove('is-active');
            }
        }
    }

    function renderListItem(entry, isInstalled) {
        var li = global.document.createElement('li');
        li.className = 'mi-app__list-item';
        li.setAttribute('data-mi-pkg', entry.id);
        var icon = global.document.createElement('img');
        icon.className = 'mi-app__list-icon';
        icon.src = typeof global.resolveCapsuleAssetUrl === 'function'
            ? global.resolveCapsuleAssetUrl(entry.icon)
            : (typeof global.resolveCapsuleResourceUrl === 'function'
                ? global.resolveCapsuleResourceUrl(entry.icon)
                : entry.icon);
        icon.alt = '';
        var body = global.document.createElement('div');
        body.className = 'mi-app__list-body';
        var name = global.document.createElement('p');
        name.className = 'mi-app__list-name';
        name.textContent = entry.name;
        var desc = global.document.createElement('p');
        desc.className = 'mi-app__list-desc';
        desc.textContent = entry.desc;
        body.appendChild(name);
        body.appendChild(desc);
        var installBtn = global.document.createElement('button');
        installBtn.type = 'button';
        installBtn.className = 'mi-app__install' + (isInstalled ? ' is-installed' : '');
        installBtn.setAttribute('data-mi-install', entry.id);
        installBtn.textContent = isInstalled ? 'Installé' : 'Installer';
        installBtn.disabled = !!isInstalled;
        li.appendChild(icon);
        li.appendChild(body);
        li.appendChild(installBtn);
        return li;
    }

    function entryName(pkgId) {
        var catalog = getCatalog();
        var ei;
        for (ei = 0; ei < catalog.length; ei += 1) {
            if (catalog[ei].id === pkgId) {
                return catalog[ei].name;
            }
        }
        return pkgId;
    }

    function catalogEntry(pkgId) {
        var catalog = getCatalog();
        var ei;
        for (ei = 0; ei < catalog.length; ei += 1) {
            if (catalog[ei].id === pkgId) {
                return catalog[ei];
            }
        }
        return null;
    }

    function resolveIconUrl(iconPath) {
        if (typeof global.resolveCapsuleAssetUrl === 'function') {
            return global.resolveCapsuleAssetUrl(iconPath);
        }
        if (typeof global.resolveCapsuleResourceUrl === 'function') {
            return global.resolveCapsuleResourceUrl(iconPath);
        }
        return iconPath;
    }

    function initMintInstallAppOnce() {
        var root = global.document.getElementById('mintInstallApp');
        if (!root || root.dataset.mintInstallInit === 'true') {
            return;
        }
        root.dataset.mintInstallInit = 'true';

        var winEl = getWindowEl(root);
        syncWindowTitle(winEl);

        var featuredImgs = root.querySelectorAll('.mi-app__featured img[src^="./assets/"]');
        var fi;
        for (fi = 0; fi < featuredImgs.length; fi += 1) {
            var featSrc = featuredImgs[fi].getAttribute('src');
            if (typeof global.resolveCapsuleAssetUrl === 'function') {
                featuredImgs[fi].src = global.resolveCapsuleAssetUrl(featSrc);
            } else if (typeof global.resolveCapsuleResourceUrl === 'function') {
                featuredImgs[fi].src = global.resolveCapsuleResourceUrl(featSrc);
            }
        }

        var searchInput = root.querySelector('#mi-search');
        var listEl = root.querySelector('#mi-app-list');
        var searchListEl = root.querySelector('#mi-search-list');
        var searchEmpty = root.querySelector('#mi-search-empty');
        var listTitle = root.querySelector('#mi-list-title');
        var searchTitle = root.querySelector('#mi-search-title');
        var menuEl = root.querySelector('#mi-menu');
        var menuBtn = root.querySelector('[data-mi-action="menu"]');
        var statusEl = root.querySelector('#mi-status');
        var detailName = root.querySelector('#mi-detail-name');
        var detailDesc = root.querySelector('#mi-detail-desc');
        var detailBlurb = root.querySelector('#mi-detail-blurb');
        var detailIcon = root.querySelector('#mi-detail-icon');
        var detailInstallBtn = root.querySelector('[data-mi-detail-install]');

        var installed = {};
        var currentCat = 'home';
        var detailPkgId = null;
        var catalog = getCatalog();
        var ci;
        for (ci = 0; ci < catalog.length; ci += 1) {
            if (catalog[ci].defaultInstalled) {
                installed[catalog[ci].id] = true;
            }
        }

        renderFeaturedDiscover(root, installed);

        function setStatus(msg) {
            if (statusEl) {
                statusEl.textContent = msg || '';
            }
        }

        function filterCatalog(catId) {
            var activeCatalog = getCatalog();
            if (catId === 'all' || catId === 'flatpak') {
                return activeCatalog.slice();
            }
            if (catId === 'installed') {
                var out = [];
                var ci;
                for (ci = 0; ci < activeCatalog.length; ci += 1) {
                    if (installed[activeCatalog[ci].id]) {
                        out.push(activeCatalog[ci]);
                    }
                }
                return out;
            }
            var filtered = [];
            var fi;
            for (fi = 0; fi < activeCatalog.length; fi += 1) {
                if (activeCatalog[fi].cat === catId) {
                    filtered.push(activeCatalog[fi]);
                }
            }
            return filtered;
        }

        function renderCategoryList(catId) {
            if (!listEl || !listTitle) {
                return;
            }
            var label = CAT_LABELS[catId] || catId;
            listTitle.textContent = label;
            listEl.innerHTML = '';
            var items = filterCatalog(catId);
            var ii;
            for (ii = 0; ii < items.length; ii += 1) {
                listEl.appendChild(renderListItem(items[ii], installed[items[ii].id]));
            }
            showPage(root, 'list');
        }

        function onCategoryClick(catId) {
            currentCat = catId;
            setActiveCategory(root, catId);
            if (catId === 'home') {
                showPage(root, 'home');
                return;
            }
            renderCategoryList(catId);
        }

        function runSearch(query) {
            var q = (query || '').trim().toLowerCase();
            if (!searchListEl || !searchEmpty || !searchTitle) {
                return;
            }
            searchListEl.innerHTML = '';
            if (!q) {
                searchEmpty.setAttribute('hidden', 'hidden');
                onCategoryClick(currentCat);
                return;
            }
            showPage(root, 'search');
            searchTitle.textContent = 'Résultats pour « ' + query.trim() + ' »';
            var activeCatalog = getCatalog();
            var matches = [];
            var si;
            for (si = 0; si < activeCatalog.length; si += 1) {
                var entry = activeCatalog[si];
                if (entry.name.toLowerCase().indexOf(q) !== -1
                    || entry.desc.toLowerCase().indexOf(q) !== -1) {
                    matches.push(entry);
                }
            }
            if (!matches.length) {
                searchEmpty.removeAttribute('hidden');
                return;
            }
            searchEmpty.setAttribute('hidden', 'hidden');
            var mi;
            for (mi = 0; mi < matches.length; mi += 1) {
                searchListEl.appendChild(renderListItem(matches[mi], installed[matches[mi].id]));
            }
        }

        function syncDetailInstallBtn(pkgId) {
            if (!detailInstallBtn) {
                return;
            }
            detailInstallBtn.setAttribute('data-mi-detail-install', pkgId);
            if (installed[pkgId]) {
                detailInstallBtn.textContent = 'Installé';
                detailInstallBtn.classList.add('is-installed');
                detailInstallBtn.disabled = true;
            } else {
                detailInstallBtn.textContent = 'Installer';
                detailInstallBtn.classList.remove('is-installed');
                detailInstallBtn.disabled = false;
            }
        }

        function openDetail(pkgId) {
            var entry = catalogEntry(pkgId);
            if (!entry) {
                return;
            }
            detailPkgId = pkgId;
            if (detailName) {
                detailName.textContent = entry.name;
            }
            if (detailDesc) {
                detailDesc.textContent = entry.desc;
            }
            if (detailBlurb) {
                detailBlurb.textContent = entry.desc + ' — paquet simulé pour le clone pédagogique.';
            }
            if (detailIcon) {
                detailIcon.src = resolveIconUrl(entry.icon);
            }
            syncDetailInstallBtn(pkgId);
            showPage(root, 'detail');
        }

        function markInstalled(pkgId, btn) {
            installed[pkgId] = true;
            if (btn) {
                btn.textContent = 'Installé';
                btn.classList.add('is-installed');
                btn.disabled = true;
            }
            if (detailPkgId === pkgId) {
                syncDetailInstallBtn(pkgId);
            }
            root.querySelectorAll('[data-mi-install="' + pkgId + '"]').forEach(function syncListBtn(listBtn) {
                listBtn.textContent = 'Installé';
                listBtn.classList.add('is-installed');
                listBtn.disabled = true;
            });
            setStatus(entryName(pkgId) + ' installé');
        }

        root.addEventListener('click', function onClick(event) {
            var target = event.target;
            if (!target || !target.closest) {
                return;
            }
            var catBtn = target.closest('[data-mi-cat]');
            if (catBtn) {
                onCategoryClick(catBtn.getAttribute('data-mi-cat'));
                return;
            }
            var backBtn = target.closest('[data-mi-back]');
            if (backBtn) {
                onCategoryClick(currentCat);
                return;
            }
            var listOpen = target.closest('.mi-app__list-item');
            if (listOpen && !target.closest('[data-mi-install]')) {
                openDetail(listOpen.getAttribute('data-mi-pkg'));
                return;
            }
            var detailInstall = target.closest('[data-mi-detail-install]');
            if (detailInstall && !detailInstall.disabled) {
                markInstalled(detailInstall.getAttribute('data-mi-detail-install'), detailInstall);
                return;
            }
            var installBtn = target.closest('[data-mi-install]');
            if (installBtn && !installBtn.disabled) {
                markInstalled(installBtn.getAttribute('data-mi-install'), installBtn);
                return;
            }
            if (menuBtn && target.closest('[data-mi-action="menu"]')) {
                var open = menuEl && menuEl.hidden;
                if (menuEl) {
                    if (open) {
                        menuEl.removeAttribute('hidden');
                    } else {
                        menuEl.setAttribute('hidden', 'hidden');
                    }
                }
                if (menuBtn) {
                    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
                }
                return;
            }
            if (menuEl && !target.closest('#mi-menu') && !target.closest('[data-mi-action="menu"]')) {
                menuEl.setAttribute('hidden', 'hidden');
                if (menuBtn) {
                    menuBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });

        if (searchInput) {
            searchInput.addEventListener('input', function onSearchInput() {
                runSearch(searchInput.value);
            });
        }

        global.document.addEventListener('keydown', function onMintInstallKeydown(event) {
            if (!root || !root.isConnected) {
                return;
            }
            var winEl = getWindowEl(root);
            if (!winEl || winEl.style.display === 'none') {
                return;
            }
            if (event.ctrlKey && (event.key === 'f' || event.key === 'F')) {
                event.preventDefault();
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
            if (event.key === 'Escape' && menuEl && !menuEl.hidden) {
                menuEl.setAttribute('hidden', 'hidden');
                if (menuBtn) {
                    menuBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });

        showPage(root, 'home');
        setActiveCategory(root, 'home');
    }

    global.initMintInstallApp = function initMintInstallApp() {
        initMintInstallAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
