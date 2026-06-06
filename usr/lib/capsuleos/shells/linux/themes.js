const GNOME_SETTINGS_PANEL_LABELS = {
    wifi: 'Wi-Fi',
    bluetooth: 'Bluetooth',
    appearance: 'Apparence',
    background: 'Arrière-plan',
    region: 'Région et langue',
    keyboard: 'Clavier',
    mouse: 'Souris et pavé tactile',
    sound: 'Son',
    displays: 'Écrans',
    power: 'Alimentation',
    printers: 'Imprimantes',
    'default-apps': 'Applications par défaut',
    sharing: 'Partage',
    about: 'À propos de',
};

let pendingGnomeSettingsPanel = null;

function setCapsuleSettingsPanel(panelId) {
    pendingGnomeSettingsPanel = panelId || null;
}

function resolveGnomeSettingsPanelLabel(panelId) {
    return GNOME_SETTINGS_PANEL_LABELS[panelId] || 'Paramètres';
}

function activateGnomeSettingsPanel(root, panelId) {
    if (!root) {
        return;
    }

    const resolvedPanel = panelId && root.querySelector(`[data-gnome-settings-panel="${panelId}"]`)
        ? panelId
        : 'appearance';

    root.querySelectorAll('.gnome-settings__panel[data-gnome-settings-panel]').forEach((panel) => {
        const isActive = panel.getAttribute('data-gnome-settings-panel') === resolvedPanel;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
    });

    root.querySelectorAll('.gnome-settings__navitem[data-gnome-settings-panel]').forEach((item) => {
        const isActive = item.getAttribute('data-gnome-settings-panel') === resolvedPanel;
        item.classList.toggle('is-active', isActive);
        if (isActive) {
            item.setAttribute('aria-current', 'page');
        } else {
            item.removeAttribute('aria-current');
        }
    });

    const title = root.querySelector('[data-gnome-settings-title]');
    if (title) {
        title.textContent = resolveGnomeSettingsPanelLabel(resolvedPanel);
    }
}

function bindGnomeSettingsNavigation(root) {
    if (!root || root.dataset.gnomeNavBound === 'true') {
        return;
    }

    root.querySelectorAll('.gnome-settings__navitem[data-gnome-settings-panel]').forEach((item) => {
        item.addEventListener('click', () => {
            const panelId = item.getAttribute('data-gnome-settings-panel');
            activateGnomeSettingsPanel(root, panelId);
        });
    });

    root.dataset.gnomeNavBound = 'true';
}

function bindSettingsSwitches(root) {
    if (!root || root.dataset.gnomeSwitchesBound === 'true') {
        return;
    }

    root.querySelectorAll('[data-settings-switch]').forEach((toggle) => {
        toggle.addEventListener('click', () => {
            const isOn = toggle.getAttribute('aria-checked') === 'true';
            toggle.setAttribute('aria-checked', isOn ? 'false' : 'true');
            toggle.classList.toggle('is-on', !isOn);
        });
    });

    const volumeSlider = root.querySelector('#gnomeSettingsSound .gnome-settings-slider');
    const volumeValue = root.querySelector('#gnomeSettingsSound .gnome-settings-slider-row__value');
    if (volumeSlider && volumeValue) {
        volumeSlider.addEventListener('input', () => {
            volumeValue.textContent = `${volumeSlider.value}%`;
        });
    }

    root.querySelectorAll('.gnome-settings-wallpaper:not(.gnome-settings-wallpaper--add)').forEach((tile) => {
        tile.addEventListener('click', () => {
            const grid = tile.closest('.gnome-settings-wallpapers');
            if (!grid) {
                return;
            }
            grid.querySelectorAll('.gnome-settings-wallpaper').forEach((entry) => {
                entry.classList.remove('is-active');
            });
            tile.classList.add('is-active');
        });
    });

    root.dataset.gnomeSwitchesBound = 'true';
}

function handleGnomeSettingsWindowOpened(container) {
    const root = container ? container.querySelector('#themesApp') : null;
    if (!root || !root.classList.contains('gnome-settings')) {
        return;
    }

    const panelId = pendingGnomeSettingsPanel || 'appearance';
    pendingGnomeSettingsPanel = null;
    activateGnomeSettingsPanel(root, panelId);
    bindGnomeSettingsNavigation(root);
    bindSettingsSwitches(root);
    initThemesApp();
}

if (typeof window !== 'undefined') {
    window.setCapsuleSettingsPanel = setCapsuleSettingsPanel;
    document.addEventListener('capsule:window-opened', (event) => {
        if (!event.detail || event.detail.slotId !== 'themes') {
            return;
        }
        handleGnomeSettingsWindowOpened(event.detail.container);
    });
}

(function initThemeAtBoot() {
    const storage = window.CapsuleThemeStorage || {};
    const bodyId = document.body ? document.body.id : '';
    const themeKey = typeof storage.getThemeStorageKey === 'function'
        ? storage.getThemeStorageKey(bodyId)
        : 'mint-theme';
    const savedTheme = typeof storage.readSavedTheme === 'function'
        ? storage.readSavedTheme(bodyId)
        : localStorage.getItem(themeKey);
    const savedContrast = localStorage.getItem('mint-contrast-mode');
    const savedFontScale = localStorage.getItem('mint-font-scale');
    const isGnomeShell = typeof storage.isGnomeShell === 'function'
        ? storage.isGnomeShell(bodyId)
        : false;
    const defaultTheme = bodyId === 'mint' || isGnomeShell || themeKey === 'cosmic-theme' ? 'dark' : 'light';
    const resolvedTheme = savedTheme === 'light' ? 'light' : (savedTheme === 'dark' ? 'dark' : defaultTheme);
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.contrastMode = savedContrast === 'high' ? 'high' : 'normal';
    document.documentElement.dataset.fontScale = ['110', '125'].includes(savedFontScale) ? savedFontScale : '100';
})();

