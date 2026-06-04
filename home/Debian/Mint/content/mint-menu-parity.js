/**
 * Parité menu / logithèque Mint VM (22.3) — surcharge locale du skin uniquement.
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
        MENU_SHORTCUTS.calculator = { dataLink: 'terminal' };
        MENU_SHORTCUTS['text-editor'] = { dataLink: 'text_editor' };
        MENU_SHORTCUTS['software-manager'] = { dataLink: 'update_manager' };
        MENU_SHORTCUTS['system-settings'] = { dataLink: 'themes' };
    }

    if (typeof MENU_APPS !== 'undefined' && MENU_APPS.length) {
        MENU_APPS.forEach(function patchApp(app) {
            if (app.name === 'Calculatrice') {
                app.dataLink = 'terminal';
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
                app.icon = panelIcon + 'libreoffice-writer.png';
            }
        });
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

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', function onReady() {
            patchMenuShortcutImages();
            document.addEventListener('capsule:window-opened', function onMenuOpen(event) {
                var detail = event.detail || {};
                if (detail.slotId === 'mainMenu') {
                    window.setTimeout(patchMenuShortcutImages, 50);
                }
            });
        });
    }
})();
