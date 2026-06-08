#!/usr/bin/env node
/**
 * Collecte manifeste distribution VM → proc/<registryId>/distribution-manifest.json
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-distribution-manifest.mjs --id linux-ubuntu --write --ssh
 */
import fs from 'fs';
import path from 'path';
import {
  runManifestOnVm,
  writeManifest,
  validateManifestStructure,
  manifestEntriesToDesktopRaw,
  loadManifestContract,
  pathsForManifest,
} from './vm-manifest-lib.mjs';
import { pathsForApps } from './apps-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false, ssh: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--ssh') opts.ssh = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  if (!opts.ssh) {
    const existing = pathsForManifest(opts.id).manifest;
    if (fs.existsSync(existing)) {
      process.stdout.write(fs.readFileSync(existing, 'utf8'));
      return;
    }
    console.error('Manifeste absent — relancer avec --ssh');
    process.exit(1);
  }

  const contract = loadManifestContract();
  const manifest = runManifestOnVm(opts.id);
  manifest.registryId = opts.id;

  const errors = validateManifestStructure(manifest, contract);
  if (errors.length) {
    console.error(`⚠ manifeste structure: ${errors.join('; ')}`);
  }

  if (opts.write) {
    const paths = writeManifest(opts.id, manifest);
    const rawPath = path.join(paths.procDir, 'desktop-entries-raw.json');
    const rawPayload = {
      version: 2,
      registryId: opts.id,
      collectedAt: manifest.collectedAt,
      source: 'distribution-manifest',
      entryCount: manifest.applications.entryCount,
      entries: manifestEntriesToDesktopRaw(manifest),
    };
    fs.writeFileSync(rawPath, `${JSON.stringify(rawPayload, null, 2)}\n`);
    fs.writeFileSync(
      path.join(paths.procDir, 'scrape-meta.json'),
      `${JSON.stringify({
        version: 2,
        registryId: opts.id,
        collectedAt: manifest.collectedAt,
        source: 'collect-vm-distribution-manifest.mjs',
        manifestPath: paths.manifest.replace(`${ROOT}/`, ''),
        searchPaths: manifest.applications.searchPaths,
        gridVisible: manifest.applications.gridVisibleCount,
        total: manifest.applications.uniqueCount,
      }, null, 2)}\n`,
    );

    const alias = manifest.distribution?.slug || 'distribution-manifest';
    console.log(`✓ manifeste → ${paths.manifest.replace(`${ROOT}/`, '')}`);
    console.log(`✓ alias → proc/${opts.id}/${alias}.json`);
    console.log(`  apps grille: ${manifest.applications.gridVisibleCount} / ${manifest.applications.uniqueCount} uniques`);
    console.log(`  flatpak: ${manifest.applications.flatpak?.length || 0}`);
    const m = manifest.media || {};
    console.log(`  médias: fonts=${m.fonts?.entryCount || 0} mime=${m.mimetypes?.entryCount || 0} places=${m.places?.entryCount || 0} emblems=${m.emblems?.entryCount || 0} symbolic=${m.symbolic?.entryCount || 0} wallpapers=${m.wallpapers?.length || 0}`);
    console.log(`  bundles import: ${manifest.import?.bundleCount || manifest.import?.bundles?.length || 0}`);
  } else {
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  }
};

main();
