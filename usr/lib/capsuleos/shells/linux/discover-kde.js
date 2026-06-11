/**
 * Discover KDE Neon — navigation, catalogue, titre fenêtre, layout plein écran.
 */
(function initDiscoverNeon(rootGlobal) {
    'use strict';

    const env = rootGlobal || (typeof globalThis !== 'undefined' ? globalThis : window);
    const CATALOG_URL = env.CAPSULE_DISCOVER_CATALOG_URL || './content/discover-catalog.json';
    const DISCOVER_ASSET_BASE = './assets/images/vendors/neon/discover/';
    const PANEL_ASSET_BASE = './assets/images/vendors/neon/panel/';

    function resolveAssetUrl(path) {
        if (!path) {
            return '';
        }
        if (typeof resolveCapsuleResourceUrl === 'function') {
            return resolveCapsuleResourceUrl(path);
        }
        return path;
    }

    function resolveIconUrl(app) {
        if (!app || !app.icon) {
            return '';
        }
        if (app.iconBase === 'panel' || app.icon.indexOf('../panel/') === 0) {
            const name = app.icon.replace(/^\.\.\/panel\//, '');
            return resolveAssetUrl(PANEL_ASSET_BASE + name);
        }
        return resolveAssetUrl(DISCOVER_ASSET_BASE + app.icon);
    }

    let catalogPromise = null;
    let state = {
        view: 'home',
        maximized: false,
        categoryId: 'all',
    };

    const DISCOVER_CAT_IDS = [
        'all', 'accessibility', 'office', 'development', 'education', 'graphics',
        'internet', 'games', 'multimedia', 'science', 'system', 'utilities', 'addons',
    ];

    function findRoot() {
        return document.getElementById('updateManagerApp');
    }

    function findWindowShell() {
        const root = findRoot();
        return root ? root.closest('.windowElement[data-link="update_manager"]') : null;
    }

    function loadCatalog() {
        if (!catalogPromise) {
            catalogPromise = fetch(CATALOG_URL, { cache: 'no-store' })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                })
                .catch((error) => {
                    console.warn('Discover Neon: catalogue indisponible', error);
                    return null;
                });
        }
        return catalogPromise;
    }

    function setWindowTitle(title) {
        const shell = findWindowShell();
        const titleEl = shell ? shell.querySelector('#windowTitle') : null;
        if (titleEl && title) {
            titleEl.textContent = title;
        }
        if (typeof window !== 'undefined' && window.CAPSULE_WINDOW_TITLES) {
            window.CAPSULE_WINDOW_TITLES.update_manager = title;
        }
    }

    function renderAppCard(app) {
        const iconUrl = resolveIconUrl(app);
        return `
            <article class="kde-discover-card" role="listitem" data-discover-app="${app.id || ''}">
                <img class="kde-discover-card__icon" src="${iconUrl}" alt="" width="48" height="48">
                <div class="kde-discover-card__text">
                    <span class="kde-discover-card__name">${app.name || ''}</span>
                    <span class="kde-discover-card__desc">${app.desc || ''}</span>
                </div>
            </article>
        `;
    }

    function renderInstalledCard(app) {
        const iconUrl = resolveIconUrl(app);
        return `
            <article class="kde-discover-card kde-discover-card--installed" role="listitem" data-discover-app="${app.id || ''}">
                <img class="kde-discover-card__icon" src="${iconUrl}" alt="" width="32" height="32">
                <div class="kde-discover-card__text">
                    <span class="kde-discover-card__name">${app.name || ''}</span>
                    <span class="kde-discover-card__desc">${app.desc || ''}</span>
                </div>
            </article>
        `;
    }

    function parseUpdateSizeKb(sizeLabel) {
        if (!sizeLabel) {
            return 0;
        }
        const kio = String(sizeLabel).match(/([\d,]+)\s*Kio/i);
        if (kio) {
            return parseFloat(kio[1].replace(',', '.')) || 0;
        }
        const mio = String(sizeLabel).match(/([\d,]+)\s*Mio/i);
        if (mio) {
            return (parseFloat(mio[1].replace(',', '.')) || 0) * 1024;
        }
        return 0;
    }

    function formatTotalUpdateSize(kbTotal) {
        if (!kbTotal || kbTotal <= 0) {
            return '0 Kio';
        }
        if (kbTotal >= 1024) {
            return `${(kbTotal / 1024).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mio`;
        }
        return `${Math.round(kbTotal).toLocaleString('fr-FR')} Kio`;
    }

    function renderUpdateRow(item) {
        const iconUrl = resolveIconUrl(item);
        const iconMarkup = iconUrl
            ? `<img class="kde-updates__row-icon" src="${iconUrl}" alt="" width="22" height="22">`
            : '<span class="kde-updates__row-icon kde-updates__row-icon--fallback" aria-hidden="true"></span>';
        return `
            <div class="kde-updates__row" role="listitem" data-discover-update="${item.id || ''}">
                <input type="checkbox" class="kde-updates__row-check" checked aria-label="Sélectionner ${item.name}">
                ${iconMarkup}
                <div class="kde-updates__row-text">
                    <span class="kde-updates__row-name">${item.name}</span>
                    <span class="kde-updates__row-sub">${item.from} → ${item.to}</span>
                </div>
                <span class="kde-updates__row-size">${item.size || ''}</span>
            </div>
        `;
    }

    function syncUpdatesChrome(root, catalog) {
        const updates = catalog && Array.isArray(catalog.updates) ? catalog.updates : [];
        const count = updates.length;
        const badge = root.querySelector('[data-discover-updates-badge]');
        if (badge) {
            badge.textContent = String(count);
            badge.hidden = count === 0;
            badge.setAttribute('aria-label', count === 1 ? '1 mise à jour' : `${count} mises à jour`);
        }

        const listSection = root.querySelector('[data-discover-updates-list]');
        const rowsMount = root.querySelector('[data-discover-updates-mount]');
        const emptyEl = root.querySelector('[data-discover-updates-empty]');
        const footer = root.querySelector('[data-discover-updates-footer]');
        const sectionTitle = root.querySelector('[data-discover-updates-section]');
        const meta = catalog && catalog.updatesMeta ? catalog.updatesMeta : null;

        if (sectionTitle && meta && meta.sectionTitle) {
            sectionTitle.textContent = meta.sectionTitle;
        }

        const hasUpdates = count > 0;
        const trayBtn = document.querySelector('[data-update-manager-tray]');
        if (trayBtn) {
            trayBtn.dataset.hasUpdates = hasUpdates ? 'true' : 'false';
            trayBtn.setAttribute(
                'aria-label',
                hasUpdates ? 'Mises à jour disponibles' : 'Aucune mise à jour',
            );
        }
        if (sectionTitle) {
            sectionTitle.hidden = !hasUpdates;
        }
        if (rowsMount) {
            rowsMount.hidden = !hasUpdates;
        }
        if (emptyEl) {
            emptyEl.hidden = hasUpdates;
        }
        if (footer) {
            footer.hidden = !hasUpdates;
        }

        root.querySelectorAll('[data-discover-updates-select]').forEach((btn) => {
            btn.hidden = count <= 1;
        });
    }

    function findAppById(catalog, appId) {
        if (!catalog || !appId) {
            return null;
        }
        let app = null;
        (catalog.homeSections || []).some((section) => {
            return (section.apps || []).some((entry) => {
                if (entry.id === appId) {
                    app = entry;
                    return true;
                }
                return false;
            });
        });
        if (!app && Array.isArray(catalog.installed)) {
            catalog.installed.some((entry) => {
                if (entry.id === appId) {
                    app = entry;
                    return true;
                }
                return false;
            });
        }
        return app;
    }

    function ensureAppDetailPanel(root) {
        let panel = root.querySelector('[data-discover-app-detail]');
        if (panel) {
            return panel;
        }
        panel = document.createElement('main');
        panel.className = 'kde-updates__main kde-discover-panel kde-discover-panel--app-detail';
        panel.dataset.discoverAppDetail = 'true';
        panel.hidden = true;
        panel.setAttribute('aria-label', 'Fiche application');
        const panels = root.querySelector('.kde-discover-panels');
        if (panels) {
            panels.appendChild(panel);
        }
        return panel;
    }

    function resolveScreenshotUrl(shot) {
        if (!shot || !shot.asset) {
            return '';
        }
        return resolveAssetUrl(DISCOVER_ASSET_BASE + shot.asset);
    }

    function renderRating(meta) {
        const rating = Number(meta.rating);
        if (!rating || Number.isNaN(rating)) {
            return '';
        }
        const full = Math.max(0, Math.min(5, Math.floor(rating)));
        const stars = `${'★'.repeat(full)}${'☆'.repeat(5 - full)}`;
        const count = meta.ratingCount ? `<span class="kde-discover-app-detail__rating-count">${meta.ratingCount}</span>` : '';
        return `<p class="kde-discover-app-detail__rating" aria-label="${rating} sur 5">${stars}${count}</p>`;
    }

    function renderScreenshotSlides(screenshots) {
        if (!Array.isArray(screenshots) || !screenshots.length) {
            return '';
        }
        const slides = screenshots.map((shot, index) => {
            const src = resolveScreenshotUrl(shot);
            const label = shot.label || shot.id || `Capture ${index + 1}`;
            if (!src) {
                const tone = shot.tone || '#31363b';
                return `<figure class="kde-discover-app-detail__slide" data-discover-slide="${index}"${index === 0 ? ' data-active="true"' : ' hidden'}>
                    <span class="kde-discover-app-detail__shot-frame" style="--discover-shot-tone: ${tone}" aria-hidden="true"></span>
                    <figcaption class="kde-discover-app-detail__shot-label">${label}</figcaption>
                </figure>`;
            }
            return `<figure class="kde-discover-app-detail__slide" data-discover-slide="${index}"${index === 0 ? ' data-active="true"' : ' hidden'}>
                <img class="kde-discover-app-detail__shot-img" src="${src}" alt="${label}" loading="lazy">
            </figure>`;
        }).join('');
        const dots = screenshots.map((shot, index) => (
            `<button type="button" class="kde-discover-app-detail__carousel-dot${index === 0 ? ' is-active' : ''}" data-discover-carousel-dot="${index}" aria-label="Capture ${index + 1}"></button>`
        )).join('');
        return `
            <section class="kde-discover-app-detail__carousel" aria-label="Captures d'écran" data-discover-carousel>
                <div class="kde-discover-app-detail__carousel-stage">
                    <div class="kde-discover-app-detail__carousel-viewport">
                        ${slides}
                    </div>
                    <button type="button" class="kde-discover-app-detail__carousel-btn kde-discover-app-detail__carousel-btn--prev" data-discover-carousel-prev aria-label="Capture précédente" hidden>‹</button>
                    <button type="button" class="kde-discover-app-detail__carousel-btn kde-discover-app-detail__carousel-btn--next" data-discover-carousel-next aria-label="Capture suivante">›</button>
                    <div class="kde-discover-app-detail__carousel-dots" role="tablist" aria-label="Position du carrousel">${dots}</div>
                </div>
            </section>`;
    }

    function bindAppDetailCarousel(root) {
        const carousel = root.querySelector('[data-discover-carousel]');
        if (!carousel || carousel.dataset.bound === 'true') {
            return;
        }
        const slides = [...carousel.querySelectorAll('[data-discover-slide]')];
        const dots = [...carousel.querySelectorAll('[data-discover-carousel-dot]')];
        const prevBtn = carousel.querySelector('[data-discover-carousel-prev]');
        const nextBtn = carousel.querySelector('[data-discover-carousel-next]');
        if (slides.length < 2) {
            if (nextBtn) {
                nextBtn.hidden = true;
            }
            carousel.dataset.bound = 'true';
            return;
        }
        let index = 0;
        const showSlide = (nextIndex) => {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => {
                const active = slideIndex === index;
                slide.hidden = !active;
                slide.dataset.active = active ? 'true' : 'false';
            });
            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle('is-active', dotIndex === index);
            });
            if (prevBtn) {
                prevBtn.hidden = index === 0;
            }
            if (nextBtn) {
                nextBtn.hidden = index === slides.length - 1;
            }
        };
        if (prevBtn) {
            prevBtn.addEventListener('click', () => showSlide(index - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => showSlide(index + 1));
        }
        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                const target = Number(dot.getAttribute('data-discover-carousel-dot'));
                if (!Number.isNaN(target)) {
                    showSlide(target);
                }
            });
        });
        showSlide(0);
        carousel.dataset.bound = 'true';
    }

    function renderAppDetail(root, catalog, app) {
        const panel = ensureAppDetailPanel(root);
        const meta = (catalog && catalog.appDetails && catalog.appDetails[app.id]) || {};
        const iconUrl = resolveIconUrl(app);
        const summary = meta.summary || app.desc || '';
        const description = meta.description || summary;
        const screenshots = Array.isArray(meta.screenshots) ? meta.screenshots : [];
        const primaryAction = 'Installer';
        const developerLine = meta.developer
            ? `<p class="kde-discover-app-detail__developer">${meta.developer}${meta.verifiedDeveloper ? ' <span class="kde-discover-app-detail__verified" aria-label="Développeur vérifié">✓</span>' : ''}</p>`
            : '';
        const facts = [
            meta.version ? `<div><dt>Version</dt><dd>${meta.version}</dd></div>` : '',
            meta.size ? `<div><dt>Taille</dt><dd>${meta.size}</dd></div>` : '',
            meta.license ? `<div><dt>Licences</dt><dd><span class="kde-discover-app-detail__license">${meta.license}</span></dd></div>` : '',
            meta.ageRating ? `<div><dt>Âges</dt><dd>${meta.ageRating}</dd></div>` : '',
        ].filter(Boolean).join('');
        const originLabel = meta.origin ? `De ${meta.origin}` : '';
        panel.innerHTML = `
            <button type="button" class="kde-discover-app-detail__back sr-only" data-discover-app-back aria-label="Retour">Retour</button>
            <article class="kde-discover-app-detail__body">
                <div class="kde-discover-app-detail__toolbar">
                    <div class="kde-discover-app-detail__toolbar-actions">
                        <button type="button" class="kde-discover-app-detail__action kde-discover-app-detail__action--share" data-discover-app-action="share">Partager</button>
                        <button type="button" class="kde-discover-app-detail__action kde-discover-app-detail__action--remove" data-discover-app-action="remove">Supprimer</button>
                        <button type="button" class="kde-discover-app-detail__action kde-discover-app-detail__action--primary" data-discover-app-install="${app.id || ''}">${primaryAction}</button>
                    </div>
                    ${originLabel ? `<span class="kde-discover-app-detail__origin">${originLabel} ▾</span>` : ''}
                </div>
                <div class="kde-discover-app-detail__top">
                    <div class="kde-discover-app-detail__identity">
                        <img class="kde-discover-app-detail__icon" src="${iconUrl}" alt="" width="96" height="96">
                        <div class="kde-discover-app-detail__identity-text">
                            <h1 class="kde-discover-app-detail__name">${app.name || ''}</h1>
                            ${developerLine}
                            ${renderRating(meta)}
                        </div>
                    </div>
                    ${facts ? `<dl class="kde-discover-app-detail__facts">${facts}</dl>` : ''}
                </div>
                ${renderScreenshotSlides(screenshots)}
                <section class="kde-discover-app-detail__description">
                    <h2 class="kde-discover-app-detail__description-title">${summary}</h2>
                    <p class="kde-discover-app-detail__description-text">${description}</p>
                </section>
                <p class="kde-discover-app-detail__status" data-discover-app-status hidden role="status"></p>
            </article>
        `;
        bindAppDetailCarousel(root);
    }

    function showAppDetail(root, catalog, appId) {
        const app = findAppById(catalog, appId);
        if (!app) {
            return;
        }
        state.detailAppId = appId;
        state.view = 'app-detail';
        root.querySelectorAll('[data-discover-panel]').forEach((panelEl) => {
            panelEl.hidden = true;
        });
        renderAppDetail(root, catalog, app);
        const detailPanel = root.querySelector('[data-discover-app-detail]');
        if (detailPanel) {
            detailPanel.hidden = false;
        }
        setWindowTitle(`${app.name} — Discover`);
    }

    function closeAppDetail(root, catalog) {
        state.detailAppId = null;
        const detailPanel = root.querySelector('[data-discover-app-detail]');
        if (detailPanel) {
            detailPanel.hidden = true;
        }
        switchView(root, catalog, 'home');
    }

    function filterAppsForCategory(catalog, categoryId) {
        if (!catalog || categoryId === 'all') {
            return null;
        }
        const filters = catalog.categoryFilters || {};
        const spec = filters[categoryId];
        if (!spec || !Array.isArray(spec.appIds) || !spec.appIds.length) {
            return [];
        }
        const allowed = new Set(spec.appIds);
        const apps = [];
        (catalog.homeSections || []).forEach((section) => {
            (section.apps || []).forEach((app) => {
                if (app.id && allowed.has(app.id)) {
                    apps.push(app);
                }
            });
        });
        return apps;
    }

    function renderHome(root, catalog) {
        const mount = root.querySelector('[data-discover-home-mount]');
        if (!mount || !catalog || !Array.isArray(catalog.homeSections)) {
            return;
        }

        const filteredApps = filterAppsForCategory(catalog, state.categoryId);
        const filters = catalog.categoryFilters || {};
        const catMeta = filters[state.categoryId];
        const sections = filteredApps !== null
            ? [{
                id: state.categoryId,
                title: catMeta && catMeta.label ? catMeta.label : 'Applications',
                apps: filteredApps,
            }]
            : catalog.homeSections.filter((section) => !section.hidden);

        const heading = catalog.views && catalog.views.home
            ? catalog.views.home.heading
            : 'Page d\'accueil';

        mount.innerHTML = `
            <header class="kde-discover-home__hero">
                <h1 class="kde-discover-home__title">${heading}</h1>
            </header>
            ${sections.map((section) => `
                <section class="kde-discover-home__section" aria-label="${section.title}">
                    <h2 class="kde-discover-home__section-title">${section.title}</h2>
                    <div class="kde-discover-home__grid" role="list">
                        ${(section.apps || []).map(renderAppCard).join('')}
                    </div>
                </section>
            `).join('')}
        `;
    }

    function renderInstalled(root, catalog) {
        const mount = root.querySelector('[data-discover-installed-mount]');
        if (!mount || !catalog || !Array.isArray(catalog.installed)) {
            return;
        }
        mount.innerHTML = catalog.installed.map(renderInstalledCard).join('');
    }

    function renderUpdates(root, catalog) {
        const mount = root.querySelector('[data-discover-updates-mount]');
        const totalEl = root.querySelector('[data-discover-updates-total]');
        if (!mount || !catalog || !Array.isArray(catalog.updates)) {
            return;
        }
        mount.innerHTML = catalog.updates.map(renderUpdateRow).join('');
        const totalKb = catalog.updates.reduce((sum, item) => sum + parseUpdateSizeKb(item.size), 0);
        if (totalEl) {
            totalEl.innerHTML = `Taille totale&nbsp;: ${formatTotalUpdateSize(totalKb)}`;
        }
        syncUpdatesChrome(root, catalog);
    }

    function renderConfigSourceRow(source) {
        const checked = source.checked !== false ? 'checked' : '';
        return `
            <label class="kde-discover-config__source-row" role="listitem">
                <input type="checkbox" class="kde-discover-config__check" ${checked} disabled aria-disabled="true">
                <span class="kde-discover-config__source-label">${source.label || ''}</span>
            </label>
        `;
    }

    function renderConfigSection(section) {
        const isDefault = !!section.default;
        const defaultBadge = isDefault
            ? '<span class="kde-discover-config__default-badge">Source par défaut</span>'
            : `<button type="button" class="kde-discover-config__make-default" disabled aria-disabled="true">Définir par défaut</button>`;
        const addSource = section.addSource
            ? `<button type="button" class="kde-discover-config__add-source" disabled aria-disabled="true">
                    <span class="kde-discover-config__add-source-icon" aria-hidden="true"></span>
                    <span>Ajouter une source…</span>
               </button>`
            : '';

        return `
            <section class="kde-discover-config__section" aria-label="${section.name}">
                <header class="kde-discover-config__section-head">
                    <h2 class="kde-discover-config__section-title${isDefault ? ' is-default' : ''}">${section.name}</h2>
                    <div class="kde-discover-config__section-actions">
                        ${defaultBadge}
                        ${addSource}
                    </div>
                </header>
                <div class="kde-discover-config__sources" role="list">
                    ${(section.sources || []).map(renderConfigSourceRow).join('')}
                </div>
            </section>
        `;
    }

    function renderConfig(root, catalog) {
        const mount = root.querySelector('[data-discover-config-mount]');
        const sections = catalog && Array.isArray(catalog.configSources) ? catalog.configSources : [];
        if (!mount) {
            return;
        }
        mount.innerHTML = sections.map(renderConfigSection).join('');
    }

    function renderAboutLink(link) {
        const iconUrl = resolveAssetUrl(`${DISCOVER_ASSET_BASE}${link.icon}`);
        return `
            <button type="button" class="kde-form-delegate kde-form-delegate--link" disabled aria-disabled="true">
                <span class="kde-form-delegate__icon" style="--kde-form-icon: url('${iconUrl}')" aria-hidden="true"></span>
                <span class="kde-form-delegate__label">${link.label}</span>
            </button>
        `;
    }

    function renderAboutAuthor(author) {
        const roleMarkup = author.role
            ? `<span class="kde-form-delegate__desc">${author.role}</span>`
            : '';
        return `
            <div class="kde-form-delegate kde-form-delegate--person" role="listitem">
                <div class="kde-form-delegate__person-text">
                    <span class="kde-form-delegate__label">${author.name}</span>
                    ${roleMarkup}
                </div>
                <div class="kde-form-delegate__person-actions" aria-hidden="true">
                    ${author.email ? '<span class="kde-form-delegate__mini-icon kde-form-delegate__mini-icon--mail"></span>' : ''}
                    ${author.web ? '<span class="kde-form-delegate__mini-icon kde-form-delegate__mini-icon--web"></span>' : ''}
                </div>
            </div>
        `;
    }

    function renderAboutLibrary(lib) {
        return `
            <div class="kde-form-delegate kde-form-delegate--library" role="listitem">
                <span class="kde-form-delegate__label">${lib.name}</span>
                <span class="kde-form-delegate__desc">${lib.version}</span>
            </div>
        `;
    }

    function renderAbout(root, catalog) {
        const mount = root.querySelector('[data-discover-about-mount]');
        const about = catalog && catalog.about ? catalog.about : null;
        if (!mount || !about) {
            return;
        }

        const logoUrl = resolveAssetUrl(`${DISCOVER_ASSET_BASE}plasmadiscover-48.png`);
        const licenseIcon = resolveAssetUrl(`${DISCOVER_ASSET_BASE}license-symbolic.svg`);
        const copyIcon = resolveAssetUrl(`${DISCOVER_ASSET_BASE}edit-copy-symbolic.svg`);
        const links = Array.isArray(about.links) ? about.links : [];
        const libraries = Array.isArray(about.libraries) ? about.libraries : [];
        const authors = Array.isArray(about.authors) ? about.authors : [];
        const licenseName = about.license && about.license.name ? about.license.name : 'Licence publique générale GNU, version 2 ou ultérieure';

        mount.innerHTML = `
            <div class="kde-discover-about__scroll">
                <section class="kde-form-card" aria-label="Discover">
                    <div class="kde-discover-about__general">
                        <img class="kde-discover-about__logo" src="${logoUrl}" alt="" width="48" height="48">
                        <div class="kde-discover-about__intro">
                            <h2 class="kde-discover-about__heading">${about.appName} ${about.version}</h2>
                            <p class="kde-discover-about__tagline">${about.tagline || ''}</p>
                        </div>
                    </div>
                    <hr class="kde-form-card__sep">
                    <div class="kde-form-delegate kde-form-delegate--row">
                        <span class="kde-form-delegate__label">Copyright</span>
                        <span class="kde-form-delegate__desc">${about.copyright || ''}</span>
                    </div>
                </section>

                <h3 class="kde-form-header">Licence</h3>
                <section class="kde-form-card" aria-label="Licence">
                    <button type="button" class="kde-form-delegate kde-form-delegate--button" disabled aria-disabled="true">
                        <span class="kde-form-delegate__icon" style="--kde-form-icon: url('${licenseIcon}')" aria-hidden="true"></span>
                        <span class="kde-form-delegate__label">${licenseName}</span>
                    </button>
                </section>

                <section class="kde-form-card kde-form-card--links" aria-label="Liens">
                    ${links.map((link, index) => `
                        ${index > 0 ? '<hr class="kde-form-card__sep">' : ''}
                        ${renderAboutLink(link)}
                    `).join('')}
                </section>

                <div class="kde-form-header-row">
                    <h3 class="kde-form-header">Bibliothèques utilisées</h3>
                    <button type="button" class="kde-form-header__action" disabled aria-disabled="true" title="Copier dans le presse-papiers">
                        <span class="kde-form-header__action-icon" style="--kde-form-icon: url('${copyIcon}')" aria-hidden="true"></span>
                    </button>
                </div>
                <section class="kde-form-card" aria-label="Bibliothèques utilisées" role="list">
                    ${libraries.map((lib, index) => `
                        ${index > 0 ? '<hr class="kde-form-card__sep">' : ''}
                        ${renderAboutLibrary(lib)}
                    `).join('')}
                </section>

                <h3 class="kde-form-header">Auteurs</h3>
                <section class="kde-form-card" aria-label="Auteurs" role="list">
                    ${authors.map((author, index) => `
                        ${index > 0 ? '<hr class="kde-form-card__sep">' : ''}
                        ${renderAboutAuthor(author)}
                    `).join('')}
                </section>
            </div>
        `;
    }

    function syncSearchPlaceholder(root, catalog) {
        const input = root.querySelector('[data-discover-search]');
        const meta = catalog && catalog.views && catalog.views[state.view];
        if (input && meta && meta.searchPlaceholder) {
            input.placeholder = meta.searchPlaceholder;
            input.value = '';
        }
    }

    function syncViewHeadings(root, catalog) {
        const meta = catalog && catalog.views && catalog.views[state.view];
        if (!meta || !meta.heading) {
            return;
        }
        const panel = root.querySelector(`[data-discover-panel="${state.view}"]`);
        const heading = panel ? panel.querySelector('[data-discover-view-heading]') : null;
        if (heading) {
            heading.textContent = meta.heading;
        }
    }

    function setActiveNav(root, viewId) {
        root.querySelectorAll('[data-discover-nav]').forEach((btn) => {
            const active = btn.getAttribute('data-discover-nav') === viewId;
            btn.classList.toggle('is-active', active);
            if (active) {
                btn.setAttribute('aria-current', 'page');
            } else {
                btn.removeAttribute('aria-current');
            }
        });
    }

    function setVisiblePanel(root, viewId) {
        const detailPanel = root.querySelector('[data-discover-app-detail]');
        if (detailPanel) {
            detailPanel.hidden = true;
        }
        root.querySelectorAll('[data-discover-panel]').forEach((panel) => {
            const show = panel.getAttribute('data-discover-panel') === viewId;
            panel.hidden = !show;
        });
        root.dataset.discoverView = viewId;
    }

    function switchView(root, catalog, viewId) {
        if (!viewId || !catalog || !catalog.views || !catalog.views[viewId]) {
            return;
        }
        state.view = viewId;
        setActiveNav(root, viewId);
        setVisiblePanel(root, viewId);
        syncSearchPlaceholder(root, catalog);
        syncViewHeadings(root, catalog);
        setWindowTitle(catalog.views[viewId].title);
        if (viewId === 'home') {
            renderHome(root, catalog);
        }
    }

    function syncMaximizedState(root) {
        const shell = findWindowShell();
        const maximized = !!(shell && shell.dataset.maximized === 'true');
        if (state.maximized === maximized) {
            return;
        }
        state.maximized = maximized;
        root.classList.toggle('discover-neon--maximized', maximized);
    }

    function observeWindowChrome(root) {
        const shell = findWindowShell();
        if (!shell) {
            return;
        }
        syncMaximizedState(root);
        const observer = new MutationObserver(() => {
            syncMaximizedState(root);
        });
        observer.observe(shell, {
            attributes: true,
            attributeFilter: ['data-maximized', 'style'],
        });
    }

    function syncCategoryNav(root) {
        root.querySelectorAll('.kde-updates__cat').forEach((btn) => {
            const catId = btn.dataset.discoverCat || 'all';
            const active = catId === state.categoryId;
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-current', active ? 'true' : 'false');
        });
    }

    function bindCategoryNav(root, catalog) {
        if (root.dataset.discoverCatsInit === 'true') {
            return;
        }
        root.dataset.discoverCatsInit = 'true';
        root.querySelectorAll('.kde-updates__cat').forEach((btn, index) => {
            const catId = DISCOVER_CAT_IDS[index] || 'all';
            btn.dataset.discoverCat = catId;
            btn.removeAttribute('disabled');
            btn.removeAttribute('aria-disabled');
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                state.categoryId = catId;
                state.view = 'home';
                loadCatalog().then((nextCatalog) => {
                    if (!nextCatalog) {
                        return;
                    }
                    renderHome(root, nextCatalog);
                    switchView(root, nextCatalog, 'home');
                    syncCategoryNav(root);
                });
            });
        });
        syncCategoryNav(root);
    }

    function bindUpdatesActions(root) {
        root.addEventListener('click', (event) => {
            const card = event.target.closest('.kde-discover-card');
            if (card && root.contains(card)) {
                event.preventDefault();
                const appId = card.getAttribute('data-discover-app');
                loadCatalog().then((catalog) => {
                    if (catalog && appId) {
                        showAppDetail(root, catalog, appId);
                    }
                });
                return;
            }

            const backBtn = event.target.closest('[data-discover-app-back]');
            if (backBtn && root.contains(backBtn)) {
                event.preventDefault();
                loadCatalog().then((catalog) => {
                    if (catalog) {
                        closeAppDetail(root, catalog);
                    }
                });
                return;
            }

            const installBtn = event.target.closest('[data-discover-app-install]');
            if (installBtn && root.contains(installBtn)) {
                event.preventDefault();
                const status = root.querySelector('[data-discover-app-status]');
                if (status) {
                    status.hidden = false;
                    status.textContent = 'Installation simulée — application ajoutée au catalogue lab.';
                }
                installBtn.disabled = true;
                installBtn.setAttribute('aria-disabled', 'true');
                return;
            }

            const navBtn = event.target.closest('[data-discover-nav]');
            if (navBtn && root.contains(navBtn)) {
                event.preventDefault();
                loadCatalog().then((catalog) => {
                    switchView(root, catalog, navBtn.getAttribute('data-discover-nav'));
                });
                return;
            }

            const action = event.target.closest('[data-um-kde-action]');
            if (!action || !root.contains(action)) {
                return;
            }
            event.preventDefault();
            const id = action.getAttribute('data-um-kde-action');
            if (id === 'refresh') {
                return;
            }
            if (id === 'updateAll') {
                loadCatalog().then((catalog) => {
                    if (!catalog) {
                        return;
                    }
                    catalog.updates = [];
                    renderUpdates(root, catalog);
                    syncUpdatesChrome(root, catalog);
                });
            }
        });
    }

    function bindOnce() {
        const root = findRoot();
        const discoverReady = root && (
            root.classList.contains('update-manager--kde-neon')
            || root.querySelector('[data-discover-nav]')
        );
        if (!discoverReady) {
            return false;
        }
        if (root.dataset.discoverInit === 'true') {
            const hasCards = root.querySelector('[data-discover-home-mount] .kde-discover-card');
            return !!hasCards;
        }

        loadCatalog().then((catalog) => {
            if (!catalog) {
                return;
            }
            renderHome(root, catalog);
            renderInstalled(root, catalog);
            renderUpdates(root, catalog);
            renderConfig(root, catalog);
            renderAbout(root, catalog);
            switchView(root, catalog, state.view);
            bindCategoryNav(root, catalog);
            observeWindowChrome(root);
            syncUpdatesChrome(root, catalog);
            root.dataset.discoverInit = 'true';
        });

        bindUpdatesActions(root);
        return true;
    }

    function openView(viewId) {
        const run = () => {
            const root = findRoot();
            if (!root) {
                return false;
            }
            if (root.dataset.discoverInit !== 'true') {
                bindOnce();
            }
            loadCatalog().then((catalog) => {
                if (catalog) {
                    switchView(root, catalog, viewId);
                }
            });
            return true;
        };

        if (!run()) {
            let tries = 0;
            const timer = window.setInterval(() => {
                tries += 1;
                if (run() || tries > 40) {
                    window.clearInterval(timer);
                }
            }, 100);
        }
    }

    window.CapsuleDiscoverNeon = {
        openView,
    };

    window.initUpdateManagerApp = bindOnce;

    document.addEventListener('capsule:discover-open-view', (event) => {
        const viewId = event.detail && event.detail.view;
        if (viewId) {
            openView(viewId);
        }
    });
}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this));
