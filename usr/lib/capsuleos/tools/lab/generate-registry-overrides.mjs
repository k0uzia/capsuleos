#!/usr/bin/env node
/**
 * Générateur unifié registryOverrides — bootstrap par registryId.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-registry-overrides.mjs --id linux-popos --write
 *   node usr/lib/capsuleos/tools/lab/generate-registry-overrides.mjs --id linux-mint --write
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadAppsContract } from './apps-catalog-lib.mjs';
import { loadStoreContract } from './capsule-app-resolver.mjs';
import {
  buildOverridesFromSkin,
  capsuleOnlyFor,
  mergeStoreInstallable,
} from './generate-registry-overrides-from-skin.mjs';
import { loadRegistryEntry, ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/apps-catalog.json');

const GNOME_DERIVED = {
  'linux-anduinos': {
    toolkit: 'gnome',
    vmAppsSource: null,
    extends: 'linux-ubuntu',
    storeRegistry: 'linux-anduinos',
  },
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: null, write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  if (!opts.id) throw new Error('--id <registryId> requis');
  return opts;
};

const cloneApps = (sourceId) => {
  const contract = loadAppsContract();
  const src = contract.registryOverrides?.[sourceId];
  if (!src?.apps) throw new Error(`registryOverrides source absent: ${sourceId}`);
  return JSON.parse(JSON.stringify(src.apps));
};

export const buildRegistryOverrides = (registryId) => {
  if (registryId === 'linux-mint') {
    throw new Error('Utiliser generate-mint-registry-overrides.mjs pour linux-mint');
  }

  const contract = loadAppsContract();
  const store = loadStoreContract();
  const entry = loadRegistryEntry(registryId);
  const spec = GNOME_DERIVED[registryId];

  if (spec?.extends) {
    const apps = cloneApps(spec.extends);
    const merged = mergeStoreInstallable(spec.storeRegistry || registryId, apps, store);
    return {
      toolkit: spec.toolkit || entry.toolkit?.id || 'gnome',
      vmAppsSource: spec.vmAppsSource,
      apps: merged,
      capsuleOnly: capsuleOnlyFor(registryId),
    };
  }

  const fromSkin = buildOverridesFromSkin(registryId, contract);
  let apps = fromSkin.apps;

  apps = mergeStoreInstallable(spec?.storeRegistry || registryId, apps, store);

  return {
    toolkit: spec?.toolkit || fromSkin.toolkit,
    vmAppsSource: spec?.vmAppsSource || null,
    apps,
    capsuleOnly: capsuleOnlyFor(registryId),
  };
};

const writeContract = (registryId, override) => {
  const contract = loadAppsContract();
  contract.registryOverrides = contract.registryOverrides || {};
  contract.registryOverrides[registryId] = override;
  const cleaned = { ...override };
  if (!cleaned.vmAppsSource) delete cleaned.vmAppsSource;
  contract.registryOverrides[registryId] = cleaned;
  fs.writeFileSync(CONTRACT_PATH, `${JSON.stringify(contract, null, 2)}\n`);
};

const main = () => {
  const opts = parseArgs();

  if (opts.id === 'linux-mint') {
    const res = spawnSync(process.execPath, [
      path.join(__dirname, 'generate-mint-registry-overrides.mjs'),
      ...(opts.write ? ['--write'] : []),
    ], { cwd: ROOT, stdio: 'inherit' });
    process.exit(res.status ?? 1);
  }

  const override = buildRegistryOverrides(opts.id);
  const count = Object.keys(override.apps).length;

  if (opts.write) {
    writeContract(opts.id, override);
    console.log(`✓ registryOverrides.${opts.id} — ${count} apps`);
  } else {
    process.stdout.write(`${JSON.stringify(override, null, 2)}\n`);
    console.error(`(dry-run) ${count} apps`);
  }
};

main();
