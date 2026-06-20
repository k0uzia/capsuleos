/**
 * Navigation System Settings KDE — hub ↔ KCM multi-surfaces (v15).
 */
(function initKdeSystemsettingsNav(global) {
    'use strict';

    var PLASMA_BODY_IDS = new Set(['kde-neon', 'debian-kde', 'mx-kde', 'lxqt', 'opensuse']);

    var HUB_QUICK_TITLE = 'Paramétrage rapide — Configuration du système';
    var DEFAULT_THEMES_TITLE = 'Paramètres système';

    function isPlasma() {
        var id = global.document && global.document.body ? global.document.body.id : '';
        return PLASMA_BODY_IDS.has(id);
    }

    function themesSlotRoot() {
        if (!global.document) return null;
        return global.document.querySelector('.windowElement[data-link="themes"]');
    }

    function settingsDocument() {
        var slot = themesSlotRoot();
        if (!slot) return global.document;
        var iframe = slot.querySelector('iframe, #windowIframe, .windowIframe');
        if (!iframe) return global.document;
        try {
            return iframe.contentDocument || iframe.contentWindow.document;
        } catch (e) {
            return global.document;
        }
    }

    function rootEl() {
        var slot = themesSlotRoot();
        if (slot) {
            var inSlot = slot.querySelector('[data-kde-settings-root]');
            if (inSlot) return inSlot;
        }
        return settingsDocument().querySelector('[data-kde-settings-root]');
    }

    function hubEl(root) {
        return root ? root.querySelector('[data-kde-settings-surface="hub"]') : null;
    }

    function allKcmSurfaces(root) {
        return root ? root.querySelectorAll('[data-kde-settings-surface^="kcm-"]') : [];
    }

    function kcmEl(root, view) {
        if (!root) return null;
        return root.querySelector('[data-kde-settings-surface="' + view + '"]');
    }

    function updateWindowTitle() {
        var slot = themesSlotRoot();
        if (!slot) return;
        var titleEl = slot.querySelector('#windowTitle');
        if (!titleEl) return;
        var root = rootEl();
        var hubPanel = root ? root.dataset.activeKdePanel : '';
        var view = root ? root.dataset.kdeSettingsView : '';
        if (view === 'hub' && hubPanel === 'quick-settings') {
            titleEl.textContent = HUB_QUICK_TITLE;
        } else {
            titleEl.textContent = DEFAULT_THEMES_TITLE;
        }
    }

    function syncQuickThemeTiles() {
        var root = rootEl();
        if (!root) return;
        var storage = global.CapsuleThemeStorage || {};
        var bodyId = global.document && global.document.body ? global.document.body.id : 'kde-neon';
        var theme = typeof storage.readSavedTheme === 'function'
            ? storage.readSavedTheme(bodyId)
            : (global.document.documentElement.dataset.theme || 'light');
        root.querySelectorAll('[data-kde-quick-theme]:not([disabled])').forEach(function onTile(tile) {
            var option = tile.getAttribute('data-kde-theme-option')
                || tile.getAttribute('data-kde-quick-theme');
            var active = option === theme;
            tile.classList.toggle('is-active', active);
            tile.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function bindQuickThemeTiles(root) {
        if (!root) return;
        root.querySelectorAll('[data-kde-quick-theme]:not([disabled])').forEach(function wire(tile) {
            if (tile.dataset.kdeQuickThemeBound === 'true') return;
            tile.dataset.kdeQuickThemeBound = 'true';
            tile.addEventListener('click', function onClick() {
                var theme = tile.getAttribute('data-kde-theme-option')
                    || tile.getAttribute('data-kde-quick-theme');
                if (theme !== 'light' && theme !== 'dark') return;
                if (global.CapsuleKdeSettingsParity
                    && global.CapsuleKdeSettingsParity.EFFECT_HANDLERS
                    && typeof global.CapsuleKdeSettingsParity.EFFECT_HANDLERS['kde-global-theme'] === 'function') {
                    global.CapsuleKdeSettingsParity.EFFECT_HANDLERS['kde-global-theme'](theme);
                }
                root.querySelectorAll('[data-kde-quick-theme]').forEach(function onEntry(entry) {
                    var option = entry.getAttribute('data-kde-theme-option')
                        || entry.getAttribute('data-kde-quick-theme');
                    var active = option === theme;
                    entry.classList.toggle('is-active', active);
                    entry.setAttribute('aria-pressed', active ? 'true' : 'false');
                });
                root.querySelectorAll('[data-kde-theme-option]').forEach(function onEntry(entry) {
                    var active = entry.getAttribute('data-kde-theme-option') === theme;
                    entry.classList.toggle('is-active', active);
                    entry.setAttribute('aria-checked', active ? 'true' : 'false');
                });
            });
        });
    }

    function navigateQuickLink(target) {
        if (!target) return;
        if (target.indexOf('hub-') === 0) {
            var panelId = target.slice(4);
            setView('hub');
            setHubPanel(panelId);
            setNativeNav(panelId);
            updateWindowTitle();
            return;
        }
        if (target.indexOf('kcm-') === 0) {
            setView(target);
            updateWindowTitle();
        }
    }

    function setView(view) {
        var root = rootEl();
        if (!root) return;
        root.dataset.kdeSettingsView = view;
        var hub = hubEl(root);
        if (hub) hub.hidden = view !== 'hub';
        allKcmSurfaces(root).forEach(function onKcm(el) {
            el.hidden = el.getAttribute('data-kde-settings-surface') !== view;
        });
        updateWindowTitle();
    }

    function setHubPanel(panelId) {
        var root = rootEl();
        var hub = hubEl(root);
        if (!hub) return;
        hub.querySelectorAll('[data-kde-panel]').forEach(function onNav(btn) {
            var active = btn.getAttribute('data-kde-panel') === panelId && !btn.disabled;
            btn.classList.toggle('is-active', active);
            if (active) btn.setAttribute('aria-current', 'page');
            else btn.removeAttribute('aria-current');
        });
        hub.querySelectorAll('[data-kde-panel-content]').forEach(function onPanel(section) {
            var active = section.getAttribute('data-kde-panel-content') === panelId;
            section.classList.toggle('is-active', active);
            section.hidden = !active;
        });
        root.dataset.activeKdePanel = panelId;
        updateWindowTitle();
    }

    function setNativeNav(navId) {
        var root = rootEl();
        var hub = hubEl(root);
        if (!hub) return;
        hub.querySelectorAll('[data-kde-native-nav]').forEach(function onNav(btn) {
            var active = btn.getAttribute('data-kde-native-nav') === navId;
            btn.classList.toggle('is-active', active);
            if (active) btn.setAttribute('aria-current', 'page');
            else btn.removeAttribute('aria-current');
        });
    }

    function prepareShot(shotId) {
        switch (shotId) {
            case 'kcm-display-config':
                setView('kcm-display');
                setKcmPanel(kcmEl(rootEl(), 'kcm-display'), 'display-config');
                break;
            case 'kcm-colors':
            case 'colors-panel':
                setView('kcm-colors');
                break;
            case 'kcm-keys':
            case 'shortcuts-panel':
                setView('kcm-keys');
                break;
            case 'kcm-lookandfeel':
            case 'appearance-kcm':
            case 'appearance-panel':
                setView('kcm-lookandfeel');
                break;
            case 'hub-sidebar':
                setView('hub');
                setHubPanel('quick-settings');
                setNativeNav('quick-settings');
                break;
            case 'accessibility-panel':
                setView('kcm-access');
                break;
            case 'desktop-panel':
                setView('kcm-plasma-style');
                break;
            case 'workspace-panel':
                setView('hub');
                setHubPanel('workspace');
                setNativeNav('workspace');
                break;
            case 'notifications-panel':
                setView('hub');
                setHubPanel('notifications');
                setNativeNav('notifications');
                break;
            case 'applications-panel':
                setView('hub');
                setHubPanel('applications');
                setNativeNav('applications');
                break;
            case 'about-panel':
                setView('hub');
                setHubPanel('about');
                setNativeNav('about');
                break;
            default:
                setView('hub');
                setHubPanel('quick-settings');
                setNativeNav('quick-settings');
        }
        syncQuickThemeTiles();
        updateWindowTitle();
    }

    function bindKcmSubnav(root) {
        if (!root) return;
        root.querySelectorAll('[data-kde-kcm-link]:not([disabled])').forEach(function wire(btn) {
            if (btn.dataset.kdeNavBound === 'true') return;
            btn.dataset.kdeNavBound = 'true';
            btn.addEventListener('click', function onClick() {
                var target = btn.getAttribute('data-kde-kcm-link');
                if (target) setView(target);
            });
        });
    }

    function setKcmPanel(kcmRoot, panelId) {
        if (!kcmRoot) return;
        kcmRoot.querySelectorAll('[data-kde-panel]').forEach(function onNav(btn) {
            var active = btn.getAttribute('data-kde-panel') === panelId && !btn.disabled;
            btn.classList.toggle('is-active', active);
            if (active) btn.setAttribute('aria-current', 'page');
            else btn.removeAttribute('aria-current');
        });
        kcmRoot.querySelectorAll('[data-kde-panel-content]').forEach(function onPanel(section) {
            var active = section.getAttribute('data-kde-panel-content') === panelId;
            section.classList.toggle('is-active', active);
            section.hidden = !active;
        });
    }

    function bindNavigation(root) {
        if (!root || !isPlasma()) return;
        var hub = hubEl(root);
        if (hub) {
            hub.querySelectorAll(
                '[data-kde-panel]:not([disabled]), .kde-systemsettings__nav--native [data-kde-open-kcm]:not([disabled])',
            ).forEach(function wire(btn) {
                if (btn.dataset.kdeNavBound === 'true') return;
                btn.dataset.kdeNavBound = 'true';
                btn.addEventListener('click', function onClick() {
                    var kcm = btn.getAttribute('data-kde-open-kcm');
                    if (kcm) {
                        setView(kcm);
                        return;
                    }
                    var panelId = btn.getAttribute('data-kde-panel');
                    setHubPanel(panelId);
                    setNativeNav(btn.getAttribute('data-kde-native-nav') || panelId);
                    setView('hub');
                });
            });
            hub.querySelectorAll('[data-kde-quick-link]:not([disabled])').forEach(function wire(btn) {
                if (btn.dataset.kdeNavBound === 'true') return;
                btn.dataset.kdeNavBound = 'true';
                btn.addEventListener('click', function onClick() {
                    navigateQuickLink(btn.getAttribute('data-kde-quick-link'));
                });
            });
        }
        allKcmSurfaces(root).forEach(function bindKcm(kcm) {
            kcm.querySelectorAll('[data-kde-panel]:not([disabled])').forEach(function wire(btn) {
                if (btn.dataset.kdeNavBound === 'true') return;
                btn.dataset.kdeNavBound = 'true';
                btn.addEventListener('click', function onClick() {
                    setKcmPanel(kcm, btn.getAttribute('data-kde-panel'));
                });
            });
            var back = kcm.querySelector('.kde-systemsettings__back');
            if (back && back.dataset.kdeNavBound !== 'true') {
                back.dataset.kdeNavBound = 'true';
                back.addEventListener('click', function onBack() {
                    setView('hub');
                    setHubPanel(root.dataset.activeKdePanel || 'appearance');
                });
            }
        });
        bindKcmSubnav(root);
        bindQuickThemeTiles(root);
        syncQuickThemeTiles();
        if (global.CapsuleKdeSettingsParity && typeof global.CapsuleKdeSettingsParity.bindControls === 'function') {
            global.CapsuleKdeSettingsParity.bindControls(root);
        }
    }

    function init() {
        if (!isPlasma()) return;
        var root = rootEl();
        if (!root) return;
        if (!root.dataset.kdeSettingsView) {
            root.dataset.kdeSettingsView = 'hub';
        }
        setView(root.dataset.kdeSettingsView);
        if (root.dataset.kdeSettingsView === 'hub') {
            setHubPanel(root.dataset.activeKdePanel || 'quick-settings');
            setNativeNav(root.dataset.activeKdePanel || 'quick-settings');
        }
        bindNavigation(root);
        updateWindowTitle();
    }

    global.CapsuleKdeSettingsNav = {
        setView: setView,
        setHubPanel: setHubPanel,
        prepareShot: prepareShot,
        bindNavigation: bindNavigation,
        updateWindowTitle: updateWindowTitle,
    };

    global.document.addEventListener('capsule:slot-injected', function onSlot(ev) {
        var detail = ev.detail || {};
        if (detail.slotId !== 'themes') return;
        setTimeout(function retryBind() {
            var root = rootEl();
            var container = detail.container || themesSlotRoot();
            if (root) {
                bindNavigation(root);
                if (!root.dataset.kdeSettingsView) {
                    root.dataset.kdeSettingsView = 'hub';
                }
                setView(root.dataset.kdeSettingsView);
                if (root.dataset.kdeSettingsView === 'hub') {
                    setHubPanel(root.dataset.activeKdePanel || 'quick-settings');
                    setNativeNav(root.dataset.activeKdePanel || 'quick-settings');
                }
                updateWindowTitle();
            }
            if (typeof global.initKdeSettingsApp === 'function') {
                global.initKdeSettingsApp(container);
            }
        }, 50);
    });

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
}(typeof window !== 'undefined' ? window : globalThis));
