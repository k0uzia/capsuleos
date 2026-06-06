/**
 * Portail pick-os (généré depuis etc/capsuleos/os-registry.json).
 * Gel noyau : catalogue public vide ; devSkin via ?devSkin=<registryId>.
 * Regénérer : node usr/lib/capsuleos/tools/build-pick-os.mjs
 */
(function () {
    const KERNEL_REBUILD = false;
    const REBUILD_MESSAGE = 'Le noyau CapsuleOS est en reconstruction. Les bureaux seront réactivés progressivement après validation du noyau central.';
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
                    "name": "openSUSE Tumbleweed",
                    "href": "./OS/linux/families/suse/opensuse/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/opensuse.png"
                },
                {
                    "name": "Rocky Linux (GNOME)",
                    "href": "./OS/linux/families/redhat/rocky/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/rocky.png"
                },
                {
                    "name": "Pop!_OS",
                    "href": "./OS/linux/families/debian/popos/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/popos.png"
                },
                {
                    "name": "AlmaLinux (GNOME)",
                    "href": "./OS/linux/families/redhat/alma/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/debian.png"
                },
                {
                    "name": "AnduinOS",
                    "href": "./OS/linux/families/debian/anduinos/index.html",
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/anduin.png"
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
                    "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/macos/sonoma.png"
                }
            ]
        },
        "android": {
            "label": "Android",
            "distros": []
        }
    };

    const devSkinIndex =     {
        "linux-mint": {
            "id": "linux-mint",
            "displayName": "Linux Mint (Cinnamon)",
            "href": "./OS/linux/families/debian/mint/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/mint.png",
            "status": "active",
            "tier": "P0"
        },
        "linux-ubuntu": {
            "id": "linux-ubuntu",
            "displayName": "Ubuntu 25.10",
            "href": "./OS/linux/families/debian/ubuntu/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/ubuntu.png",
            "status": "active",
            "tier": "P0"
        },
        "linux-fedora": {
            "id": "linux-fedora",
            "displayName": "Fedora Workstation",
            "href": "./OS/linux/families/redhat/fedora/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/fedora.png",
            "status": "active",
            "tier": "P1"
        },
        "linux-mx-kde": {
            "id": "linux-mx-kde",
            "displayName": "MX Linux KDE",
            "href": "./OS/linux/families/debian/mx-kde/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/mx.png",
            "status": "planned",
            "tier": "P1"
        },
        "linux-debian-kde": {
            "id": "linux-debian-kde",
            "displayName": "Debian KDE (Plasma)",
            "href": "./OS/linux/families/debian/debian-kde/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/debian.png",
            "status": "planned",
            "tier": "P2"
        },
        "linux-kde-neon": {
            "id": "linux-kde-neon",
            "displayName": "KDE neon User Edition",
            "href": "./OS/linux/families/debian/kde-neon/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/debian.png",
            "status": "planned",
            "tier": "P2"
        },
        "linux-opensuse": {
            "id": "linux-opensuse",
            "displayName": "openSUSE Tumbleweed",
            "href": "./OS/linux/families/suse/opensuse/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/opensuse.png",
            "status": "active",
            "tier": "P1"
        },
        "linux-popos": {
            "id": "linux-popos",
            "displayName": "Pop!_OS",
            "href": "./OS/linux/families/debian/popos/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/popos.png",
            "status": "active",
            "tier": "P2"
        },
        "linux-anduinos": {
            "id": "linux-anduinos",
            "displayName": "AnduinOS",
            "href": "./OS/linux/families/debian/anduinos/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/anduin.png",
            "status": "active",
            "tier": "P3"
        },
        "linux-rocky": {
            "id": "linux-rocky",
            "displayName": "Rocky Linux (GNOME)",
            "href": "./OS/linux/families/redhat/rocky/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/rocky.png",
            "status": "active",
            "tier": "P1"
        },
        "linux-alma": {
            "id": "linux-alma",
            "displayName": "AlmaLinux (GNOME)",
            "href": "./OS/linux/families/redhat/alma/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/linux/debian.png",
            "status": "active",
            "tier": "P3"
        },
        "windows-95": {
            "id": "windows-95",
            "displayName": "Windows 95",
            "href": "./OS/windows/versions/95/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win95.png",
            "status": "planned",
            "tier": "P2"
        },
        "windows-98": {
            "id": "windows-98",
            "displayName": "Windows 98",
            "href": "./OS/windows/versions/98/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win98.png",
            "status": "planned",
            "tier": "P2"
        },
        "windows-me": {
            "id": "windows-me",
            "displayName": "Windows ME",
            "href": "./OS/windows/versions/me/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/winme.png",
            "status": "planned",
            "tier": "P2"
        },
        "windows-2000": {
            "id": "windows-2000",
            "displayName": "Windows 2000",
            "href": "./OS/windows/versions/2000/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win2000.png",
            "status": "planned",
            "tier": "P2"
        },
        "windows-xp": {
            "id": "windows-xp",
            "displayName": "Windows XP",
            "href": "./OS/windows/versions/xp/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/winxp.png",
            "status": "planned",
            "tier": "P1"
        },
        "windows-vista": {
            "id": "windows-vista",
            "displayName": "Windows Vista",
            "href": "./OS/windows/versions/vista/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/vista.png",
            "status": "planned",
            "tier": "P2"
        },
        "windows-7": {
            "id": "windows-7",
            "displayName": "Windows 7",
            "href": "./OS/windows/versions/7/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win7.png",
            "status": "planned",
            "tier": "P1"
        },
        "windows-8": {
            "id": "windows-8",
            "displayName": "Windows 8",
            "href": "./OS/windows/versions/8/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win8.png",
            "status": "planned",
            "tier": "P2"
        },
        "windows-8.1": {
            "id": "windows-8.1",
            "displayName": "Windows 8.1",
            "href": "./OS/windows/versions/8.1/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win8.png",
            "status": "planned",
            "tier": "P2"
        },
        "windows-10": {
            "id": "windows-10",
            "displayName": "Windows 10",
            "href": "./OS/windows/versions/10/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win10.png",
            "status": "active",
            "tier": "P0"
        },
        "windows-11": {
            "id": "windows-11",
            "displayName": "Windows 11",
            "href": "./OS/windows/versions/11/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/windows/win11.png",
            "status": "active",
            "tier": "P0"
        },
        "macos-sonoma": {
            "id": "macos-sonoma",
            "displayName": "macOS Sonoma",
            "href": "./OS/macos/sonoma/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/macos/sonoma.png",
            "status": "active",
            "tier": "P1"
        },
        "ios-15": {
            "id": "ios-15",
            "displayName": "iOS 15",
            "href": "./OS/ios/15/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/macos/sonoma.png",
            "status": "active",
            "tier": "P2"
        },
        "android-vanilla": {
            "id": "android-vanilla",
            "displayName": "Android (Vanilla Ice Cream)",
            "href": "./OS/android/index.html",
            "icon": "./usr/share/capsuleos/assets/images/platforms/pick-os/android/vanillaicecream.png",
            "status": "planned",
            "tier": "P1"
        }
    };

    const modal = document.getElementById('pick-modal');
    const modalTitle = document.getElementById('pick-modal-title');
    const modalList = document.getElementById('pick-modal-list');
    const modalClose = document.getElementById('pick-modal-close');
    const cards = document.querySelectorAll('.pick-card');
    const pickLead = document.querySelector('.pick-lead');

    if (pickLead && KERNEL_REBUILD) {
        pickLead.textContent = REBUILD_MESSAGE + ' Mode lab : ?devSkin=<id> (ex. ?devSkin=linux-mint).';
    }

    if (!modal || !modalTitle || !modalList) return;

    let activeCard = null;

    const resolveDevSkin = () => {
        const params = new URLSearchParams(location.search);
        const fromUrl = params.get('devSkin');
        if (fromUrl && devSkinIndex[fromUrl]) return fromUrl;
        try {
            const fromStorage = localStorage.getItem('CAPSULE_DEV_SKIN');
            if (fromStorage && devSkinIndex[fromStorage]) return fromStorage;
        } catch (_) { /* file:// */ }
        return null;
    };

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
            empty.textContent = KERNEL_REBUILD
                ? REBUILD_MESSAGE
                : 'Aucune distribution disponible pour le moment.';
            modalList.appendChild(empty);

            if (KERNEL_REBUILD && Object.keys(devSkinIndex).length) {
                const hint = document.createElement('li');
                hint.className = 'pick-modal-empty pick-modal-dev-hint';
                hint.textContent = 'Lab : ajoutez ?devSkin=linux-mint à l\'URL pour charger un skin archivé.';
                modalList.appendChild(hint);
            }
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

    const devSkinId = resolveDevSkin();
    if (devSkinId) {
        const target = devSkinIndex[devSkinId];
        if (target && confirm('Mode lab : charger « ' + target.displayName + ' » (statut ' + target.status + ') ?')) {
            location.replace(target.href);
            return;
        }
    }

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
