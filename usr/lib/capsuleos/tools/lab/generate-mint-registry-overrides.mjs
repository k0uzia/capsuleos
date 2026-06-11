#!/usr/bin/env node
/**
 * Bootstrap / étend registryOverrides.linux-mint depuis linux-mint-apps-catalog.json.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-mint-registry-overrides.mjs
 *   node usr/lib/capsuleos/tools/lab/generate-mint-registry-overrides.mjs --write
 *   node usr/lib/capsuleos/tools/lab/generate-mint-registry-overrides.mjs --write --p0-only
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadAppsContract } from './apps-catalog-lib.mjs';
import { loadStoreContract } from './capsule-app-resolver.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/apps-catalog.json');
const MINT_CATALOG = path.join(ROOT, 'root/docs/inventaires/linux-mint-apps-catalog.json');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { write: false, p0Only: false };
  for (const a of args) {
    if (a === '--write') opts.write = true;
    if (a === '--p0-only') opts.p0Only = true;
  }
  return opts;
};

const vmIdFromDesktop = (desktop) => {
  if (!desktop || desktop === '—') return null;
  return desktop.replace(/\.desktop$/i, '');
};

const buildPlacement = (row) => {
  const placement = {};
  if (row.panel) placement.dash = true;
  if (row.menuMint) placement.overview = true;
  if (row.tray) placement.quickSettings = true;
  if (row.favoriBureau) placement.desktop = true;
  if (!Object.keys(placement).length && row.slotCapsule) {
    placement.overview = true;
  }
  return placement;
};

export const buildMintRegistryOverrides = (opts = {}) => {
  const catalog = JSON.parse(fs.readFileSync(MINT_CATALOG, 'utf8'));
  const store = loadStoreContract();
  const apps = {};
  const seenVm = new Set();

  for (const row of catalog.rows || []) {
    if (row.statut !== 'ok' || !row.slotCapsule) continue;
    if (opts.p0Only && row.priorite !== 'P0') continue;

    const vmId = vmIdFromDesktop(row.desktop);
    if (!vmId || seenVm.has(vmId)) continue;
    seenVm.add(vmId);

    const requiresSlot = row.priorite === 'P0' || row.priorite === 'P1';
    apps[vmId] = {
      labelFr: row.labelFr,
      priorite: row.priorite || 'P2',
      slot: row.slotCapsule,
      statut: 'ok',
      requiresSlot,
      placement: buildPlacement(row),
    };
    if (row.note) apps[vmId].note = row.note;
  }

  for (const app of store.apps || []) {
    const src = app.sources?.['linux-mint'];
    if (!src) continue;
    const vmId = src.apt || src.flatpak || app.slot;
    if (apps[vmId]) {
      if (src.storeInstallable) apps[vmId].storeInstallable = true;
      if (src.defaultInstalled === false) apps[vmId].onVm = false;
      continue;
    }
    if (src.storeInstallable !== true) continue;
    apps[vmId] = {
      labelFr: app.labelFr,
      priorite: 'P1',
      slot: app.slot,
      statut: 'ok',
      requiresSlot: true,
      placement: app.storeCatalog?.placement || { overview: true },
      onVm: false,
      storeInstallable: true,
      defaultInstalled: false,
      note: 'Extension magasin Mint',
    };
  }

  const capsuleOnly = [
    { slot: 'checklist', labelFr: 'Missions CapsuleOS', statut: 'capsuleOnly' },
    { slot: 'profile', labelFr: 'À propos Linux Mint', statut: 'ok', placement: { desktop: true } },
    { slot: 'screenshot', labelFr: 'Capture d\'écran', statut: 'ok', placement: { quickSettings: true } },
  ];

  return {
    toolkit: 'cinnamon',
    vmAppsSource: 'root/docs/inventaires/linux-mint-vm-apps-installed.json',
    apps,
    capsuleOnly,
  };
};

const writeContract = (override) => {
  const contract = loadAppsContract();
  contract.registryOverrides = contract.registryOverrides || {};
  contract.registryOverrides['linux-mint'] = override;
  fs.writeFileSync(CONTRACT_PATH, `${JSON.stringify(contract, null, 2)}\n`);
};

const main = () => {
  const opts = parseArgs();
  const override = buildMintRegistryOverrides(opts);
  const count = Object.keys(override.apps).length;

  if (opts.write) {
    writeContract(override);
    console.log(`✓ registryOverrides.linux-mint — ${count} apps écrites dans apps-catalog.json`);
  } else {
    process.stdout.write(`${JSON.stringify(override, null, 2)}\n`);
    console.error(`(dry-run) ${count} apps — utiliser --write pour persister`);
  }
};

main();
