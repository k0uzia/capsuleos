/**
 * Dérive registryOverrides.apps depuis data-link / overview du skin.
 * Usage interne — voir generate-registry-overrides.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSkinPlacements, skinIndexPath } from './apps-catalog-lib.mjs';
import { loadRegistryEntry, ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Slots shell → vmId desktop par défaut (sans inventaire VM). */
const SLOT_VM_ID = {
  nemo: 'org.gnome.Nautilus',
  firefox: 'firefox',
  terminal: 'org.gnome.Ptyxis',
  themes: 'org.gnome.Settings',
  update_manager: 'org.gnome.Software',
  text_editor: 'org.gnome.TextEditor',
  calculator: 'org.gnome.Calculator',
  calendar: 'org.gnome.Calendar',
  clocks: 'org.gnome.clocks',
  librewriter: 'libreoffice-writer',
  lecteur_multimedia: 'org.gnome.Rhythmbox3',
  spectacle: 'org.kde.spectacle',
  kinfocenter: 'org.kde.kinfocenter',
  system_monitor: 'org.kde.systemmonitor',
};

const KDE_SLOT_VM_ID = {
  nemo: 'org.kde.dolphin',
  terminal: 'org.kde.konsole',
  themes: 'org.kde.systemsettings',
  update_manager: 'org.kde.discover',
  text_editor: 'org.kde.kate',
  librewriter: 'libreoffice-writer',
};

const SLOT_LABEL_FR = {
  nemo: 'Fichiers',
  firefox: 'Firefox',
  terminal: 'Terminal',
  themes: 'Paramètres',
  update_manager: 'Logiciels',
  text_editor: 'Éditeur de texte',
  calculator: 'Calculatrice',
  calendar: 'Agenda',
  clocks: 'Horloges',
  librewriter: 'LibreOffice Writer',
  lecteur_multimedia: 'Lecteur vidéo',
  spectacle: 'Spectacle',
  kinfocenter: 'Informations système',
  system_monitor: 'Moniteur système',
  mintinstall: 'Logithèque',
};

const KDE_SLOT_LABEL_FR = {
  nemo: 'Dolphin',
  terminal: 'Konsole',
  themes: 'Configuration du système',
  update_manager: 'Discover',
  text_editor: 'Kate',
};

const P0_SLOTS = new Set([
  'nemo', 'firefox', 'terminal', 'themes', 'update_manager', 'text_editor',
  'calculator', 'lecteur_multimedia', 'mintinstall',
]);

const COSMIC_SLOT_VM_ID = {
  nemo: 'com.system76.CosmicFiles',
  terminal: 'com.system76.CosmicTerm',
  themes: 'com.system76.CosmicSettings',
  update_manager: 'pop-shop',
  text_editor: 'com.system76.CosmicEdit',
  lecteur_multimedia: 'com.system76.CosmicPlayer',
};

const parseExtendedPlacements = (indexHtml) => {
  const dockLinks = new Set();
  const gridLinks = new Set();
  let m;
  const cosmicDockRe = /cosmic-dock[^>]*data-link="([^"]+)"/g;
  while ((m = cosmicDockRe.exec(indexHtml)) !== null) dockLinks.add(m[1]);

  const cosmicGridRe = /data-cosmic-app-link="([^"]+)"/g;
  while ((m = cosmicGridRe.exec(indexHtml)) !== null) gridLinks.add(m[1]);

  const anduinDockRe = /anduin-taskbar[^>]*data-link="([^"]+)"/g;
  while ((m = anduinDockRe.exec(indexHtml)) !== null) dockLinks.add(m[1]);

  const taskbarRe = /taskbar-pins[^>]*data-link="([^"]+)"/g;
  while ((m = taskbarRe.exec(indexHtml)) !== null) dockLinks.add(m[1]);

  return { dockLinks: [...dockLinks], gridLinks: [...gridLinks] };
};

const resolveVmId = (slot, toolkitId) => {
  if (toolkitId === 'cosmic') {
    return COSMIC_SLOT_VM_ID[slot] || SLOT_VM_ID[slot] || slot;
  }
  if (toolkitId === 'kde') {
    return KDE_SLOT_VM_ID[slot] || slot;
  }
  return SLOT_VM_ID[slot] || slot;
};

