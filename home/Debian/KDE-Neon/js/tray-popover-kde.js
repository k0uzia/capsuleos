/**
 * KDE Neon — zone de notification Plasma (popovers exclusifs, ordre VM).
 */
(function initKdeNeonTray() {
    'use strict';

    if (!document.body || document.body.id !== 'kde-neon') {
        return;
    }

    const TRAY_BASE = './assets/images/toolkits/kde/panel/tray/';
    const entries = [];

    function dispatchTrayOpen(id) {
        document.dispatchEvent(new CustomEvent('capsule:kde-neon-tray-open', {
            detail: { id: id || null },
        }));
    }

    function closeVolumeAndCalendar(exceptId) {
        const vol = document.getElementById('volume-popover');
        const volBtn = document.getElementById('tray-sound-btn');
        if (exceptId !== 'volume' && vol && volBtn && !vol.hasAttribute('hidden')) {
            vol.setAttribute('hidden', '');
            volBtn.setAttribute('aria-expanded', 'false');
        }

        const cal = document.getElementById('taskbar-calendar-popover');
        const calBtn = document.getElementById('taskbar-clock-trigger');
        if (exceptId !== 'calendar' && cal && calBtn && cal.hidden === false) {
            cal.hidden = true;
            calBtn.setAttribute('aria-expanded', 'false');
        }
    }

    function closeAll(exceptId) {
        entries.forEach((entry) => {
            if (!exceptId || entry.id !== exceptId) {
                entry.close();
            }
        });
        closeVolumeAndCalendar(exceptId);
    }

    function positionAtBtn(btn, popover) {
        const rect = btn.getBoundingClientRect();
        const rightOffset = window.innerWidth - rect.right;
        popover.style.right = Math.max(4, rightOffset) + 'px';
        popover.style.left = 'auto';
    }

    function registerPopover(id, btn, popover, options) {
        if (!btn || !popover) {
            return;
        }

        options = options || {};

        function close() {
            popover.setAttribute('hidden', '');
            btn.setAttribute('aria-expanded', 'false');
        }

        function open() {
            closeAll(id);
            positionAtBtn(btn, popover);
            popover.removeAttribute('hidden');
            btn.setAttribute('aria-expanded', 'true');
            dispatchTrayOpen(id);
            if (options.onOpen) {
                options.onOpen();
            }
        }

        function toggle() {
            if (popover.hasAttribute('hidden')) {
                open();
            } else {
                close();
            }
        }

        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (options.onClick) {
                options.onClick(toggle, open, close, event);
                return;
            }
            toggle();
        });

        entries.push({ id, close, btn, popover });
    }

    function returnToPickHome() {
        if (window.CapsulePickReturn) {
            window.CapsulePickReturn.redirectToPickHome('linux');
            return;
        }
        const home = (typeof window !== 'undefined' && window.CAPSULE_SITE_HOME)
            ? String(window.CAPSULE_SITE_HOME)
            : '../../../../../index.html';
        window.location.href = `${home.split('#')[0].split('?')[0]}?pick=linux#choisir-os`;
    }

    function updateSliderFill(slider) {
        const pct = parseInt(slider.value, 10) || 0;
        const cs = getComputedStyle(document.documentElement);
        const accent = cs.getPropertyValue('--menu-accent').trim() || '#3daee9';
        const track = cs.getPropertyValue('--volume-popover-track-bg').trim() || 'rgba(0,0,0,0.12)';
        slider.style.background = `linear-gradient(to right, ${accent} ${pct}%, ${track} ${pct}%)`;
    }

    function bindBrightnessSlider() {
        const slider = document.getElementById('kde-tray-brightness-slider');
        const valueLabel = document.getElementById('kde-tray-brightness-value');
        if (!slider) {
            return;
        }

        let brightness = parseInt(localStorage.getItem('kde-neon-brightness') || '100', 10);
        brightness = Math.max(0, Math.min(100, brightness));
        slider.value = String(brightness);
        if (valueLabel) {
            valueLabel.textContent = `${brightness}%`;
        }
        slider.setAttribute('aria-valuetext', `${brightness}%`);
        updateSliderFill(slider);

        slider.addEventListener('input', () => {
            const next = parseInt(slider.value, 10) || 0;
            if (valueLabel) {
                valueLabel.textContent = `${next}%`;
            }
            slider.setAttribute('aria-valuetext', `${next}%`);
            updateSliderFill(slider);
            try {
                localStorage.setItem('kde-neon-brightness', String(next));
            } catch (e) { /* offline */ }
        });
    }

    function bindClipboardHistory() {
        const popover = document.getElementById('kde-tray-popover-clipboard');
        const list = document.getElementById('kde-tray-clipboard-history');
        const empty = document.getElementById('kde-tray-clipboard-empty');
        if (!popover || !list) {
            return;
        }
        const entries = [
            { label: 'goupil@192.168.123.52', preview: 'ssh capsuleos-lab' },
            { label: 'https://neon.kde.org', preview: 'KDE neon User Edition' },
            { label: 'node capture-capsule-kde-neon.mjs', preview: 'Commande lab' },
        ];
        list.innerHTML = entries.map((entry) => (
            `<li class="kde-tray-popover__history-item" role="listitem">`
            + `<span class="kde-tray-popover__history-label">${entry.label}</span>`
            + `<span class="kde-tray-popover__history-preview">${entry.preview}</span>`
            + `</li>`
        )).join('');
        list.hidden = false;
        if (empty) {
            empty.hidden = true;
        }
    }

    function bindNetworkToggle() {
        const trayBtn = document.getElementById('tray-btn-network');
        const popover = document.getElementById('kde-tray-popover-network');
        const toggleBtn = document.getElementById('kde-tray-network-toggle');
        const wiredRow = popover ? popover.querySelector('[data-network-wired]') : null;
        const wifiRow = popover ? popover.querySelector('[data-network-wifi]') : null;
        if (!toggleBtn || !wiredRow || !wifiRow || !trayBtn) {
            return;
        }
        let wifiMode = false;
        const syncNetworkUi = () => {
            wiredRow.hidden = wifiMode;
            wifiRow.hidden = !wifiMode;
            wiredRow.classList.toggle('is-active', !wifiMode);
            wifiRow.classList.toggle('is-active', wifiMode);
            trayBtn.title = wifiMode ? 'Wi-Fi — Déconnecté' : 'Connexion filaire — Connecté';
            trayBtn.setAttribute('aria-label', trayBtn.title);
        };
        toggleBtn.addEventListener('click', (event) => {
            event.preventDefault();
            wifiMode = !wifiMode;
            syncNetworkUi();
        });
        syncNetworkUi();
    }

    function bindFooterActions() {
        const notifClear = document.getElementById('kde-tray-notifications-clear');
        const notifPopover = document.getElementById('kde-tray-popover-notifications');
        if (notifClear && notifPopover) {
            notifClear.addEventListener('click', () => {
                const empty = notifPopover.querySelector('.kde-tray-popover__empty');
                if (empty) {
                    empty.textContent = 'Aucune nouvelle notification';
                }
            });
        }

        const clipClear = document.getElementById('kde-tray-clipboard-clear');
        const clipPopover = document.getElementById('kde-tray-popover-clipboard');
        const clipHistory = document.getElementById('kde-tray-clipboard-history');
        const clipEmpty = document.getElementById('kde-tray-clipboard-empty');
        if (clipClear && clipPopover) {
            clipClear.addEventListener('click', () => {
                if (clipHistory) {
                    clipHistory.hidden = true;
                    clipHistory.innerHTML = '';
                }
                if (clipEmpty) {
                    clipEmpty.hidden = false;
                    clipEmpty.textContent = 'Le presse-papiers est vide';
                }
            });
        }

        const networkSettings = document.getElementById('kde-tray-network-settings');
        if (networkSettings) {
            networkSettings.addEventListener('click', () => {
                closeAll();
                returnToPickHome();
            });
        }
    }

    function bindUpdatesTray() {
        const updatesBtn = document.querySelector('[data-update-manager-tray]');
        if (!updatesBtn || updatesBtn.dataset.kdeTrayInit === 'true') {
            return;
        }
        updatesBtn.dataset.kdeTrayInit = 'true';
        updatesBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            closeAll();
            if (typeof window.openWindowByDataLink === 'function') {
                window.openWindowByDataLink('update_manager');
            }
            if (window.CapsuleDiscoverNeon && typeof window.CapsuleDiscoverNeon.openView === 'function') {
                window.CapsuleDiscoverNeon.openView('updates');
            }
        }, true);
    }

    function bindGlobalDismiss() {
        document.addEventListener('click', (event) => {
            const target = event.target;
            if (!target || !target.closest) {
                return;
            }
            const hitTray = target.closest('.taskbar-tray');
            const hitPopover = target.closest('.kde-tray-popover, .volume-popover, .calendar-popover');
            if (!hitTray && !hitPopover) {
                closeAll();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeAll();
            }
        });

        document.addEventListener('capsule:kde-neon-tray-open', (event) => {
            const exceptId = event.detail && event.detail.id ? event.detail.id : null;
            entries.forEach((entry) => {
                if (exceptId !== entry.id) {
                    entry.close();
                }
            });
            if (exceptId !== 'volume' && exceptId !== 'calendar') {
                closeVolumeAndCalendar(exceptId);
            }
        });
    }

    function init() {
        registerPopover(
            'notifications',
            document.getElementById('tray-btn-notifications'),
            document.getElementById('kde-tray-popover-notifications'),
        );
        registerPopover(
            'clipboard',
            document.getElementById('tray-btn-clipboard'),
            document.getElementById('kde-tray-popover-clipboard'),
        );
        registerPopover(
            'brightness',
            document.getElementById('tray-btn-brightness'),
            document.getElementById('kde-tray-popover-brightness'),
        );
        registerPopover(
            'network',
            document.getElementById('tray-btn-network'),
            document.getElementById('kde-tray-popover-network'),
        );
        registerPopover(
            'expand',
            document.getElementById('tray-btn-expand'),
            document.getElementById('kde-tray-popover-expand'),
        );

        bindBrightnessSlider();
        bindFooterActions();
        bindClipboardHistory();
        bindNetworkToggle();
        bindUpdatesTray();
        bindGlobalDismiss();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
