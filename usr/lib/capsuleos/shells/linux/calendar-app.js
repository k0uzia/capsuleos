/**
 * Calendrier GNOME — simulation org.gnome.Calendar (vue mois).
 */
(function initGnomeCalendarApp(global) {
    'use strict';

    var viewYear;
    var viewMonth;
    var selectedDay = null;

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function monthLabel(year, month) {
        var d = new Date(year, month, 1);
        return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }

    function buildWeekdays(container) {
        var labels = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];
        container.innerHTML = '';
        labels.forEach(function (label) {
            var el = document.createElement('span');
            el.className = 'gnome-calendar-app__weekday';
            el.textContent = label;
            container.appendChild(el);
        });
    }

    function renderGrid(grid) {
        grid.innerHTML = '';
        var first = new Date(viewYear, viewMonth, 1);
        var startOffset = (first.getDay() + 6) % 7;
        var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        var today = new Date();
        var cells = [];

        for (var i = 0; i < startOffset; i++) {
            cells.push({ empty: true });
        }
        for (var day = 1; day <= daysInMonth; day++) {
            cells.push({ day: day });
        }
        while (cells.length % 7 !== 0) {
            cells.push({ empty: true });
        }

        cells.forEach(function (cell) {
            if (cell.empty) {
                var empty = document.createElement('span');
                empty.className = 'gnome-calendar-app__day gnome-calendar-app__day--empty';
                empty.setAttribute('aria-hidden', 'true');
                grid.appendChild(empty);
                return;
            }
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'gnome-calendar-app__day';
            btn.textContent = String(cell.day);
            btn.setAttribute('data-day', String(cell.day));
            if (
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === cell.day
            ) {
                btn.classList.add('gnome-calendar-app__day--today');
                btn.setAttribute('aria-current', 'date');
            }
            if (selectedDay === cell.day) {
                btn.classList.add('gnome-calendar-app__day--selected');
                btn.setAttribute('aria-selected', 'true');
            }
            btn.addEventListener('click', function () {
                selectedDay = cell.day;
                render();
            });
            grid.appendChild(btn);
        });
    }

    function render() {
        var monthEl = document.getElementById('gnome-cal-month');
        var weekdays = document.getElementById('gnome-cal-weekdays');
        var grid = document.getElementById('gnome-cal-grid');
        if (!monthEl || !weekdays || !grid) {
            return;
        }
        monthEl.textContent = monthLabel(viewYear, viewMonth);
        buildWeekdays(weekdays);
        renderGrid(grid);
    }

    function initCalendarApp() {
        var root = document.getElementById('gnomeCalendarApp');
        if (!root || root.dataset.calendarReady === '1') {
            return;
        }
        root.dataset.calendarReady = '1';
        var now = new Date();
        viewYear = now.getFullYear();
        viewMonth = now.getMonth();

        var prev = document.getElementById('gnome-cal-prev');
        var next = document.getElementById('gnome-cal-next');
        if (prev) {
            prev.addEventListener('click', function () {
                viewMonth -= 1;
                if (viewMonth < 0) {
                    viewMonth = 11;
                    viewYear -= 1;
                }
                render();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                viewMonth += 1;
                if (viewMonth > 11) {
                    viewMonth = 0;
                    viewYear += 1;
                }
                render();
            });
        }
        render();
    }

    global.initCalendarApp = initCalendarApp;
}(typeof window !== 'undefined' ? window : this));
