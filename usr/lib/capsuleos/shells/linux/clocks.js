/**
 * Horloges GNOME — simulation org.gnome.clocks (horloges mondiales).
 */
(function initGnomeClocksApp(global) {
    'use strict';

    var ZONES = [
        { city: 'Paris', tz: 'Europe/Paris' },
        { city: 'New York', tz: 'America/New_York' },
        { city: 'Tokyo', tz: 'Asia/Tokyo' }
    ];

    var timerId = null;

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

    function render(list) {
        var now = new Date();
        list.innerHTML = '';
        ZONES.forEach(function (zone) {
            var li = document.createElement('li');
            li.className = 'gnome-clocks__card';
            li.innerHTML =
                '<span class="gnome-clocks__city">' + zone.city + '</span>' +
                '<span class="gnome-clocks__time">' + formatTime(now, zone.tz) + '</span>' +
                '<span class="gnome-clocks__date">' + formatDate(now, zone.tz) + '</span>';
            list.appendChild(li);
        });
    }

    function initClocksApp() {
        var root = document.getElementById('gnomeClocksApp');
        var list = document.getElementById('gnome-clocks-list');
        if (!root || !list || root.dataset.clocksReady === '1') {
            return;
        }
        root.dataset.clocksReady = '1';
        render(list);
        if (timerId) {
            clearInterval(timerId);
        }
        timerId = setInterval(function () {
            render(list);
        }, 1000);
    }

    global.initClocksApp = initClocksApp;
}(typeof window !== 'undefined' ? window : this));
