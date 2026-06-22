#!/usr/bin/env node
/**
 * Pull theme-previews depuis preview.png Plasma LookAndFeel (VM KDE Neon).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/pull-kde-neon-settings-theme-previews.mjs --write
 *   node usr/lib/capsuleos/tools/lab/pull-kde-neon-settings-theme-previews.mjs --write --only appearance-oxygen-vm.png
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const MANIFEST = path.join(ROOT, 'root/tools/lab/kde-neon-settings-theme-previews-manifest.json');
const write = process.argv.includes('--write');
const onlyIdx = process.argv.indexOf('--only');
const onlyOut = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const destBase = path.join(ROOT, manifest.destDir);
const archiveDir = path.join(path.dirname(destBase), 'source-previews');
const sshTarget = process.env.KDE_NEON_SSH || 'capsule@192.168.1.84';
const identity = process.env.KDE_NEON_SSH_IDENTITY || `${process.env.HOME}/.ssh/capsuleos-lab`;
const sshOpts = ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity];

if (write) fs.mkdirSync(destBase, { recursive: true });
if (write) fs.mkdirSync(archiveDir, { recursive: true });

const assets = onlyOut
  ? manifest.assets.filter((asset) => asset.out === onlyOut)
  : manifest.assets;

if (onlyOut && !assets.length) {
  console.error(`pull-kde-neon-settings-theme-previews — inconnu : ${onlyOut}`);
  process.exit(1);
}

const errors = [];
const pulled = [];

const ARCHIVE_BY_OUT = {
  'appearance-oxygen-vm.png': 'oxygen-lnf-vm-preview.png',
  'appearance-twilight-vm.png': 'twilight-lnf-vm-preview.png',
};

for (const asset of assets) {
  const remote = asset.vm;
  const local = path.join(destBase, asset.out);
  const archiveName = ARCHIVE_BY_OUT[asset.out];
  const archiveLocal = archiveName ? path.join(archiveDir, archiveName) : null;
  if (!write) {
    console.log(`[dry-run] ${asset.out} ← ${remote}`);
    continue;
  }
  const check = spawnSync('ssh', [...sshOpts, sshTarget, `test -r '${remote}'`], { encoding: 'utf8' });
  if (check.status !== 0) {
    errors.push(`absent VM: ${remote} (${asset.label})`);
    continue;
  }
  const scp = spawnSync('scp', [...sshOpts, `${sshTarget}:${remote}`, local], { encoding: 'utf8' });
  if (scp.status !== 0) {
    errors.push(`scp échec: ${asset.out}`);
    continue;
  }
  if (archiveLocal) {
    fs.copyFileSync(local, archiveLocal);
  }
  const size = fs.statSync(local).size;
  if (size < 1000) {
    errors.push(`${asset.out}: fichier trop petit (${size} o)`);
    continue;
  }
  pulled.push({ out: asset.out, vm: remote, bytes: size });
  console.log(`  ✓ ${asset.out} ← ${remote} (${size} o)`);
}

if (write) {
  const sourceTxt = path.join(path.dirname(destBase), 'SOURCE-VM.txt');
  fs.writeFileSync(sourceTxt, [
    `Theme-previews System Settings — preview.png Plasma LookAndFeel (${new Date().toISOString()}).`,
    `VM : ${sshTarget}`,
    'Manifeste : root/tools/lab/kde-neon-settings-theme-previews-manifest.json',
    'Procédure : bash root/tools/lab/pull-kde-neon-settings-theme-previews.sh',
    '',
    'Fichiers :',
    ...pulled.map((p) => `- ${p.out} ← ${p.vm} (${p.bytes} o)`),
    '',
    manifest.note || '',
    '',
  ].join('\n'));
}

if (errors.length) {
  console.error('pull-kde-neon-settings-theme-previews — échec');
  errors.forEach((e) => console.error(`  • ${e}`));
  process.exit(1);
}

console.log(`${write ? '✓' : '→'} pull-kde-neon-settings-theme-previews — ${assets.length} fichier(s)`);
