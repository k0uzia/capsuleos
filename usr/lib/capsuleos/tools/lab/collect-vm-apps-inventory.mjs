#!/usr/bin/env node
/**
 * Collecte inventaire applications VM → AppV (dérivé du manifeste distribution).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-distribution-manifest.mjs --id linux-ubuntu --write --ssh
 *   node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-ubuntu --write
 *   node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-ubuntu --write --ssh
 */
import fs from 'fs';
import path from 'path';
import { pathsForApps, loadAppsContract } from './apps-catalog-lib.mjs';
import {
  loadManifest,
  manifestToInstalledApps,
  runManifestOnVm,
  writeManifest,
  manifestEntriesToDesktopRaw,
} from './vm-manifest-lib.mjs';
import {
  collectDesktopEntriesViaSsh,
  entriesToInstalled,
  writeProcRawDump,
} from './vm-desktop-scrape-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', write: false, ssh: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--ssh') opts.ssh = true;
  }
  return opts;
};

const mergeOverride = (registryId, installed) => {
  const contract = loadAppsContract();
  const apps = contract.registryOverrides?.[registryId]?.apps || {};
  return installed.map((row) => {
    const spec = apps[row.id] || apps[row.desktopId];
    return {
      ...row,
      capsuleSlot: spec?.slot ?? row.capsuleSlot,
      dash: spec?.placement?.dash ?? row.dash ?? false,
      grid: spec?.placement?.overview ?? row.grid ?? true,
    };
  });
};

const main = () => {
  const opts = parseArgs();
  const paths = pathsForApps(opts.id);
  let base = fs.existsSync(paths.vmAppsInstalled)
    ? JSON.parse(fs.readFileSync(paths.vmAppsInstalled, 'utf8'))
    : { version: 1, registryId: opts.id, installed: [], notInstalledOnVm: [] };

  let manifest = loadManifest(opts.id);

  if (opts.ssh) {
    manifest = runManifestOnVm(opts.id);
    manifest.registryId = opts.id;
    const paths = writeManifest(opts.id, manifest);
    const rawPath = path.join(paths.procDir, 'desktop-entries-raw.json');
    fs.writeFileSync(rawPath, `${JSON.stringify({
      version: 2,
      registryId: opts.id,
      collectedAt: manifest.collectedAt,
      source: 'distribution-manifest',
      entryCount: manifest.applications.entryCount,
      entries: manifestEntriesToDesktopRaw(manifest),
    }, null, 2)}\n`);
    console.log(`✓ manifeste → ${paths.manifest.replace(`${ROOT}/`, '')}`);
  }

  if (manifest) {
    const installed = mergeOverride(opts.id, manifestToInstalledApps(opts.id, manifest));
    base.installed = installed;
    base.source = 'distribution-manifest → vm-manifest-lib.mjs';
    base.manifestPath = `proc/${opts.id}/distribution-manifest.json`;
    base.collectedAt = manifest.collectedAt;
    base.flatpakCount = manifest.applications?.flatpak?.length || 0;

    const rawEntries = manifestEntriesToDesktopRaw(manifest);
    writeProcRawDump(opts.id, rawEntries, {
      gridVisible: manifest.applications?.gridVisibleCount,
      total: manifest.applications?.uniqueCount,
      source: 'distribution-manifest',
    });
  } else if (opts.ssh) {
    const rawEntries = collectDesktopEntriesViaSsh(opts.id);
    writeProcRawDump(opts.id, rawEntries);
    base.installed = mergeOverride(opts.id, entriesToInstalled(rawEntries));
    base.source = 'vm-desktop-scrape-lib.mjs (fallback legacy)';
    base.collectedAt = new Date().toISOString();
  } else if (!base.installed?.length) {
    console.error(`Aucun inventaire — lancer collect-vm-distribution-manifest.mjs --id ${opts.id} --write --ssh`);
    process.exit(1);
  }

  base.registryId = opts.id;
  base.updatedAt = new Date().toISOString();

  if (opts.write) {
    fs.writeFileSync(paths.vmAppsInstalled, `${JSON.stringify(base, null, 2)}\n`);
    console.log(`✓ écrit ${paths.vmAppsInstalled.replace(`${ROOT}/`, '')} (${base.installed.length} apps)`);
  } else {
    process.stdout.write(`${JSON.stringify(base, null, 2)}\n`);
  }
};

main();