const COSMIC_SLOT_LABEL_FR = {
  nemo: 'Fichiers',
  text_editor: 'Éditeur de texte',
  terminal: 'Terminal',
  themes: 'Paramètres',
  update_manager: 'Pop Shop',
  lecteur_multimedia: 'Lecteur multimédia',
};

const resolveLabel = (slot, toolkitId) => {
  if (toolkitId === 'cosmic') {
    return COSMIC_SLOT_LABEL_FR[slot] || SLOT_LABEL_FR[slot] || slot;
  }
  if (toolkitId === 'kde') {
    return KDE_SLOT_LABEL_FR[slot] || SLOT_LABEL_FR[slot] || slot;
  }
  return SLOT_LABEL_FR[slot] || slot;
};

const slotInToolkitSpecs = (contract, toolkitId, slot) =>
  !!(contract.toolkits?.[toolkitId]?.slotSpecs?.[slot]);

/**
 * @param {string} registryId
 * @param {object} contract apps-catalog.json
 * @returns {{ toolkit: string, apps: Record<string, object> }}
 */
export const buildOverridesFromSkin = (registryId, contract) => {
  const entry = loadRegistryEntry(registryId);
  const toolkitId = entry.toolkit?.id || 'gnome';
  const indexPath = skinIndexPath(registryId);
  const html = fs.readFileSync(indexPath, 'utf8');
  const placements = parseSkinPlacements(html);
  const extended = parseExtendedPlacements(html);
  const windowSlots = new Set(placements.windowSlots);
  const specsToolkit = toolkitId === 'cosmic' ? 'gnome' : toolkitId;

  const apps = {};
  for (const slot of windowSlots) {
    if (['mainMenu', 'profile', 'checklist'].includes(slot)) continue;

    const vmId = resolveVmId(slot, toolkitId);
    const priorite = P0_SLOTS.has(slot) ? 'P0' : 'P1';
    const hasSpecs = slotInToolkitSpecs(contract, specsToolkit, slot);
    const onDock = placements.dockLinks.includes(slot) || extended.dockLinks.includes(slot);
    const onGrid = placements.overviewLinks.includes(slot) || extended.gridLinks.includes(slot);
    const placement = {
      dash: placements.dashLinks.includes(slot) || onDock,
      overview: onGrid,
      dock: onDock,
      desktop: placements.desktopLinks.includes(slot),
    };

    apps[vmId] = {
      labelFr: resolveLabel(slot, toolkitId),
      priorite,
      slot,
      statut: hasSpecs ? 'ok' : 'partiel',
      requiresSlot: priorite === 'P0' || priorite === 'P1',
      placement,
    };
  }

  return { toolkit: toolkitId, apps };
};

export const mergeStoreInstallable = (registryId, apps, storeContract) => {
  const merged = { ...apps };
  for (const app of storeContract.apps || []) {
    const src = app.sources?.[registryId];
    if (!src || src.storeInstallable !== true) continue;

    const vmId = src.flatpak || src.deb || src.rpm || src.snap || app.storeCatalog?.id || app.slot;
    if (merged[vmId]) {
      merged[vmId] = {
        ...merged[vmId],
        storeInstallable: true,
        defaultInstalled: src.defaultInstalled === true,
        onVm: src.defaultInstalled !== false,
      };
      continue;
    }

    const slot = app.slot;
    merged[vmId] = {
      labelFr: app.labelFr,
      priorite: app.recommendation?.startsWith('P1') ? 'P1' : 'P2',
      slot,
      statut: 'ok',
      requiresSlot: true,
      placement: app.storeCatalog?.placement || { overview: true },
      onVm: false,
      storeInstallable: true,
      defaultInstalled: false,
      note: `Extension magasin — ${registryId}`,
    };
  }
  return merged;
};

export const capsuleOnlyFor = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const name = entry.displayName || registryId;
  const out = [
    { slot: 'checklist', labelFr: 'Missions CapsuleOS', statut: 'capsuleOnly' },
    { slot: 'profile', labelFr: `À propos ${name}`, statut: 'ok', placement: { desktop: true } },
  ];
  if (entry.toolkit?.id === 'gnome' || entry.toolkit?.id === 'cosmic') {
    out.push({
      slot: 'screenshot',
      labelFr: 'Capture d\'écran',
      statut: 'ok',
      placement: { quickSettings: true, overviewSearch: true },
    });
  }
  return out;
};
