#!/usr/bin/env node
/**
 * Collecte inventaire applications VM → *-vm-apps-installed.json (tous registryId).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-rocky --write
 *   node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-rocky --write --ssh
 */
import fs from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathsForApps, loadAppsContract } from './apps-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const collectViaSsh = (registryId) => {
  const script = [
    'set -e',
    'for f in /usr/share/applications/org.gnome.*.desktop /usr/share/applications/firefox.desktop; do',
    '  [ -f "$f" ] || continue',
    '  id=$(basename "$f" .desktop)',
    '  name=$(grep -m1 "^Name=" "$f" | cut -d= -f2-)',
    '  echo "$id|$name"',
    'done',
  ].join('\n');
  const res = spawnSync(process.execPath, [
    path.join(__dirname, 'lab-ssh.mjs'),
    '--id', registryId,
    '--cmd', script,
  ], { cwd: ROOT, encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`SSH collect échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  const installed = [];
  for (const line of (res.stdout || '').split('\n')) {
    const t = line.trim();
    if (!t || !t.includes('|')) continue;
    const [id, name] = t.split('|');
    installed.push({ id, name, capsuleSlot: null, grid: true });
  }
  return installed;
};

const mergeOverride = (registryId, installed) => {
  const contract = loadAppsContract();
  const apps = contract.registryOverrides?.[registryId]?.apps || {};
  return installed.map((row) => {
    const spec = apps[row.id];
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

  if (opts.ssh) {
    base.installed = mergeOverride(opts.id, collectViaSsh(opts.id));
    base.source = 'lab-ssh.mjs — /usr/share/applications';
    base.collectedAt = new Date().toISOString();
  } else if (!base.installed?.length) {
    console.error(`Aucun inventaire — lancer avec --ssh ou créer ${paths.vmAppsInstalled}`);
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
