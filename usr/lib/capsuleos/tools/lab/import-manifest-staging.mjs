#!/usr/bin/env node
/**
 * Import lot depuis le dossier staging VM → usr/share/capsuleos/assets/
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/import-manifest-staging.mjs --id linux-ubuntu --write
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  loadPlaybook,
  writePlaybook,
  capsuleAssetPath,
  stagingRemoteDir,
} from './manifest-playbook-lib.mjs';
import { loadLabHost, identitiesForHost } from './vm-manifest-lib.mjs';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const playbook = loadPlaybook(opts.id);
  if (!playbook) {
    console.error('Playbook absent');
    process.exit(1);
  }
  if (playbook.staging?.status !== 'completed' && opts.write) {
    console.error('Staging VM non terminé — run-manifest-staging-on-vm.mjs --write');
    process.exit(1);
  }

  const host = loadLabHost(opts.id);
  const identities = identitiesForHost(host);
  const remote = stagingRemoteDir(opts.id);
  const localStaging = path.join(ROOT, 'proc', opts.id, 'staging');
  fs.mkdirSync(localStaging, { recursive: true });

  let pulled = false;
  for (const identity of identities) {
    const sshCmd = `ssh -o BatchMode=yes -o IdentitiesOnly=yes -i ${identity}`;
    const res = spawnSync('rsync', [
      '-az', '--ignore-missing-args',
      '-e', sshCmd,
      `${host.ssh}:${remote}/`,
      `${localStaging}/`,
    ], { encoding: 'utf8' });
    if (res.status === 0) {
      pulled = true;
      break;
    }
  }

  if (!pulled) {
    console.error('rsync staging VM échec');
    process.exit(1);
  }

  console.log(`✓ rsync → ${localStaging.replace(`${ROOT}/`, '')}`);

  const stagingManifestPath = path.join(localStaging, 'staging-manifest.json');
  const stagingManifest = fs.existsSync(stagingManifestPath)
    ? JSON.parse(fs.readFileSync(stagingManifestPath, 'utf8'))
    : { files: [] };

  const integrated = [];
  for (const file of stagingManifest.files || []) {
    const src = path.join(localStaging, file.stagingPath);
    if (!fs.existsSync(src) || !file.capsuleRelative) continue;
    const dest = capsuleAssetPath(file.capsuleRelative);
    if (opts.write) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      integrated.push({ from: file.stagingPath, to: dest.replace(`${ROOT}/`, '') });
      console.log(`  ✓ ${path.basename(dest)}`);
    } else {
      integrated.push({ from: file.stagingPath, to: file.capsuleRelative, dryRun: true });
    }
  }

  if (opts.write) {
    const vendor = playbook.mediaCatalog?.vendor
      || loadRegistryEntry(opts.id).vendor
      || playbook.distribution?.id
      || 'unknown';
    const sourceTxt = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors', vendor, 'SOURCE-VM.txt');
    fs.mkdirSync(path.dirname(sourceTxt), { recursive: true });
    fs.appendFileSync(sourceTxt, `\n# import-manifest-staging ${new Date().toISOString()}\nfiles: ${integrated.length}\n`);

    playbook.import.status = 'completed';
    playbook.import.completedAt = new Date().toISOString();
    playbook.phases = (playbook.phases || []).map((p) => (
      p.id === 'import' ? { ...p, status: 'done' } : p
    ));
    writePlaybook(opts.id, playbook);
  } else {
    console.log(`Dry-run — ${integrated.length} fichier(s) à intégrer ; ajouter --write`);
  }
};

main();
