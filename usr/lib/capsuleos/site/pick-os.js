/**
 * Portail pick-os (généré depuis etc/capsuleos/os-registry.json).
 * Regénérer : node usr/lib/capsuleos/tools/build-pick-os.mjs
 */
(function () {
    const ICON =     {
        "linux": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/",
        "windows": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/",
        "macos": "./usr/share/capsuleos/assets/images/platforms/pick-os/macos/",
        "android": "./usr/share/capsuleos/assets/images/platforms/pick-os/android/",
        "ios": "./usr/share/capsuleos/assets/images/platforms/pick-os/ios/apple.svg",
        "bsd": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/debian.png"
    };

    const catalog =     {
        "linux": {
            "label": "Linux",
            "distros": [
                {
                    "name": "Linux Mint (Cinnamon)",
                    "href": "./OS/linux/families/debian/mint/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/mint.png"
                },
                {
                    "name": "Ubuntu 25.10",
                    "href": "./OS/linux/families/debian/ubuntu/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/ubuntu.png"
                },
                {
                    "name": "Fedora Workstation",
                    "href": "./OS/linux/families/redhat/fedora/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/fedora.png"
                },
                {
                    "name": "MX Linux KDE",
                    "href": "./OS/linux/families/debian/mx-kde/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/mx.png"
                },
                {
                    "name": "openSUSE Tumbleweed",
                    "href": "./OS/linux/families/suse/opensuse/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/opensuse.png"
                },
                {
                    "name": "Debian KDE (Plasma)",
                    "href": "./OS/linux/families/debian/debian-kde/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/debian.png"
                },
                {
                    "name": "Pop!_OS",
                    "href": "./OS/linux/families/debian/popos/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/popos.png"
                },
                {
                    "name": "AnduinOS",
                    "href": "./OS/linux/families/debian/anduinos/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/anduin.png"
                },
                {
                    "name": "Rocky Linux (GNOME)",
                    "href": "./OS/linux/families/redhat/rocky/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/rocky.png"
                }
            ]
        },
        "windows": {
            "label": "Windows",
            "distros": [
                {
                    "name": "Windows 10",
                    "href": "./OS/windows/versions/10/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win10.png"
                },
                {
                    "name": "Windows 11",
                    "href": "./OS/windows/versions/11/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win11.png"
                },
                {
                    "name": "Windows 7",
                    "href": "./OS/windows/versions/7/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win7.png"
                },
                {
                    "name": "Windows XP",
                    "href": "./OS/windows/versions/xp/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/winxp.png"
                },
                {
                    "name": "Windows 2000",
                    "href": "./OS/windows/versions/2000/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win2000.png"
                },
                {
                    "name": "Windows 8",
                    "href": "./OS/windows/versions/8/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win8.png"
                },
                {
                    "name": "Windows 8.1",
                    "href": "./OS/windows/versions/8.1/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win8.png"
                },
                {
                    "name": "Windows 95",
                    "href": "./OS/windows/versions/95/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win95.png"
                },
                {
                    "name": "Windows 98",
                    "href": "./OS/windows/versions/98/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win98.png"
                },
                {
                    "name": "Windows ME",
                    "href": "./OS/windows/versions/me/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/winme.png"
                },
                {
                    "name": "Windows Vista",
                    "href": "./OS/windows/versions/vista/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/vista.png"
                }
            ]
        },
        "macos": {
            "label": "Macos",
            "distros": [
                {
                    "name": "macOS Sonoma",
                    "href": "./OS/macos/sonoma/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/macos/sonoma.png"
                }
            ]
        },
        "bsd": {
            "label": "BSD",
            "distros": []
        },
        "ios": {
            "label": "iOS",
            "distros": [
                {
                    "name": "iOS 15",
                    "href": "./OS/ios/15/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/ios/apple.svg"
                }
            ]
        },
        "android": {
            "label": "Android",
            "distros": [
                {
                    "name": "Android (Vanilla Ice Cream)",
                    "href": "./OS/android/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/android/vanillaicecream.png"
                }
            ]
        }
    };

    const modal = document.getElementById('pick-modal');
    const modalTitle = document.getElementById('pick-modal-title');
    const modalList = document.getElementById('pick-modal-list');
    const modalClose = document.getElementById('pick-modal-close');
    const cards = document.querySelectorAll('.pick-card');

    if (!modal || !modalTitle || !modalList) return;

    let activeCard = null;

    const openModalForOs = (osKey, card) => {
        if (!osKey || !catalog[osKey]) return;

        if (activeCard && activeCard !== card) {
            activeCard.classList.remove('is-selected');
            activeCard.setAttribute('aria-pressed', 'false');
        }

        if (card) {
            activeCard = card;
            card.classList.add('is-selected');
            card.setAttribute('aria-pressed', 'true');
        } else {
            activeCard = null;
        }

        renderDistros(osKey);
        modal.showModal();
    };

    const closeModal = () => {
        modal.close();
        if (activeCard) {
            activeCard.classList.remove('is-selected');
            activeCard.setAttribute('aria-pressed', 'false');
            activeCard = null;
        }
    };

    const renderDistros = (osKey) => {
        const entry = catalog[osKey];
        if (!entry) return;

        modalTitle.textContent = entry.label;
        modalList.replaceChildren();

        if (entry.distros.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'pick-modal-empty';
            empty.textContent = 'Aucune distribution disponible pour le moment.';
            modalList.appendChild(empty);
            return;
        }

        entry.distros.forEach((distro) => {
            const item = document.createElement('li');
            item.className = 'pick-modal-item';

            const link = document.createElement('a');
            link.className = 'pick-modal-card';
            link.href = distro.href;
            link.title = distro.name;

            const icon = document.createElement('img');
            icon.className = 'pick-modal-card-icon';
            icon.src = distro.icon;
            icon.alt = '';
            icon.loading = 'lazy';

            const label = document.createElement('span');
            label.className = 'pick-modal-card-label';
            label.textContent = distro.name;

            link.appendChild(icon);
            link.appendChild(label);
            item.appendChild(link);
            modalList.appendChild(item);
        });
    };

    cards.forEach((card) => {
        card.addEventListener('click', () => {
            const osKey = card.dataset.os;
            openModalForOs(osKey, card);
        });
    });

    const pickKey = new URLSearchParams(location.search).get('pick');
    if (pickKey && catalog[pickKey]) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const card = document.querySelector(`.pick-card[data-os="${pickKey}"]`);
                openModalForOs(pickKey, card);
                if (location.search.includes('pick=')) {
                    history.replaceState(null, '', `${location.pathname}#choisir-os`);
                }
            });
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.open) closeModal();
    });
}());
