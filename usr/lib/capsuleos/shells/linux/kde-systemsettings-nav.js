/**
 * Navigation System Settings KDE — layouts VM par module (v20).
 */
(function initKdeSystemsettingsNav(global) {
    'use strict';

    var PLASMA_BODY_IDS = new Set(['kde-neon', 'debian-kde', 'mx-kde', 'lxqt', 'opensuse']);

    var HUB_QUICK_TITLE = 'Paramétrage rapide — Configuration du système';
    var DEFAULT_THEMES_TITLE = 'Paramètres système';

    /** KCM rattachés à une entrée hub (data-kde-panel), ex. kcm-themes → appearance */
    var KCM_HUB_PANEL = {
        'kcm-applications': 'applications',
        'kcm-themes': 'appearance',
        'kcm-display': 'display-config',
        'kcm-access': 'accessibility',
        'kcm-disks-devices': 'disks-devices',
        'kcm-network': 'network-settings',
        'kcm-windowmanagement': 'window-management',
        'kcm-session': 'session-settings',
    };

    /** Alias legacy (quick-links, data-kde-kcm-link) → panneau hub-subnav */
    var THEMES_KCM_ALIASES = {
        'kcm-lookandfeel': 'lookandfeel',
        'kcm-colors': 'colors',
        'kcm-style': 'style',
        'kcm-plasma-style': 'plasma-style',
        'kcm-icons': 'icons',
    };

    var KEYBOARD_KCM_ALIASES = {
        'kcm-keys': 'shortcuts',
    };

    /**
     * Layout navigation VM (captures apps-visual/themes/*-vm.png) :
     * - hub-panel      : aside hub + panneau hub (workspace, notifications, about…)
     * - kcm-flat       : aside hub (highlight) + contenu KCM (son, fond d'écran…)
     * - subnav-replace : sous-nav module remplace l'aside hub (chaîne apparence)
     * - hub-subnav     : aside hub + 2e colonne sous-nav + contenu
     */
    var SUBNAV_REPLACE_KCMS = {};

    var HUB_SUBNAV_KCMS = {
        'kcm-access': true,
        'kcm-applications': true,
        'kcm-display': true,
        'kcm-disks-devices': true,
        'kcm-keyboard': true,
        'kcm-network': true,
        'kcm-session': true,
        'kcm-themes': true,
        'kcm-windowmanagement': true,
    };

    function resolveKcmAlias(target) {
        if (THEMES_KCM_ALIASES[target]) {
            return { view: 'kcm-themes', panel: THEMES_KCM_ALIASES[target] };
        }
        if (KEYBOARD_KCM_ALIASES[target]) {
            return { view: 'kcm-keyboard', panel: KEYBOARD_KCM_ALIASES[target] };
        }
        return null;
    }

    function openKcmAlias(target) {
        var alias = resolveKcmAlias(target);
        if (!alias) return false;
        setView(alias.view);
        setKcmPanel(kcmEl(rootEl(), alias.view), alias.panel);
        updateWindowTitle();
        return true;
    }

    function resolveNavLayout(view) {
        if (view === 'hub') return 'hub-panel';
        if (HUB_SUBNAV_KCMS[view]) return 'hub-subnav';
        if (SUBNAV_REPLACE_KCMS[view]) return 'subnav-replace';
        var kcm = kcmEl(rootEl(), view);
        if (kcm && kcmHasSubnav(kcm)) return 'subnav-replace';
        return 'kcm-flat';
    }

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
            if (openKcmAlias(target)) return;
            setView(target);
            updateWindowTitle();
        }
    }

    var mountedKcmSidebar = null;

    function kcmHasSubnav(kcmRoot) {
        if (!kcmRoot) return false;
        var nav = kcmRoot.querySelector('.kde-systemsettings__nav--kcm');
        return !!(nav && nav.querySelector('.kde-systemsettings__navitem:not([disabled])'));
    }

    function unmountKcmSidebar() {
        if (!mountedKcmSidebar) return;
        var root = rootEl();
        var hub = hubEl(root);
        var shell = hub ? hub.querySelector('[data-kde-sidebar-kcm]') : null;
        var sidebar = shell ? shell.querySelector('.kde-systemsettings__sidebar--kcm') : null;
        if (sidebar && mountedKcmSidebar.parent) {
            mountedKcmSidebar.parent.insertBefore(sidebar, mountedKcmSidebar.nextSibling);
        }
        if (shell) shell.hidden = true;
        mountedKcmSidebar = null;
    }

    function mountKcmSidebar(view) {
        unmountKcmSidebar();
        var root = rootEl();
        var hub = hubEl(root);
        var kcm = kcmEl(root, view);
        if (!hub || !kcm || !kcmHasSubnav(kcm)) return false;
        var sidebar = kcm.querySelector('.kde-systemsettings__sidebar--kcm');
        var shell = hub.querySelector('[data-kde-sidebar-kcm]');
        if (!sidebar || !shell) return false;
        mountedKcmSidebar = {
            view: view,
            parent: sidebar.parentElement,
            nextSibling: sidebar.nextSibling,
        };
        shell.appendChild(sidebar);
        shell.hidden = false;
        return true;
    }

    function syncAsideMode(view) {
        var root = rootEl();
        var hub = hubEl(root);
        if (!root || !hub) return;
        var layout = resolveNavLayout(view);
        var hubChrome = hub.querySelector('[data-kde-sidebar-hub]');
        root.dataset.kdeNavLayout = layout;
        root.classList.toggle('kde-settings-layout--hub-subnav', layout === 'hub-subnav');
        root.classList.toggle('kde-settings-layout--subnav-replace', layout === 'subnav-replace');
        unmountKcmSidebar();
        if (layout === 'subnav-replace' && mountKcmSidebar(view)) {
            if (hubChrome) hubChrome.hidden = true;
            root.dataset.kdeSidebarMode = 'kcm-subnav';
            return;
        }
        if (hubChrome) hubChrome.hidden = false;
        root.dataset.kdeSidebarMode = layout === 'hub-panel' ? 'hub' : 'hub-kcm';
    }

    function syncHubSidebarHighlight(view) {
        var root = rootEl();
        var hub = hubEl(root);
        if (!root || !hub) return;
        var activePanel = root.dataset.activeKdePanel || 'quick-settings';
        hub.querySelectorAll('.kde-systemsettings__nav--native .kde-systemsettings__navitem').forEach(function onBtn(btn) {
            if (btn.disabled) {
                btn.classList.remove('is-active');
                btn.removeAttribute('aria-current');
                return;
            }
            var openKcm = btn.getAttribute('data-kde-open-kcm');
            var panel = btn.getAttribute('data-kde-panel');
            var active = false;
            if (view === 'hub') {
                active = panel === activePanel;
            } else if (openKcm === view) {
                active = true;
            } else if (panel && KCM_HUB_PANEL[view] === panel) {
                active = true;
            }
            btn.classList.toggle('is-active', active);
            if (active) btn.setAttribute('aria-current', 'page');
            else btn.removeAttribute('aria-current');
        });
    }

    function setView(view) {
        var root = rootEl();
        if (!root) return;
        root.dataset.kdeSettingsView = view;
        delete root.dataset.kdeCaptureParity;
        var isHub = view === 'hub';
        root.classList.toggle('kde-settings-view--hub', isHub);
        root.classList.toggle('kde-settings-view--kcm', !isHub);
        var hub = hubEl(root);
        if (hub) hub.hidden = false;
        allKcmSurfaces(root).forEach(function onKcm(el) {
            el.hidden = el.getAttribute('data-kde-settings-surface') !== view;
        });
        syncAsideMode(view);
        if (root.dataset.kdeNavLayout !== 'subnav-replace') {
            syncHubSidebarHighlight(view);
        }
        updateWindowTitle();
    }

    function setHubPanel(panelId) {
        var root = rootEl();
        var hub = hubEl(root);
        if (!hub) return;
        hub.querySelectorAll('[data-kde-panel-content]').forEach(function onPanel(section) {
            var active = section.getAttribute('data-kde-panel-content') === panelId;
            section.classList.toggle('is-active', active);
            section.hidden = !active;
        });
        root.dataset.activeKdePanel = panelId;
        syncHubSidebarHighlight('hub');
        updateWindowTitle();
    }

    function setNativeNav(navId) {
        var root = rootEl();
        if (!root) return;
        root.dataset.activeKdePanel = navId;
        syncHubSidebarHighlight('hub');
    }

    function setCaptureParity(mode) {
        var root = rootEl();
        if (!root) return;
        if (mode) root.dataset.kdeCaptureParity = mode;
        else delete root.dataset.kdeCaptureParity;
    }

    function stripColorsSchemeActiveForCapture(kcmRoot) {
        if (!kcmRoot) return;
        var panel = kcmRoot.querySelector('[data-kde-panel-content="colors"]');
        if (!panel) return;
        panel.querySelectorAll('.kde-systemsettings__theme-tile.is-active').forEach(function onTile(tile) {
            tile.classList.remove('is-active');
            tile.removeAttribute('aria-pressed');
        });
    }

    function prepareShot(shotId) {
        setCaptureParity(null);
        switch (shotId) {
            case 'kcm-display-config':
                setView('kcm-display');
                setKcmPanel(kcmEl(rootEl(), 'kcm-display'), 'display-config');
                break;
            case 'kcm-colors':
            case 'colors-panel':
                setView('kcm-themes');
                setKcmPanel(kcmEl(rootEl(), 'kcm-themes'), 'colors');
                setCaptureParity('subnav-replace');
                stripColorsSchemeActiveForCapture(kcmEl(rootEl(), 'kcm-themes'));
                break;
            case 'kcm-keys':
            case 'shortcuts-panel':
                setView('kcm-keyboard');
                setKcmPanel(kcmEl(rootEl(), 'kcm-keyboard'), 'shortcuts');
                break;
            case 'kcm-lookandfeel':
            case 'appearance-kcm':
            case 'appearance-panel':
                setView('kcm-themes');
                setKcmPanel(kcmEl(rootEl(), 'kcm-themes'), 'lookandfeel');
                setCaptureParity('subnav-replace');
                break;
            case 'hub-sidebar':
                setView('hub');
                setHubPanel('quick-settings');
                setNativeNav('quick-settings');
                break;
            case 'accessibility-panel':
                setView('kcm-access');
                setKcmPanel(kcmEl(rootEl(), 'kcm-access'), 'zoom');
                break;
            case 'desktop-panel':
                setView('kcm-themes');
                setKcmPanel(kcmEl(rootEl(), 'kcm-themes'), 'plasma-style');
                setCaptureParity('subnav-replace');
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
                setView('kcm-applications');
                setKcmPanel(kcmEl(rootEl(), 'kcm-applications'), 'default-apps');
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
                if (target && openKcmAlias(target)) return;
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
        var root = rootEl();
        if (root) {
            syncHubSidebarHighlight(root.dataset.kdeSettingsView || '');
        }
        updateWindowTitle();
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
                        var panelId = btn.getAttribute('data-kde-panel');
                        if (panelId) root.dataset.activeKdePanel = panelId;
                        var alreadyInKcm = root.dataset.kdeSettingsView === kcm;
                        setView(kcm);
                        var kcmRoot = kcmEl(root, kcm);
                        if (kcmRoot && !alreadyInKcm) {
                            var hubPanel = KCM_HUB_PANEL[kcm];
                            var kcmPanel = hubPanel && kcmRoot.querySelector('[data-kde-panel-content="' + hubPanel + '"]')
                                ? hubPanel
                                : panelId;
                            if (kcmPanel && kcmRoot.querySelector('[data-kde-panel-content="' + kcmPanel + '"]')) {
                                setKcmPanel(kcmRoot, kcmPanel);
                            } else if (kcm === 'kcm-themes') {
                                setKcmPanel(kcmRoot, 'lookandfeel');
                            }
                        }
                        return;
                    }
                    var panelId = btn.getAttribute('data-kde-panel');
                    setView('hub');
                    setHubPanel(panelId);
                    setNativeNav(panelId);
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
                    setHubPanel(root.dataset.activeKdePanel || 'quick-settings');
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
        setKcmPanel: setKcmPanel,
        setNativeNav: setNativeNav,
        resolveNavLayout: resolveNavLayout,
        syncHubSidebarHighlight: syncHubSidebarHighlight,
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
