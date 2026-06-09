/**
 * Horloges GNOME — simulation org.gnome.clocks (horloges mondiales).
 */
(function initGnomeClocksApp(global) {
    'use strict';

    var VIEW_LABELS = {
        world: 'Monde',
        alarms: 'Alarmes',
        timer: 'Minuteur',
        stopwatch: 'Chronomètre'
    };

    var ZONES = [
        { city: 'Paris', tz: 'Europe/Paris' },
        { city: 'Londres', tz: 'Europe/London' },
        { city: 'New York', tz: 'America/New_York' }
    ];

    var timerId = null;
    var activeView = 'world';

    function formatTime(date, tz) {
        return date.toLocaleTimeString('fr-FR', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    function formatDate(date, tz) {
        return date.toLocaleDateString('fr-FR', {
            timeZone: tz,
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    function capitalizeFr(text) {
        if (!text) {
            return text;
        }
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function renderWorld(list) {
        var now = new Date();
        list.innerHTML = '';
        ZONES.forEach(function (zone) {
            var li = document.createElement('li');
            li.className = 'gnome-clocks__card';
            li.innerHTML =
                '<span class="gnome-clocks__city">' + zone.city + '</span>' +
                '<span class="gnome-clocks__time">' + formatTime(now, zone.tz) + '</span>' +
                '<span class="gnome-clocks__date">' + capitalizeFr(formatDate(now, zone.tz)) + '</span>';
            list.appendChild(li);
        });
    }

    function updateAddButton(addBtn) {
        if (!addBtn) {
            return;
        }
        var show = activeView === 'world' || activeView === 'alarms';
        addBtn.classList.toggle('is-visible', show);
        addBtn.hidden = !show;
        if (activeView === 'world') {
            addBtn.setAttribute('aria-label', 'Ajouter une ville');
            addBtn.title = 'Ajouter une ville';
        } else if (activeView === 'alarms') {
            addBtn.setAttribute('aria-label', 'Ajouter une alarme');
            addBtn.title = 'Ajouter une alarme';
        }
    }

    function switchView(root, viewId) {
        activeView = viewId;
        var title = root.querySelector('#gnome-clocks-title');
        if (title) {
            title.textContent = VIEW_LABELS[viewId] || VIEW_LABELS.world;
        }
        updateAddButton(root.querySelector('#gnome-clocks-add'));

        root.querySelectorAll('[data-clocks-view]').forEach(function (btn) {
            var isActive = btn.dataset.clocksView === viewId;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        root.querySelectorAll('[data-clocks-panel]').forEach(function (panel) {
            var isActive = panel.dataset.clocksPanel === viewId;
            panel.classList.toggle('is-active', isActive);
            panel.hidden = !isActive;
        });
    }

    function bindNavigation(root) {
        root.querySelectorAll('[data-clocks-view]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchView(root, btn.dataset.clocksView);
            });
        });
    }

    function initClocksApp() {
        var root = document.getElementById('gnomeClocksApp');
        var list = document.getElementById('gnome-clocks-list');
        if (!root || !list || root.dataset.clocksReady === '1') {
            return;
        }
        root.dataset.clocksReady = '1';
        bindNavigation(root);
        switchView(root, 'world');
        renderWorld(list);
        if (timerId) {
            clearInterval(timerId);
        }
        timerId = setInterval(function () {
            if (activeView === 'world') {
                renderWorld(list);
            }
        }, 1000);
    }

    global.initClocksApp = initClocksApp;
}(typeof window !== 'undefined' ? window : this));
