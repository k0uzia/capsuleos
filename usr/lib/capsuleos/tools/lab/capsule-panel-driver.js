/**
 * Pilote checklist panel Mint — évaluer une fois dans la page CapsuleOS (CDP).
 */
(function initCapsulePanelDriver(global) {
    'use strict';

    function launcherQuery(slot) {
        return '#tableau.fedora-dock a[target="windowElement"][data-link="' + slot + '"],'
            + ' aside.fedora-dock a[target="windowElement"][data-link="' + slot + '"],'
            + ' footer nav a[target="windowElement"][data-link="' + slot + '"]';
    }

    function clickLauncher(slot) {
        const link = document.querySelector(launcherQuery(slot));
        if (link) {
            link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
    }

    function openLauncher(slot) {
        if (typeof global.openWindowByDataLink === 'function') {
            global.openWindowByDataLink(slot);
            return;
        }
        clickLauncher(slot);
    }

    function focusLauncher(slot) {
        const container = document.querySelector('.windowElement[data-link="' + slot + '"]');
        const hidden = !container || container.style.display === 'none';
        if (hidden) {
            openLauncher(slot);
            return;
        }
        if (!container.classList.contains('windowElementActive')) {
            if (typeof global.openWindowByDataLink === 'function') {
                global.openWindowByDataLink(slot);
                return;
            }
            clickLauncher(slot);
        }
    }

    function minimizeLauncher(slot) {
        const container = document.querySelector('.windowElement[data-link="' + slot + '"]');
        if (!container || container.style.display === 'none') {
            return;
        }
        if (container.classList.contains('windowElementActive')) {
            const listBtn = document.querySelector(
                '.taskbar-window-list__btn.is-active[data-window-link="' + slot + '"]',
            );
            if (listBtn) {
                listBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                return;
            }
            if (global.CapsuleTaskbarLauncherState
                && typeof global.CapsuleTaskbarLauncherState.markRunning === 'function') {
                global.CapsuleTaskbarLauncherState.markRunning(container);
            } else if (container.dataset) {
                container.dataset.capsuleRunning = 'true';
            }
            container.style.display = 'none';
            container.classList.remove('windowElementActive', 'active');
            if (global.CapsuleTaskbarWindowList
                && typeof global.CapsuleTaskbarWindowList.refresh === 'function') {
                global.CapsuleTaskbarWindowList.refresh();
            }
        }
    }

    function nemoSidebar(folder) {
        openLauncher('nemo');
        const docLink = document.querySelector(
            '.windowElement[data-link="nemo"] a[data-link="' + folder + '"]',
        );
        if (docLink) {
            docLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
    }

    function resetPanel() {
        document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
            const slot = win.dataset ? win.dataset.link : '';
            if (!slot || slot === 'mainMenu') {
                return;
            }
            win.style.display = 'none';
            win.classList.remove('windowElementActive', 'active');
            if (win.dataset) {
                delete win.dataset.capsuleRunning;
            }
        });
        document.querySelectorAll('footer nav a[target="windowElement"]').forEach((link) => {
            link.classList.remove('running-link', 'active-link');
        });
        if (global.CapsuleTaskbarLauncherState && global.CapsuleTaskbarLauncherState.refresh) {
            global.CapsuleTaskbarLauncherState.refresh();
        }
    }

    global.CapsulePanelDriver = {
        resetPanel: resetPanel,
        openLauncher: openLauncher,
        focusLauncher: focusLauncher,
        minimizeLauncher: minimizeLauncher,
        nemoSidebar: nemoSidebar,
        runAction(cmd, arg) {
            if (cmd === 'open-launcher') openLauncher(arg);
            else if (cmd === 'focus-launcher') focusLauncher(arg);
            else if (cmd === 'minimize-launcher') minimizeLauncher(arg);
            else if (cmd === 'nemo-sidebar') nemoSidebar(arg);
        },
    };
}(typeof window !== 'undefined' ? window : globalThis));
