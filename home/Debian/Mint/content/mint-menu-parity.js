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
        MENU_SHORTCUTS['software-manager'] = { dataLink: 'update_manager' };
        MENU_SHORTCUTS['system-settings'] = { dataLink: 'themes' };
    }

    if (typeof MENU_APPS !== 'undefined' && MENU_APPS.length) {
        MENU_APPS.forEach(function patchApp(app) {
            if (app.name === 'Calculatrice') {
                app.dataLink = 'calculator';
                app.icon = panelIcon + 'org.gnome.Calculator.png';
            }
            if (app.name === 'Éditeur de texte') {
                app.dataLink = 'text_editor';
                app.icon = panelIcon + 'accessories-text-editor.png';
            }
            if (app.name === 'Logithèque') {
                app.dataLink = 'update_manager';
                app.icon = panelIcon + 'mintinstall.png';
            }
            if (app.name === 'Thèmes') {
                app.icon = panelIcon + 'preferences-desktop-theme.png';
            }
            if (app.name === 'LibreOffice Writer') {
                app.icon = panelIcon + 'libreoffice-writer.webp';
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
