/**
 * Parité menu Cinnamon Mint — panneau panel (toggle logo, pas fenêtre WM).
 */
(function applyMintMenuParity() {
    'use strict';

    var panelIcon = '../../../usr/share/capsuleos/assets/images/vendors/mint/panel/';

    var shortcutIcons = {
        calculator: 'org.gnome.Calculator.png',
        agenda: 'org.gnome.Calendar.png',
        'text-editor': 'accessories-text-editor.png',
        'software-manager': 'mintinstall.png',
        'system-settings': 'preferences-desktop-theme.png',
    };

    if (typeof MENU_SHORTCUTS !== 'undefined') {
        MENU_SHORTCUTS.calculator = { dataLink: 'calculator' };
        MENU_SHORTCUTS['text-editor'] = { dataLink: 'text_editor' };
        MENU_SHORTCUTS['software-manager'] = { dataLink: 'mintinstall' };
        MENU_SHORTCUTS['system-settings'] = { dataLink: 'themes' };
    }

    var CS_PANEL_BY_NAME = {
        'Accessibilité': 'accessibility',
        'Actions': 'actions',
        'Administration du système': 'system-info',
        'Advanced Network Configuration': 'network',
        'Adaptateurs Bluetooth': 'bluetooth',
        'Affichage': 'display',
        'Applets': 'applets',
        'Applications lancées au démarrage': 'startup',
        'Applications par défaut': 'default',
        'Bureau': 'desktop',
        'Choix des polices': 'fonts',
        'Clavier': 'keyboard',
        'Clavier visuel': 'accessibility',
        'Comptes en ligne': 'online-accounts',
        'Préférences IBus': 'input-method',
        'Coins intelligents': 'hotcorner',
        'Couleur': 'color',
        'Date et heure': 'calendar',
        'Desklets': 'desklets',
        'Détails du compte': 'user',
        'Économiseur d\'écran': 'screensaver',
        'Économiseur d’écran': 'screensaver',
        'Effets': 'effects',
        'Empreintes digitales': 'fingerprints',
        'Espaces de travail': 'workspaces',
        'Extensions': 'extensions',
        'Fenêtre de connexion': 'login-window',
        'Fenêtres': 'windows',
        'Firewall Configuration': 'firewall',
        'Fonds d\'écran': 'backgrounds',
        'Fonds d’écran': 'backgrounds',
        'Fonts': 'fonts',
        'Général': 'general',
        'Gestes': 'gestures',
        'Gestion de l\'alimentation': 'power',
        'Gestion de l’alimentation': 'power',
        'Gestionnaire Bluetooth': 'bluetooth',
        'Langues': 'languages',
        'Méthode de saisie': 'input-method',
        'Mode nuit': 'nightlight',
        'Notifications': 'notifications',
        'Panneau': 'panel',
        'Paramètres du système': 'general',
        'Protection des renseignements personnels': 'privacy',
        'Réseau': 'network',
        'Son': 'sound',
        'Souris et pavé tactile': 'mouse',
        'Tablette graphique': 'wacom',
        'Thèmes': 'themes',
        'Thunderbolt': 'thunderbolt',
        'Utilisateurs et groupes': 'users'
    };

    if (typeof MENU_APPS !== 'undefined' && MENU_APPS.length) {
        MENU_APPS.forEach(function patchApp(app) {
            if (CS_PANEL_BY_NAME[app.name] && app.dataLink === 'themes' && !app.csPanel) {
                app.csPanel = CS_PANEL_BY_NAME[app.name];
            }
            if (app.name === 'Calculatrice') {
                app.dataLink = 'calculator';
                app.icon = panelIcon + 'org.gnome.Calculator.png';
            }
            if (app.name === 'Éditeur de texte') {
                app.dataLink = 'text_editor';
                app.icon = panelIcon + 'accessories-text-editor.png';
            }
            if (app.name === 'Logithèque') {
                app.dataLink = 'mintinstall';
                app.icon = panelIcon + 'mintinstall.png';
            }
            if (app.name === 'System Monitor' || app.name === 'Moniteur système') {
                app.dataLink = 'system_monitor';
                app.name = 'Moniteur système';
                app.icon = './assets/images/toolkits/gnome/apps/org.gnome.SystemMonitor.png';
            }
            if (app.name === 'Thèmes') {
                app.icon = panelIcon + 'preferences-desktop-theme.png';
            }
            if (app.name === 'LibreOffice Writer') {
                app.dataLink = 'librewriter';
                app.icon = panelIcon + 'libreoffice-writer.webp';
            }
            if (app.name === 'LibreOffice') {
                app.dataLink = 'libreoffice_startcenter';
            }
            if (app.name === 'LibreOffice Draw') {
                app.dataLink = 'libreoffice_draw';
            }
            if (app.name === 'LibreOffice Impress') {
                app.dataLink = 'libreoffice_impress';
            }
            if (app.name === 'LibreOffice Calc') {
                app.dataLink = 'librecalc';
                app.icon = './assets/images/toolkits/gnome/apps/libreoffice-calc';
            }
            if (app.name === 'Capture d\'écran') {
                app.dataLink = 'screenshot';
            }
            if (app.name === 'Dessin') {
                app.dataLink = 'drawing';
                app.icon = './assets/images/toolkits/cinnamon/apps/com.github.maoschanz.drawing.png';
            }
            if (app.name === 'Gestionnaire d\'archives') {
                app.dataLink = 'file_roller';
                app.icon = './assets/images/toolkits/cinnamon/apps/org.gnome.FileRoller.png';
            }
            if (app.name === 'Gestionnaire de pilotes') {
                app.dataLink = 'mintdrivers';
                app.icon = './assets/images/toolkits/gnome/apps/mintdrivers';
            }
            if (app.name === 'Analyseur d\'espace disque' || app.name === 'Disk Usage Analyzer') {
                app.dataLink = 'baobab';
                app.name = 'Analyseur d\'espace disque';
                app.icon = './assets/images/toolkits/gnome/apps/org.gnome.baobab';
            }
            if (app.name === 'Applications web' || app.name === 'Applications Web') {
                app.dataLink = 'webapp_manager';
                app.name = 'Applications Web';
                app.icon = './assets/images/toolkits/gnome/apps/webapp-manager';
            }
            if (app.name === 'Écran d\'accueil' || app.name === 'Écran d\'accueil Mint') {
                app.dataLink = 'mintwelcome';
                app.name = 'Écran d\'accueil Mint';
                app.icon = './assets/images/toolkits/gnome/apps/mintwelcome';
            }
            if (app.name === 'Hypnotix') {
                app.dataLink = 'hypnotix';
            }
            if (app.name === 'Notes') {
                app.dataLink = 'sticky';
            }
            if (app.name === 'Outil de sauvegarde') {
                app.dataLink = 'mintbackup';
            }
            if (app.name === 'Renommeur de fichiers' || app.name === 'Renommer fichiers') {
                app.dataLink = 'bulky';
                app.name = 'Renommer fichiers';
            }
            if (app.name === 'Messagerie Thunderbird') {
                app.dataLink = 'thunderbird';
            }
            if (app.name === 'Timeshift') {
                app.dataLink = 'timeshift';
            }
            if (app.name === 'Transmission') {
                app.dataLink = 'transmission';
            }
            if (app.name === 'Warpinator') {
                app.dataLink = 'warpinator';
            }
            if (app.name === 'Lecteur vidéo' || app.name === 'Celluloid') {
                app.dataLink = 'lecteur_multimedia';
                app.icon = './assets/images/toolkits/gnome/apps/io.github.celluloid_player.Celluloid';
            }
        });
        var hasScreenshot = false;
        var ai;
        for (ai = 0; ai < MENU_APPS.length; ai++) {
            if (MENU_APPS[ai].name === 'Capture d\'écran') {
                hasScreenshot = true;
                break;
            }
        }
        if (!hasScreenshot) {
            MENU_APPS.push({
                catId: 'access',
                icon: './assets/images/toolkits/cinnamon/apps/gnome-screenshot.png',
                name: 'Capture d\'écran',
                desc: 'Prenez une photo de l\'écran',
                dataLink: 'screenshot'
            });
        }
    }

    function patchMenuShortcutImages() {
        var menuRoot = document.getElementById('mainMenu');
        if (!menuRoot) {
            return;
        }
        Object.keys(shortcutIcons).forEach(function patchShortcut(id) {
            var link = menuRoot.querySelector('.menu-shortcut[data-shortcut-id="' + id + '"]');
            if (!link) {
                return;
            }
            var img = link.querySelector('img');
            if (img) {
                img.src = panelIcon + shortcutIcons[id];
            }
            if (id === 'text-editor' && !link.classList.contains('is-unavailable')) {
                link.removeAttribute('aria-disabled');
                link.classList.remove('is-unavailable');
                link.tabIndex = 0;
            }
        });
    }

    function bindMenuLauncherToggle() {
        var menuBtn = document.querySelector('footer nav a[target="windowElement"][data-link="mainMenu"]');
        var menuEl = document.getElementById('mainMenu');
        if (!menuBtn || !menuEl || menuBtn.dataset.mintMenuToggleBound === 'true') {
            return;
        }
        menuBtn.dataset.mintMenuToggleBound = 'true';
        menuBtn.addEventListener('click', function onMenuClick() {
            window.setTimeout(function afterShellOpen() {
                if (menuEl.style.display === 'none') {
                    return;
                }
                patchMenuShortcutImages();
                var searchInput = document.getElementById('menu-search');
                var firstApp = document.querySelector('#menu-app-list .menu-app-item[tabindex="0"]');
                if (searchInput) {
                    searchInput.focus();
                } else if (firstApp) {
                    firstApp.focus();
                }
            }, 80);
        });
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', function onReady() {
            patchMenuShortcutImages();
            bindMenuLauncherToggle();
            document.addEventListener('capsule:window-opened', function onMenuOpen(event) {
                var detail = event.detail || {};
                if (detail.slotId === 'mainMenu') {
                    window.setTimeout(patchMenuShortcutImages, 50);
                }
            });
        });
    }
})();
