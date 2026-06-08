#!/usr/bin/env node
/**
 * Import lot médias VM via rsync — nécessite manifeste validation.status=approved.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/import-vm-manifest-assets.mjs --id linux-ubuntu --write
 *   node usr/lib/capsuleos/tools/lab/import-vm-manifest-assets.mjs --id linux-ubuntu --write --force
 */
import fs from 'fs';
import path from 'path';
import {
  loadManifest,
  writeManifest,
  loadLabHost,
  identitiesForHost,
  rsyncFromVm,
} from './vm-manifest-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false, force: false, bundle: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--force') opts.force = true;
    else if (args[i] === '--bundle' && args[i + 1]) opts.bundle = args[++i];
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const manifest = loadManifest(opts.id);
  if (!manifest) {
    console.error(`Manifeste absent — collect-vm-distribution-manifest.mjs --id ${opts.id} --write --ssh`);
    process.exit(1);
  }

  const approved = manifest.validation?.approved || manifest.validation?.status === 'approved';
  if (!approved && !opts.force) {
    console.error('Import bloqué — manifeste non approuvé. Lancer approve-vm-distribution-manifest.mjs ou --force');
    process.exit(1);
  }

  const host = loadLabHost(opts.id);
  const identities = identitiesForHost(host);
  if (!identities.length) {
    console.error('Aucune identité SSH lab');
    process.exit(1);
  }
  const identity = identities[0];

  const bundles = (manifest.import?.bundles || []).filter((b) => (
    !opts.bundle || b.id === opts.bundle
  ));

  if (!bundles.length) {
    console.error('Aucun bundle import dans le manifeste');
    process.exit(1);
  }

  const results = [];
  for (const bundle of bundles) {
    const destRoot = path.join(ROOT, bundle.destRoot);
    fs.mkdirSync(destRoot, { recursive: true });
    for (const vmPath of bundle.vmPaths || []) {
      const base = path.basename(vmPath);
      const localPath = path.join(destRoot, base);
      if (!opts.write) {
        results.push({ bundle: bundle.id, vmPath, localPath, dryRun: true });
        continue;
      }
      let ok = false;
      let lastErr = '';
      for (let i = 0; i < identities.length; i += 1) {
        const r = rsyncFromVm(host, vmPath, localPath, identities[i]);
        if (r.ok) {
          ok = true;
          results.push({ bundle: bundle.id, vmPath, localPath, ok: true });
          console.log(`✓ ${bundle.id}: ${base}`);
          break;
        }
        lastErr = r.error;
      }
      if (!ok) {
        results.push({ bundle: bundle.id, vmPath, ok: false, error: lastErr });
        console.error(`✗ ${bundle.id}: ${vmPath} — ${lastErr}`);
      }
    }
  }

  if (opts.write) {
    const vendor = manifest.distribution?.id || 'unknown';
    const sourceTxt = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors', vendor, 'SOURCE-VM.txt');
    fs.mkdirSync(path.dirname(sourceTxt), { recursive: true });
    fs.writeFileSync(sourceTxt, [
      `# Import manifeste ${opts.id}`,
      `collectedAt: ${manifest.collectedAt}`,
      `importedAt: ${new Date().toISOString()}`,
      `ssh: ${host.ssh}`,
      `bundles: ${bundles.map((b) => b.id).join(', ')}`,
      '',
    ].join('\n'));

    manifest.import.status = 'completed';
    manifest.import.completedAt = new Date().toISOString();
    manifest.import.lastResults = results;
    writeManifest(opts.id, manifest);
    console.log(`✓ SOURCE-VM.txt → images/vendors/${vendor}/`);
  } else {
    console.log('Dry-run — ajouter --write pour rsync');
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  }
};

main();
