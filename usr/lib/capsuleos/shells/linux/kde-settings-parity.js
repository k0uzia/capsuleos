/**
 * Parité System Settings KDE — EFFECT_HANDLERS → bus capsule:* (pilote linux-kde-neon).
 */
(function initKdeSettingsParity(global) {
    'use strict';

    var PLASMA_BODY_IDS = new Set(['kde-neon', 'debian-kde', 'mx-kde', 'lxqt']);

    function isPlasma() {
        var id = global.document && global.document.body ? global.document.body.id : '';
        return PLASMA_BODY_IDS.has(id);
    }

    function store() {
        return global.CapsuleKdeKconfig;
    }

    function dispatch(name, detail) {
        if (global.document && typeof global.CustomEvent === 'function') {
            global.document.dispatchEvent(new global.CustomEvent(name, { detail: detail || {} }));
        }
    }

    function applyA11yHighContrast(on) {
        var kc = store();
        if (kc) {
            kc.setBool('kdeglobals::KDE/contrast', on);
        }
        var themeStorage = global.CapsuleThemeStorage;
        if (themeStorage && typeof themeStorage.applyContrastMode === 'function') {
            themeStorage.applyContrastMode(on ? 'high' : 'normal');
        } else if (global.document && global.document.documentElement) {
            global.document.documentElement.dataset.contrastMode = on ? 'high' : 'normal';
        }
        dispatch('capsule:a11y-contrast-changed', { high: on });
    }

    function applyA11yLargeText(on) {
        var themeStorage = global.CapsuleThemeStorage;
        if (themeStorage && typeof themeStorage.applyFontScale === 'function') {
            themeStorage.applyFontScale(on ? '125' : '100');
        } else if (global.document && global.document.documentElement) {
            global.document.documentElement.dataset.fontScale = on ? '125' : '100';
        }
        dispatch('capsule:a11y-font-scale-changed', { large: on, scale: on ? '125' : '100' });
    }

    function applyPanelHeight(value) {
        var kc = store();
        if (kc) {
            kc.setCapsule('plasmashellrc::PanelHeight', value || '40');
        }
        if (global.document && global.document.body) {
            global.document.body.dataset.plasmaPanelHeight = String(value || '40');
        }
        dispatch('capsule:panel-height-changed', { height: value });
    }

    function applyWindowAnimations(on) {
        var kc = store();
        if (kc) {
            kc.setBool('kwinrc::Windows/animate', on);
        }
        dispatch('capsule:window-animations-changed', { enabled: on });
    }

    var EFFECT_HANDLERS = {
        'kde-a11y-high-contrast': function (v) { applyA11yHighContrast(v === 'on'); },
        'kde-a11y-large-text': function (v) { applyA11yLargeText(v === 'on'); },
        'kde-panel-height': function (v) { applyPanelHeight(v); },
        'kde-window-animations': function (v) { applyWindowAnimations(v === 'on'); }
    };

    function bindControls(root) {
        if (!root || !isPlasma()) {
            return;
        }
        root.querySelectorAll('[data-kde-setting]').forEach(function wire(el) {
            var key = el.getAttribute('data-kde-setting');
            if (!key || el.dataset.kdeParityBound === 'true') {
                return;
            }
            el.dataset.kdeParityBound = 'true';
            var handler = EFFECT_HANDLERS[key];
            if (!handler) {
                return;
            }
            if (el.matches('[data-settings-switch]')) {
                el.addEventListener('click', function onToggle() {
                    var on = el.getAttribute('aria-checked') !== 'true';
                    el.setAttribute('aria-checked', on ? 'true' : 'false');
                    el.classList.toggle('is-on', on);
                    handler(on ? 'on' : 'off');
                });
            }
        });
    }

    function initKdeSettingsParity() {
        if (!isPlasma()) {
            return;
        }
        bindControls(global.document);
        global.document.addEventListener('capsule:slot-injected', function onSlot(ev) {
            var detail = ev.detail || {};
            if (detail.slotId === 'themes' && detail.container) {
                bindControls(detail.container);
            }
        });
    }

    global.CapsuleKdeSettingsParity = {
        EFFECT_HANDLERS: EFFECT_HANDLERS,
        bindControls: bindControls
    };

    if (global.document) {
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', initKdeSettingsParity);
        } else {
            initKdeSettingsParity();
        }
    }
}(typeof window !== 'undefined' ? window : globalThis));
