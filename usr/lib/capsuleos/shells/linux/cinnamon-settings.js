/**
 * Paramètres du système — cinnamon-settings 6.6 sur Mint.
 */
(function initCinnamonSettingsModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Paramètres du système';
    var ICON_BASE = './assets/icons/cinnamon/cs/';

    var PANELS = [
        { id: 'general', label: 'Général', icon: 'cs-general', keywords: 'general compositing menu' },
        { id: 'themes', label: 'Thèmes', icon: 'cs-themes', keywords: 'themes gtk icons cursor appearance' },
        { id: 'backgrounds', label: 'Arrière-plans', icon: 'cs-backgrounds', keywords: 'background wallpaper fond' },
        { id: 'effects', label: 'Effets', icon: 'cs-desktop-effects', keywords: 'effects animations' },
        { id: 'extensions', label: 'Extensions', icon: 'cs-extensions', keywords: 'extensions spices' },
        { id: 'applets', label: 'Applets', icon: 'cs-applets', keywords: 'applets panel' },
        { id: 'desklets', label: 'Desklets', icon: 'cs-desklets', keywords: 'desklets desktop' },
        { id: 'windows', label: 'Fenêtres', icon: 'cs-windows', keywords: 'windows titlebar focus' },
        { id: 'workspaces', label: 'Espaces de travail', icon: 'cs-workspaces', keywords: 'workspaces virtual' },
        { id: 'hotcorner', label: 'Coins actifs', icon: 'cs-overview', keywords: 'hot corners overview' },
        { id: 'gestures', label: 'Gestes', icon: 'cs-gestures', keywords: 'gestures touchpad' },
        { id: 'panel', label: 'Barre des tâches', icon: 'cs-panel', keywords: 'panel taskbar' },
        { id: 'desktop', label: 'Bureau', icon: 'cs-desktop', keywords: 'desktop icons' },
        { id: 'screensaver', label: 'Écran de veille', icon: 'cs-screensaver', keywords: 'screensaver lock' },
        { id: 'fonts', label: 'Polices', icon: 'cs-fonts', keywords: 'fonts text' },
        { id: 'keyboard', label: 'Clavier', icon: 'cs-keyboard', keywords: 'keyboard layout shortcuts' },
        { id: 'mouse', label: 'Souris et pavé tactile', icon: 'cs-mouse', keywords: 'mouse touchpad pointer' },
        { id: 'accessibility', label: 'Accessibilité', icon: 'cs-universal-access', keywords: 'accessibility zoom contrast' },
        { id: 'sound', label: 'Son', icon: 'cs-sound', keywords: 'sound volume audio' },
        { id: 'notifications', label: 'Notifications', icon: 'cs-notifications', keywords: 'notifications alerts' },
        { id: 'privacy', label: 'Confidentialité', icon: 'cs-privacy', keywords: 'privacy history' },
        { id: 'power', label: 'Gestion de l\'alimentation', icon: 'cs-power', keywords: 'power suspend battery' },
        { id: 'startup', label: 'Applications au démarrage', icon: 'cs-startup-programs', keywords: 'startup autostart' },
        { id: 'default', label: 'Applications par défaut', icon: 'cs-default-applications', keywords: 'default applications browser mail' },
        { id: 'calendar', label: 'Date et heure', icon: 'cs-date-time', keywords: 'calendar clock timezone' },
        { id: 'user', label: 'Détails du compte', icon: 'cs-user', keywords: 'account user profile' },
        { id: 'users', label: 'Utilisateurs et groupes', icon: 'system-users', keywords: 'users groups admin' },
        { id: 'actions', label: 'Actions', icon: 'cs-actions', keywords: 'actions shortcuts' },
        { id: 'nightlight', label: 'Éclairage nocturne', icon: 'cs-nightlight', keywords: 'night light blue' },
        { id: 'thunderbolt', label: 'Thunderbolt', icon: 'cs-thunderbolt', keywords: 'thunderbolt usb' },
        { id: 'color', label: 'Couleur', icon: 'cs-general', keywords: 'color couleur' },
        { id: 'display', label: 'Affichage', icon: 'preferences-desktop', keywords: 'display monitor resolution' },
        { id: 'network', label: 'Réseau', icon: 'cs-panel', keywords: 'network wifi ethernet' },
        { id: 'wacom', label: 'Tablette graphique', icon: 'cs-mouse', keywords: 'wacom tablet stylus' },
        { id: 'bluetooth', label: 'Bluetooth', icon: 'cs-general', keywords: 'bluetooth devices' },
        { id: 'firewall', label: 'Pare-feu', icon: 'cs-privacy', keywords: 'firewall gufw' },
        { id: 'languages', label: 'Langues', icon: 'cs-language', keywords: 'languages locale' },
        { id: 'input-method', label: 'Méthode de saisie', icon: 'cs-input-method', keywords: 'input method ibus' },
        { id: 'fingerprints', label: 'Empreintes digitales', icon: 'cs-user', keywords: 'fingerprint fingwit' },
        { id: 'login-window', label: 'Fenêtre de connexion', icon: 'cs-login', keywords: 'login lightdm' },
        { id: 'software-sources', label: 'Sources de logiciels', icon: 'cs-sources', keywords: 'software sources mintsources' },
        { id: 'system-info', label: 'Informations système', icon: 'cs-general', keywords: 'system information mintreport' },
        { id: 'printers', label: 'Imprimantes', icon: 'cs-general', keywords: 'printers print' },
        { id: 'passwords', label: 'Mots de passe et clés', icon: 'cs-privacy', keywords: 'passwords seahorse keys' },
        { id: 'online-accounts', label: 'Comptes en ligne', icon: 'cs-user', keywords: 'online accounts google microsoft' }
    ];

    var GENERIC_ROWS = {
        effects: ['Activer les effets de bureau', 'Effets des fenêtres', 'Animation des menus'],
        extensions: ['Extensions installées', 'Gérer les extensions'],
        applets: ['Applets installées', 'Télécharger des applets'],
        desklets: ['Desklets installés', 'Télécharger des desklets'],
        windows: ['Focus au survol', 'Placement automatique', 'Boutons de la barre de titre'],
        workspaces: ['Nombre d\'espaces de travail', 'Afficher les espaces dans le panneau'],
        hotcorner: ['Coin supérieur gauche', 'Coin supérieur droit', 'Coin inférieur gauche', 'Coin inférieur droit'],
        gestures: ['Gestes du pavé tactile', 'Gestes à trois doigts'],
        desktop: ['Icônes sur le bureau', 'Disposition des icônes'],
        screensaver: ['Délai avant écran de veille', 'Verrouiller à la reprise'],
        fonts: ['Police de l\'interface', 'Police des documents', 'Résolution de la police'],
        keyboard: ['Dispositions de clavier', 'Raccourcis clavier', 'Saisie'],
        mouse: ['Vitesse du pointeur', 'Clic du milieu', 'Défilement naturel'],
        accessibility: ['Loupe', 'Contraste élevé', 'Lecteur d\'écran'],
        sound: ['Volume de sortie', 'Volume d\'entrée', 'Périphériques de sortie'],
        notifications: ['Notifications du bureau', 'Ne pas déranger'],
        privacy: ['Historique récent', 'Effacer l\'historique'],
        power: ['Écran éteint après', 'Mise en veille après', 'Action bouton d\'alimentation'],
        startup: ['Applications au démarrage'],
        default: ['Navigateur Web', 'Client de messagerie', 'Terminal'],
        calendar: ['Fuseau horaire', 'Format de l\'heure', 'Format de la date'],
        user: ['Nom affiché', 'Mot de passe', 'Image du compte'],
        users: ['Utilisateurs', 'Groupes'],
        actions: ['Actions disponibles', 'Raccourcis personnalisés'],
        nightlight: ['Activer l\'éclairage nocturne', 'Planification'],
        thunderbolt: ['Appareils Thunderbolt', 'Autorisation de connexion'],
        color: ['Profil couleur', 'Calibration'],
        display: ['Résolution', 'Fréquence de rafraîchissement', 'Mise en miroir'],
        network: ['Connexion filaire', 'Wi-Fi', 'Proxy'],
        wacom: ['Tablette graphique', 'Stylet', 'Zone active'],
        bluetooth: ['Adaptateurs Bluetooth', 'Appareils appairés'],
        firewall: ['État du pare-feu', 'Règles entrantes'],
        languages: ['Langue du système', 'Formats régionaux'],
        'input-method': ['Méthode de saisie', 'Clavier IBus'],
        fingerprints: ['Enregistrer une empreinte', 'Déverrouillage'],
        'login-window': ['Thème de connexion', 'Utilisateur automatique'],
        'software-sources': ['Dépôts officiels', 'PPA'],
        'system-info': ['Matériel', 'Système d\'exploitation', 'Rapport système'],
        printers: ['Imprimantes configurées', 'Ajouter une imprimante'],
        passwords: ['Mots de passe', 'Certificats', 'Clés SSH'],
        'online-accounts': ['Google', 'Microsoft', 'Ajouter un compte']
    };

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'themes') {
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

    var THEMES_PANEL_HTML = ''
        + '<main id="themesApp" class="themes-app" aria-label="Thèmes">'
        + '<section class="themes-app__section">'
        + '<h2 class="themes-app__label">Style</h2>'
        + '<div class="themes-app__control">'
        + '<button type="button" class="themes-app__select" aria-haspopup="listbox" aria-expanded="false">'
        + '<span>Mint-Y-Dark-Aqua</span>'
        + '<span class="themes-app__caret" aria-hidden="true">▼</span>'
        + '</button></div></section>'
        + '<section class="themes-app__section themes-app__section--vm-labels">'
        + '<h2 class="themes-app__label">Thème GTK</h2>'
        + '<p class="themes-app__vm-value" data-themes-gtk>Mint-Y-Aqua</p></section>'
        + '<section class="themes-app__section themes-app__section--vm-labels">'
        + '<h2 class="themes-app__label">Thème des icônes</h2>'
        + '<p class="themes-app__vm-value" data-themes-icons>Mint-Y-Sand</p></section>'
        + '<section class="themes-app__section">'
        + '<h2 class="themes-app__label">Apparence</h2>'
        + '<div class="themes-app__cards" role="radiogroup" aria-label="Choix du thème">'
        + '<button type="button" class="themes-card" data-theme-option="dark" role="radio" aria-checked="true">'
        + '<span class="themes-card__preview themes-card__preview--dark" aria-hidden="true"></span>'
        + '<span class="themes-card__title">Sombre</span></button>'
        + '<button type="button" class="themes-card" data-theme-option="light" role="radio" aria-checked="false">'
        + '<span class="themes-card__preview themes-card__preview--light" aria-hidden="true"></span>'
        + '<span class="themes-card__title">Clair</span></button></div>'
        + '<p class="themes-app__help" data-themes-help>Le thème sombre est actif.</p></section>'
        + '<section class="themes-app__section themes-app__section--backgrounds" data-mint-wallpaper-section>'
        + '<h2 class="themes-app__label">Arrière-plan</h2>'
        + '<div class="themes-wallpaper-grid" data-wallpaper-grid role="list" aria-label="Fonds d\'écran"></div>'
        + '</section></main>';

    function ensureThemesPanel(panelsRoot) {
        var existing = panelsRoot.querySelector('[data-cs-panel="themes"]');
        if (existing) {
            return existing;
        }
        var section = global.document.createElement('section');
        section.className = 'cs-panel cs-panel--themes';
        section.setAttribute('data-cs-panel', 'themes');
        section.setAttribute('hidden', 'hidden');
        section.setAttribute('aria-label', 'Thèmes');
        section.innerHTML = THEMES_PANEL_HTML;
        panelsRoot.appendChild(section);
        return section;
    }

    function ensureGenericPanel(panelsRoot, panelId, label) {
        var existing = panelsRoot.querySelector('[data-cs-panel="' + panelId + '"]');
        if (existing) {
            return existing;
        }
        var rows = GENERIC_ROWS[panelId] || ['Options ' + label];
        var section = global.document.createElement('section');
        section.className = 'cs-panel';
        section.setAttribute('data-cs-panel', panelId);
        section.setAttribute('hidden', 'hidden');
        section.setAttribute('aria-label', label);
        var ri;
        for (ri = 0; ri < rows.length; ri += 1) {
            var row = global.document.createElement('div');
            row.className = 'cs-row';
            var span = global.document.createElement('span');
            span.className = 'cs-row__label';
            span.textContent = rows[ri];
            var sw = global.document.createElement('button');
            sw.type = 'button';
            sw.className = 'cs-switch' + (ri === 0 ? ' is-on' : '');
            sw.setAttribute('role', 'switch');
            sw.setAttribute('aria-checked', ri === 0 ? 'true' : 'false');
            sw.setAttribute('data-cs-switch', panelId + '-' + ri);
            row.appendChild(span);
            row.appendChild(sw);
            section.appendChild(row);
        }
        panelsRoot.appendChild(section);
        return section;
    }

    function buildSidebar(root, panelsRoot) {
        var sidebar = root.querySelector('#cs-sidebar');
        if (!sidebar || sidebar.dataset.csBuilt === 'true') {
            return;
        }
        var pi;
        for (pi = 0; pi < PANELS.length; pi += 1) {
            var panel = PANELS[pi];
            if (panel.id === 'themes') {
                ensureThemesPanel(panelsRoot);
            } else {
                ensureGenericPanel(panelsRoot, panel.id, panel.label);
            }
            var btn = global.document.createElement('button');
            btn.type = 'button';
            btn.className = 'cs-app__nav' + (panel.id === 'general' ? ' is-active' : '');
            btn.setAttribute('data-cs-nav', panel.id);
            btn.setAttribute('title', panel.label);
            btn.setAttribute('aria-label', panel.label);
            var img = global.document.createElement('img');
            img.className = 'cs-app__nav-icon';
            var iconPath = ICON_BASE + panel.icon + '.png';
            img.src = typeof global.resolveCapsuleAssetUrl === 'function'
                ? global.resolveCapsuleAssetUrl(iconPath)
                : (typeof global.resolveCapsuleResourceUrl === 'function'
                    ? global.resolveCapsuleResourceUrl(iconPath)
                    : iconPath);
            img.alt = '';
            btn.appendChild(img);
            sidebar.appendChild(btn);
        }
        sidebar.dataset.csBuilt = 'true';
    }

    function activatePanel(root, panelId) {
        var panelsRoot = root.querySelector('#cs-panels');
        var titleEl = root.querySelector('#cs-panel-title');
        var label = panelId;
        var pi;
        for (pi = 0; pi < PANELS.length; pi += 1) {
            if (PANELS[pi].id === panelId) {
                label = PANELS[pi].label;
                break;
            }
        }
        if (titleEl) {
            titleEl.textContent = label;
        }
        panelsRoot.querySelectorAll('[data-cs-panel]').forEach(function (section) {
            if (section.getAttribute('data-cs-panel') === panelId) {
                section.classList.add('is-active');
                section.removeAttribute('hidden');
            } else {
                section.classList.remove('is-active');
                section.setAttribute('hidden', 'hidden');
            }
        });
        root.querySelectorAll('[data-cs-nav]').forEach(function (btn) {
            if (btn.getAttribute('data-cs-nav') === panelId) {
                btn.classList.add('is-active');
            } else {
                btn.classList.remove('is-active');
            }
        });
        if (panelId === 'themes' && typeof global.initThemesApp === 'function') {
            global.initThemesApp();
        }
        if (panelId === 'backgrounds' && typeof global.buildWallpaperGrid === 'function') {
            global.buildWallpaperGrid(root);
        }
        root.dataset.csActivePanel = panelId;
    }

    function filterPanels(root, query) {
        var q = (query || '').trim().toLowerCase();
        var firstMatch = null;
        var pi;
        for (pi = 0; pi < PANELS.length; pi += 1) {
            var panel = PANELS[pi];
            var hay = (panel.label + ' ' + panel.keywords).toLowerCase();
            var match = !q || hay.indexOf(q) !== -1;
            var btn = root.querySelector('[data-cs-nav="' + panel.id + '"]');
            if (btn) {
                btn.hidden = !match;
            }
            if (match && !firstMatch) {
                firstMatch = panel.id;
            }
        }
        if (q && firstMatch) {
            activatePanel(root, firstMatch);
        }
    }

    function bindSwitches(root) {
        root.querySelectorAll('.cs-switch').forEach(function (toggle) {
            if (toggle.dataset.csBound === 'true') {
                return;
            }
            toggle.dataset.csBound = 'true';
            toggle.addEventListener('click', function () {
                var isOn = toggle.getAttribute('aria-checked') === 'true';
                var nextOn = !isOn;
                toggle.setAttribute('aria-checked', nextOn ? 'true' : 'false');
                toggle.classList.toggle('is-on', nextOn);
            });
        });
    }

    function bindNavigation(root) {
        root.querySelectorAll('[data-cs-nav]').forEach(function (btn) {
            if (btn.dataset.csNavBound === 'true') {
                return;
            }
            btn.dataset.csNavBound = 'true';
            btn.addEventListener('click', function () {
                activatePanel(root, btn.getAttribute('data-cs-nav'));
            });
        });
        var search = root.querySelector('#cs-search');
        if (search && search.dataset.csSearchBound !== 'true') {
            search.dataset.csSearchBound = 'true';
            search.addEventListener('input', function () {
                filterPanels(root, search.value);
            });
        }
    }

    function initCinnamonSettingsApp(container) {
        var root = container ? container.querySelector('#cinnamonSettingsApp') : global.document.getElementById('cinnamonSettingsApp');
        if (!root) {
            return;
        }
        var panelsRoot = root.querySelector('#cs-panels');
        var winEl = getWindowEl(root);
        syncWindowTitle(winEl);
        buildSidebar(root, panelsRoot);
        bindNavigation(root);
        bindSwitches(root);
        var startPanel = global.CAPSULE_CS_PENDING_PANEL || root.dataset.csActivePanel || 'general';
        if (global.CAPSULE_CS_PENDING_PANEL) {
            delete global.CAPSULE_CS_PENDING_PANEL;
        }
        activatePanel(root, startPanel);
        root.dataset.cinnamonSettingsInit = 'true';
    }

    global.initCinnamonSettingsApp = initCinnamonSettingsApp;

    global.document.addEventListener('capsule:window-opened', function (event) {
        if (!event.detail || event.detail.slotId !== 'themes') {
            return;
        }
        if (!global.document.getElementById('cinnamonSettingsApp')) {
            return;
        }
        global.setTimeout(function () {
            initCinnamonSettingsApp(event.detail.container);
        }, 30);
    });
}(typeof window !== 'undefined' ? window : globalThis));
