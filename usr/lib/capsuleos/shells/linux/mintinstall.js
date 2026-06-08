/**
 * Logithèque — mintinstall 8.4 (Software Manager) sur Mint.
 */
(function initMintInstallAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Logithèque';

    var CATALOG = [
        { id: 'firefox', name: 'Firefox', desc: 'Navigateur web', cat: 'internet', icon: './assets/images/vendors/mint/panel/firefox.webp' },
        { id: 'thunderbird', name: 'Thunderbird', desc: 'Client de messagerie', cat: 'internet', icon: './assets/images/toolkits/cinnamon/apps/thunderbird.png' },
        { id: 'transmission', name: 'Transmission', desc: 'Client BitTorrent', cat: 'internet', icon: './assets/images/toolkits/cinnamon/apps/transmission.png' },
        { id: 'librewriter', name: 'LibreOffice Writer', desc: 'Traitement de texte', cat: 'office', icon: './assets/images/vendors/mint/panel/libreoffice-writer.webp' },
        { id: 'librecalc', name: 'LibreOffice Calc', desc: 'Tableur', cat: 'office', icon: './assets/images/toolkits/cinnamon/apps/libreoffice-calc' },
        { id: 'gimp', name: 'GIMP', desc: 'Éditeur d\'images', cat: 'graphics', icon: './assets/images/toolkits/cinnamon/apps/gimp.png' },
        { id: 'drawing', name: 'Dessin', desc: 'Dessin vectoriel', cat: 'graphics', icon: './assets/images/toolkits/cinnamon/apps/com.github.maoschanz.drawing.png' },
        { id: 'celluloid', name: 'Celluloid', desc: 'Lecteur vidéo', cat: 'multimedia', icon: './assets/images/toolkits/cinnamon/apps/io.github.celluloid_player.Celluloid' },
        { id: 'vlc', name: 'VLC', desc: 'Lecteur multimédia', cat: 'multimedia', icon: './assets/images/toolkits/cinnamon/apps/vlc.svg' },
        { id: 'audacity', name: 'Audacity', desc: 'Éditeur audio', cat: 'multimedia', icon: './assets/images/toolkits/cinnamon/apps/audacity.svg' },
        { id: 'filezilla', name: 'FileZilla', desc: 'Client FTP', cat: 'internet', icon: './assets/images/toolkits/cinnamon/apps/filezilla.svg' },
        { id: 'code', name: 'Visual Studio Code', desc: 'Éditeur de code', cat: 'development', icon: './assets/images/toolkits/cinnamon/apps/com.visualstudio.code.svg' }
    ];

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
        var ei;
        for (ei = 0; ei < CATALOG.length; ei += 1) {
            if (CATALOG[ei].id === pkgId) {
                return CATALOG[ei].name;
            }
        }
        return pkgId;
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

        var installed = {};
        var currentCat = 'home';

        function setStatus(msg) {
            if (statusEl) {
                statusEl.textContent = msg || '';
            }
        }

        function filterCatalog(catId) {
            if (catId === 'all' || catId === 'flatpak') {
                return CATALOG.slice();
            }
            if (catId === 'installed') {
                var out = [];
                var ci;
                for (ci = 0; ci < CATALOG.length; ci += 1) {
                    if (installed[CATALOG[ci].id]) {
                        out.push(CATALOG[ci]);
                    }
                }
                return out;
            }
            var filtered = [];
            var fi;
            for (fi = 0; fi < CATALOG.length; fi += 1) {
                if (CATALOG[fi].cat === catId) {
                    filtered.push(CATALOG[fi]);
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
            var matches = [];
            var si;
            for (si = 0; si < CATALOG.length; si += 1) {
                var entry = CATALOG[si];
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

        function markInstalled(pkgId, btn) {
            installed[pkgId] = true;
            if (btn) {
                btn.textContent = 'Installé';
                btn.classList.add('is-installed');
                btn.disabled = true;
            }
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
