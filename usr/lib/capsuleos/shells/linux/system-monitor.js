/**
 * Moniteur système — org.gnome.SystemMonitor 46 sur Mint.
 */
(function initSystemMonitorAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Moniteur système';

    var PROCESSES = [
        { name: 'cinnamon', user: 'capsule', cpu: '4,2', pid: '1842', mem: '142,3 Mo', read: '0 o/s', write: '0 o/s', nice: '0' },
        { name: 'firefox', user: 'capsule', cpu: '2,8', pid: '4521', mem: '512,1 Mo', read: '12 Ko/s', write: '4 Ko/s', nice: '0' },
        { name: 'nemo', user: 'capsule', cpu: '0,5', pid: '3890', mem: '48,2 Mo', read: '0 o/s', write: '0 o/s', nice: '0' },
        { name: 'gnome-system-monitor', user: 'capsule', cpu: '1,1', pid: '9102', mem: '36,4 Mo', read: '0 o/s', write: '0 o/s', nice: '0' },
        { name: 'mintupdate', user: 'capsule', cpu: '0,0', pid: '2104', mem: '22,1 Mo', read: '0 o/s', write: '0 o/s', nice: '0' },
        { name: 'Xorg', user: 'capsule', cpu: '3,4', pid: '1120', mem: '88,0 Mo', read: '0 o/s', write: '0 o/s', nice: '0' }
    ];

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'system_monitor') {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function syncWindowTitle(winEl) {
        if (!winEl) {
            return;
        }
        var wmTitle = winEl.querySelector('#windowTitle');
        if (wmTitle) {
            wmTitle.textContent = WINDOW_TITLE;
        }
        winEl.setAttribute('data-title', WINDOW_TITLE);
    }

    function showTab(root, tabId) {
        var tabs = root.querySelectorAll('[data-gsm-tab]');
        var panels = root.querySelectorAll('[data-gsm-panel]');
        var ti;
        for (ti = 0; ti < tabs.length; ti += 1) {
            var tab = tabs[ti];
            var active = tab.getAttribute('data-gsm-tab') === tabId;
            tab.classList.toggle('is-active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
        }
        var pi;
        for (pi = 0; pi < panels.length; pi += 1) {
            var panel = panels[pi];
            if (panel.getAttribute('data-gsm-panel') === tabId) {
                panel.removeAttribute('hidden');
            } else {
                panel.setAttribute('hidden', 'hidden');
            }
        }
    }

    function renderProcesses(tbody, list) {
        if (!tbody) {
            return;
        }
        var html = '';
        var i;
        for (i = 0; i < list.length; i += 1) {
            var p = list[i];
            html += '<tr data-gsm-pid="' + p.pid + '">';
            html += '<td>' + p.name + '</td>';
            html += '<td>' + p.user + '</td>';
            html += '<td>' + p.cpu + '</td>';
            html += '<td>' + p.pid + '</td>';
            html += '<td>' + p.mem + '</td>';
            html += '<td>' + p.read + '</td>';
            html += '<td>' + p.write + '</td>';
            html += '<td>' + p.nice + '</td>';
            html += '</tr>';
        }
        tbody.innerHTML = html;
    }

    function initSystemMonitorAppOnce() {
        var root = global.document.getElementById('systemMonitorApp');
        if (!root || root.dataset.systemMonitorInit === 'true') {
            return;
        }
        root.dataset.systemMonitorInit = 'true';

        var winEl = getWindowEl(root);
        syncWindowTitle(winEl);

        var tbody = root.querySelector('#gsm-process-body');
        var searchRow = root.querySelector('#gsm-search-row');
        var searchInput = root.querySelector('#gsm-search');
        var stopBtn = root.querySelector('[data-gsm-action="stop"]');
        var killBtn = root.querySelector('[data-gsm-action="kill"]');
        var selectedPid = null;

        renderProcesses(tbody, PROCESSES);

        root.addEventListener('click', function onClick(event) {
            var target = event.target;
            if (!target || !target.closest) {
                return;
            }
            var tabBtn = target.closest('[data-gsm-tab]');
            if (tabBtn) {
                showTab(root, tabBtn.getAttribute('data-gsm-tab'));
                return;
            }
            var searchBtn = target.closest('[data-gsm-action="search"]');
            if (searchBtn && searchRow) {
                var open = searchRow.hidden;
                if (open) {
                    searchRow.removeAttribute('hidden');
                    if (searchInput) {
                        searchInput.focus();
                    }
                } else {
                    searchRow.setAttribute('hidden', 'hidden');
                }
                return;
            }
            var row = target.closest('#gsm-process-body tr');
            if (row) {
                var rows = root.querySelectorAll('#gsm-process-body tr');
                var ri;
                for (ri = 0; ri < rows.length; ri += 1) {
                    rows[ri].classList.remove('is-selected');
                }
                row.classList.add('is-selected');
                selectedPid = row.getAttribute('data-gsm-pid');
                if (stopBtn) {
                    stopBtn.disabled = false;
                }
                if (killBtn) {
                    killBtn.disabled = false;
                }
            }
        });

        if (searchInput) {
            searchInput.addEventListener('input', function onSearch() {
                var q = (searchInput.value || '').trim().toLowerCase();
                if (!q) {
                    renderProcesses(tbody, PROCESSES);
                    return;
                }
                var filtered = [];
                var fi;
                for (fi = 0; fi < PROCESSES.length; fi += 1) {
                    if (PROCESSES[fi].name.toLowerCase().indexOf(q) !== -1) {
                        filtered.push(PROCESSES[fi]);
                    }
                }
                renderProcesses(tbody, filtered);
            });
        }

        showTab(root, 'processes');
    }

    global.initSystemMonitorApp = function initSystemMonitorApp() {
        initSystemMonitorAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
