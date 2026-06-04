#!/usr/bin/env node
/**
 * Génère usr/lib/capsuleos/site/pick-os.js depuis etc/capsuleos/os-registry.json (S7)
 * Usage : node usr/lib/capsuleos/tools/build-pick-os.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const OUT = path.join(ROOT, 'usr/lib/capsuleos/site/pick-os.js');

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));

/** Depuis index.html à la racine du dépôt (pas de CapsuleResource sur le portail). */
const PORTAL_ASSETS = './usr/share/capsuleos/assets';

const ICON = {
  linux: `${PORTAL_ASSETS}/images/platforms/pick-os/linux/`,
  windows: `${PORTAL_ASSETS}/images/platforms/pick-os/windows/`,
  macos: `${PORTAL_ASSETS}/images/platforms/pick-os/macos/`,
  android: `${PORTAL_ASSETS}/images/platforms/pick-os/android/`,
  ios: `${PORTAL_ASSETS}/images/platforms/pick-os/ios/apple.svg`,
  bsd: `${PORTAL_ASSETS}/images/platforms/pick-os/linux/debian.png`,
};

const VENDOR_ICON = {
  mint: 'mint.png',
  ubuntu: 'ubuntu.png',
  fedora: 'fedora.png',
  debian: 'debian.png',
  mx: 'mx.png',
  opensuse: 'opensuse.png',
  popos: 'popos.png',
  anduin: 'debian.png',
  microsoft: (id) => {
    const ver = id.replace('windows-', '');
    const map = { 95: 'win95', 98: 'win98', me: 'winme', 2000: 'win2000', xp: 'winxp', vista: 'vista', 7: 'win7', 8: 'win8', '8.1': 'win8', 10: 'win10', 11: 'win11' };
    return `${map[ver] || 'win11'}.png`;
  },
  google: 'vanillaicecream.png',
  apple: 'sonoma.png',
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
};

const catalogKeys = ['linux', 'windows', 'macos', 'bsd', 'ios', 'android'];
const catalog = Object.fromEntries(catalogKeys.map((k) => [k, { label: k === 'ios' ? 'iOS' : k.charAt(0).toUpperCase() + k.slice(1), distros: [] }]));
catalog.linux.label = 'Linux';
catalog.bsd.label = 'BSD';

const resolveIcon = (entry) => {
  const { family, vendor, id } = entry;
  if (family === 'linux') {
    return `${ICON.linux}${VENDOR_ICON[vendor] || 'debian.png'}`;
  }
  if (family === 'windows') {
    const file = typeof VENDOR_ICON.microsoft === 'function' ? VENDOR_ICON.microsoft(id) : 'win11.png';
    return `${ICON.windows}${file}`;
  }
  if (family === 'macos') {
    return `${ICON.macos}sonoma.png`;
  }
  if (family === 'android') {
    return `${ICON.android}vanillaicecream.png`;
  }
  if (family === 'ios') {
    return ICON.ios;
  }
  return `${ICON.linux}debian.png`;
};

registry.entries
  .filter((e) => e.status === 'active' && e.facade)
  .sort((a, b) => {
    const tierOrder = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
    const ta = tierOrder[a.tier] ?? 9;
    const tb = tierOrder[b.tier] ?? 9;
    if (ta !== tb) return ta - tb;
    return a.displayName.localeCompare(b.displayName, 'fr');
  })
  .forEach((entry) => {
    const key = familyToCatalogKey[entry.family] || 'bsd';
    if (!catalog[key]) {
      return;
    }
    catalog[key].distros.push({
      name: entry.displayName,
      href: `./${entry.facade}`,
      icon: resolveIcon(entry),
    });
  });

const runtime = `(function () {
    const ICON = ${JSON.stringify(ICON, null, 4).replace(/^/gm, '    ')};

    const catalog = ${JSON.stringify(catalog, null, 4).replace(/^/gm, '    ')};

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
 * Regénérer : node usr/lib/capsuleos/tools/build-pick-os.mjs
 */
`;

fs.writeFileSync(OUT, banner + runtime, 'utf8');
console.log(`Écrit ${OUT}`);
