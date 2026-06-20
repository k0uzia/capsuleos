#!/usr/bin/env node
/**
 * Pull .colors / desktoptheme/colors depuis VM → previews PNG (KCM Couleurs / Style Plasma).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/pull-kde-neon-color-scheme-previews.mjs --write
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { renderSchemePreviewFromFile } from './kde-color-scheme-preview-lib.mjs';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const MANIFEST = path.join(ROOT, 'root/tools/lab/kde-neon-color-scheme-previews-manifest.json');
const write = process.argv.includes('--write');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const destBase = path.join(ROOT, manifest.destDir);
const size = manifest.previewSize || { width: 200, height: 120 };
const sshTarget = process.env.KDE_NEON_SSH || 'capsule@192.168.124.6';
const identity = process.env.KDE_NEON_SSH_IDENTITY || `${process.env.HOME}/.ssh/capsuleos-lab`;
const sshOpts = ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity];

const pullRemote = (remote, local) => {
  fs.mkdirSync(path.dirname(local), { recursive: true });
  const scp = spawnSync('scp', [...sshOpts, `${sshTarget}:${remote}`, local], { encoding: 'utf8' });
  return scp.status === 0;
};

const entries = [
  ...(manifest.schemes || []).map((s) => ({ ...s, kind: 'scheme' })),
  ...(manifest.plasmaThemes || []).map((s) => ({ ...s, kind: 'plasma' })),
];

if (write) fs.mkdirSync(destBase, { recursive: true });

const errors = [];
const pulled = [];

for (const entry of entries) {
  const localColors = path.join(os.tmpdir(), `capsuleos-colors-${process.pid}-${entry.out}.txt`);
  const outPath = path.join(destBase, entry.out);
  if (!write) {
    console.log(`[dry-run] ${entry.out} ← ${entry.vm}`);
    continue;
  }
  const check = spawnSync('ssh', [...sshOpts, sshTarget, `test -r '${entry.vm}'`], { encoding: 'utf8' });
  if (check.status !== 0) {
    errors.push(`absent VM: ${entry.vm}`);
    continue;
  }
  if (!pullRemote(entry.vm, localColors)) {
    errors.push(`scp échec: ${entry.vm}`);
    continue;
  }
  const png = renderSchemePreviewFromFile(localColors, size);
  fs.writeFileSync(outPath, PNG.sync.write(png));
  try { fs.unlinkSync(localColors); } catch (_) { /* ignore */ }
  pulled.push({ out: entry.out, vm: entry.vm, kind: entry.kind });
  console.log(`  ✓ ${entry.out} ← ${entry.vm}`);
}

if (write) {
  const sourceTxt = path.join(path.dirname(destBase), 'SOURCE-SCHEMES-VM.txt');
  fs.writeFileSync(sourceTxt, [
    `Scheme / Plasma previews — générés depuis color-schemes & desktoptheme/colors (${new Date().toISOString()}).`,
    `VM : ${sshTarget}`,
    'Manifeste : root/tools/lab/kde-neon-color-scheme-previews-manifest.json',
    'Procédure : bash root/tools/lab/pull-kde-neon-color-scheme-previews.sh',
    '',
    ...pulled.map((p) => `- ${p.out} ← ${p.vm} (${p.kind})`),
    '',
  ].join('\n'));
}

if (errors.length) {
  console.error('pull-kde-neon-color-scheme-previews — échec');
  errors.forEach((e) => console.error(`  • ${e}`));
  process.exit(1);
}

console.log(`${write ? '✓' : '→'} pull-kde-neon-color-scheme-previews — ${entries.length} fichiers`);
