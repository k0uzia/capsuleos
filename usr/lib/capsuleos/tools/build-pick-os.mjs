#!/usr/bin/env node
/**
 * Génère usr/lib/capsuleos/site/pick-os.js depuis etc/capsuleos/os-registry.json.
 * Gel catalogue : catalogue vide ; devSkin via ?devSkin=<id> ou CAPSULE_DEV_SKIN.
 * Usage : node usr/lib/capsuleos/tools/build-pick-os.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolvePickIconPortalUrl } from './vendor-icon-resolution-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const OUT = path.join(ROOT, 'usr/lib/capsuleos/site/pick-os.js');
const ASSETS_ROOT = path.join(ROOT, 'usr/share/capsuleos/assets');

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));

const PORTAL_ASSETS = './usr/share/capsuleos/assets';

const ICON = {
  linux: `${PORTAL_ASSETS}/images/platforms/pick-os/linux/`,
  windows: `${PORTAL_ASSETS}/images/platforms/pick-os/windows/`,
  macos: `${PORTAL_ASSETS}/images/platforms/pick-os/macos/`,
  android: `${PORTAL_ASSETS}/images/platforms/pick-os/android/`,
  ios: `${PORTAL_ASSETS}/images/platforms/pick-os/ios/apple.svg`,
  bsd: `${PORTAL_ASSETS}/images/platforms/pick-os/linux/debian.png`,
};

const familyToCatalogKey = {
  linux: 'linux',
  windows: 'windows',
  macos: 'macos',
  android: 'android',
  ios: 'ios',
  bsd: 'bsd',
  chromeos: 'bsd',
  harmonyos: 'bsd',
  unix: 'bsd',
  retro: 'bsd',
  other: 'bsd',
};

const catalogKeys = ['linux', 'windows', 'macos', 'bsd', 'ios', 'android'];
const catalog = Object.fromEntries(catalogKeys.map((k) => [k, { label: k === 'ios' ? 'iOS' : k.charAt(0).toUpperCase() + k.slice(1), distros: [] }]));
catalog.linux.label = 'Linux';
catalog.bsd.label = 'BSD';

const resolveIcon = (entry) => resolvePickIconPortalUrl(entry);

// Catalogue public : entrées actives uniquement (0 pendant gel)
registry.entries
  .filter((e) => e.status === 'active' && e.referencePaths?.facade)
  .sort((a, b) => {
    const tierOrder = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
    return (tierOrder[a.tier] ?? 9) - (tierOrder[b.tier] ?? 9)
      || a.displayName.localeCompare(b.displayName, 'fr');
  })
  .forEach((entry) => {
    const key = familyToCatalogKey[entry.family] || 'bsd';
    if (!catalog[key]) return;
    catalog[key].distros.push({
      name: entry.displayName,
      href: `./${entry.referencePaths.facade}`,
      icon: resolveIcon(entry),
    });
  });

// Index devSkin : toutes entrées avec referencePaths.facade
const devSkinIndex = {};
registry.entries.forEach((entry) => {
  const facade = entry.referencePaths?.facade;
  if (!facade) return;
  devSkinIndex[entry.id] = {
    id: entry.id,
    displayName: entry.displayName,
    href: `./${facade}`,
    icon: resolveIcon(entry),
    status: entry.status,
    tier: entry.tier
  };
});

const runtime = `(function () {
    const KERNEL_REBUILD = ${JSON.stringify(registry.stats?.frozen === true)};
    const REBUILD_MESSAGE = 'Le noyau CapsuleOS est en reconstruction. Les bureaux seront réactivés progressivement après validation du noyau central.';
    const ICON = ${JSON.stringify(ICON, null, 4).replace(/^/gm, '    ')};

    const catalog = ${JSON.stringify(catalog, null, 4).replace(/^/gm, '    ')};

    const devSkinIndex = ${JSON.stringify(devSkinIndex, null, 4).replace(/^/gm, '    ')};

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
                hint.textContent = 'Lab : ajoutez ?devSkin=linux-mint à l\\'URL pour charger un skin archivé.';
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
                const card = document.querySelector(\`.pick-card[data-os="\${pickKey}"]\`);
                openModalForOs(pickKey, card);
                if (location.search.includes('pick=')) {
                    history.replaceState(null, '', \`\${location.pathname}#choisir-os\`);
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
`;

const banner = `/**
 * Portail pick-os (généré depuis etc/capsuleos/os-registry.json).
 * Gel noyau : catalogue public vide ; devSkin via ?devSkin=<registryId>.
 * Regénérer : node usr/lib/capsuleos/tools/build-pick-os.mjs
 */
`;

fs.writeFileSync(OUT, banner + runtime, 'utf8');
console.log(`Écrit ${OUT} — ${Object.values(catalog).reduce((n, c) => n + c.distros.length, 0)} entrées publiques, ${Object.keys(devSkinIndex).length} devSkin`);