function resolveThemesAppearanceRoot(root) {
    return root.querySelector('[data-gnome-settings-panel="appearance"]')
        || root.querySelector('#gnomeSettingsAppearance')
        || root;
}

function initThemesApp() {
    const root = document.querySelector('#themes #themesApp');
    if (!root) {
        return;
    }

    bindGnomeSettingsNavigation(root);
    bindSettingsSwitches(root);

    const appearanceRoot = resolveThemesAppearanceRoot(root);
    ensureExtendedThemeControls(appearanceRoot);

    if (root.dataset.initialized === 'true') {
        return;
    }

    const options = appearanceRoot.querySelectorAll('[data-theme-option]');
    const contrastOptions = appearanceRoot.querySelectorAll('[data-contrast-option]');
    const fontScaleOptions = appearanceRoot.querySelectorAll('[data-font-scale-option]');
    const help = appearanceRoot.querySelector('[data-themes-help]');

    if (!options.length || !help) {
        return;
    }

    const themeStorageKey = window.CapsuleThemeStorage && typeof window.CapsuleThemeStorage.getThemeStorageKey === 'function'
        ? window.CapsuleThemeStorage.getThemeStorageKey(document.body ? document.body.id : '')
        : 'mint-theme';

    function applyTheme(theme) {
        const resolved = theme === 'light' ? 'light' : 'dark';
        document.documentElement.dataset.theme = resolved;
        if (window.CapsuleThemeStorage && typeof window.CapsuleThemeStorage.persistTheme === 'function') {
            window.CapsuleThemeStorage.persistTheme(resolved, document.body ? document.body.id : '');
        } else {
            localStorage.setItem(themeStorageKey, resolved);
        }

        options.forEach(function syncOption(button) {
            const isActive = button.getAttribute('data-theme-option') === resolved;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });

        help.textContent = resolved === 'light'
            ? 'Le thème clair est actif.'
            : 'Le thème sombre est actif.';
    }

    function applyContrast(mode) {
        const resolved = mode === 'high' ? 'high' : 'normal';
        document.documentElement.dataset.contrastMode = resolved;
        localStorage.setItem('mint-contrast-mode', resolved);

        contrastOptions.forEach(function syncContrast(button) {
            const isActive = button.getAttribute('data-contrast-option') === resolved;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });
    }

    function applyFontScale(scale) {
        const resolved = ['110', '125'].includes(scale) ? scale : '100';
        document.documentElement.dataset.fontScale = resolved;
        localStorage.setItem('mint-font-scale', resolved);

        fontScaleOptions.forEach(function syncScale(button) {
            const isActive = button.getAttribute('data-font-scale-option') === resolved;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });
    }

    options.forEach(function bindOption(button) {
        button.addEventListener('click', function onOptionClick() {
            applyTheme(button.getAttribute('data-theme-option'));
            if (typeof dispatchCapsuleTask === 'function') {
                dispatchCapsuleTask('change-theme');
            }
        });
    });

    contrastOptions.forEach(function bindContrast(button) {
        button.addEventListener('click', function onContrastClick() {
            applyContrast(button.getAttribute('data-contrast-option'));
        });
    });

    fontScaleOptions.forEach(function bindFontScale(button) {
        button.addEventListener('click', function onFontScaleClick() {
            applyFontScale(button.getAttribute('data-font-scale-option'));
        });
    });

    applyTheme(document.documentElement.dataset.theme || 'light');
    applyContrast(document.documentElement.dataset.contrastMode || 'normal');
    applyFontScale(document.documentElement.dataset.fontScale || '100');
    root.dataset.initialized = 'true';
}

function hasExtendedThemeControls(root) {
    return !!root.querySelector('[data-contrast-option]')
        && !!root.querySelector('[data-font-scale-option]');
}

function ensureExtendedThemeControls(root) {
    if (hasExtendedThemeControls(root)) {
        return;
    }

    root.insertAdjacentHTML('beforeend', `
        <section class="themes-app__section">
            <h2 class="themes-app__label">Contraste</h2>
            <div class="themes-app__cards" role="radiogroup" aria-label="Mode contraste">
                <button type="button" class="themes-contrast-card" data-contrast-option="normal" role="radio" aria-checked="true">
                    <span class="themes-card__title">Standard</span>
                </button>
                <button type="button" class="themes-contrast-card" data-contrast-option="high" role="radio" aria-checked="false">
                    <span class="themes-card__title">Renforce</span>
                </button>
            </div>
        </section>

        <section class="themes-app__section">
            <h2 class="themes-app__label">Taille du texte</h2>
            <div class="themes-app__scale" role="radiogroup" aria-label="Taille du texte">
                <button type="button" class="themes-scale-button" data-font-scale-option="100" role="radio" aria-checked="true">100%</button>
                <button type="button" class="themes-scale-button" data-font-scale-option="110" role="radio" aria-checked="false">110%</button>
                <button type="button" class="themes-scale-button" data-font-scale-option="125" role="radio" aria-checked="false">125%</button>
            </div>
        </section>
    `);
}
