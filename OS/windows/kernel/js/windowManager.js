/**
 * Gestion fenêtres iframe Windows (CapsuleOS).
 * Remplace l'ancien js/windows.js racine pour toutes les versions Windows.
 */
document.addEventListener('DOMContentLoaded', function () {
    const mainElement = document.querySelector('main');
    const links = document.querySelectorAll('a[target="lien"]');
    const windowContainer = document.getElementById('windowContainer');

    if (!mainElement || !windowContainer || links.length === 0) {
        return;
    }

    let zIndex = 5;
    const openWindows = [];
    let offset = 0;

    links.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            if (openWindows.length === 0) {
                offset = (window.innerWidth - windowContainer.offsetHeight) / 16;
                offset = (window.innerHeight - windowContainer.offsetHeight) / 100;
            }

            const sections = mainElement.querySelectorAll('section');
            sections.forEach(function (section) {
                section.remove();
            });

            const href = this.href;
            const existingWindow = openWindows.find(function (win) {
                return win.querySelector('#windowIframe').src === href;
            });
            if (existingWindow) {
                existingWindow.style.display = 'block';
                return;
            }

            const newWindow = windowContainer.cloneNode(true);
            newWindow.style.zIndex = String(++zIndex);
            newWindow.style.top = `${offset}px`;
            mainElement.appendChild(newWindow);

            newWindow.querySelector('#windowIframe').src = href;

            const windowTitle = newWindow.querySelector('#windowTitle');
            if (windowTitle) {
                windowTitle.textContent = this.title || this.getAttribute('aria-label') || '';
            }

            newWindow.style.display = 'block';
            this.style.borderBottom = '1px solid white';

            openWindows.push(newWindow);
            offset += 30;

            if (typeof makeDraggable === 'function') {
                makeDraggable(newWindow);
            }
        });
    });

    document.addEventListener('click', function (event) {
        if (event.target.matches('#minimizeBtn') || event.target.matches('#closeBtn')) {
            const win = event.target.closest('#windowContainer');
            if (!win) {
                return;
            }
            win.style.display = 'none';
            links.forEach(function (img) {
                img.style.borderBottom = '';
            });
            const idx = openWindows.indexOf(win);
            if (idx !== -1) {
                openWindows.splice(idx, 1);
            }
        }

        if (event.target.matches('#resizeBtn')) {
            const win = event.target.closest('#windowContainer');
            if (!win) {
                return;
            }
            if (win.style.width === '100%' && win.style.height === '100%') {
                win.style.width = '';
                win.style.height = '';
                win.style.position = '';
                win.style.top = '';
                win.style.left = '';
            } else {
                win.style.width = '100%';
                win.style.height = '100%';
                win.style.position = 'relative';
                win.style.top = '-50px';
                win.style.left = '0';
            }
        }
    });
});
