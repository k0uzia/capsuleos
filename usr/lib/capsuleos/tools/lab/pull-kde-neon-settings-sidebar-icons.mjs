#!/usr/bin/env node
/**
 * Pull icônes sidebar Paramètres KDE Neon (hub + sous-nav KCM).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/pull-kde-neon-settings-sidebar-icons.mjs --write
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const MANIFEST = path.join(ROOT, 'root/tools/lab/kde-neon-settings-sidebar-icons-manifest.json');
const write = process.argv.includes('--write');

const sshTarget = process.env.KDE_NEON_SSH || 'capsule@192.168.124.6';
const identity = process.env.KDE_NEON_SSH_IDENTITY || `${process.env.HOME}/.ssh/capsuleos-lab`;
const scpArgs = ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity];

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const destHub = path.join(ROOT, manifest.destHub);
const destSubnav = path.join(ROOT, manifest.destSubnav);
fs.mkdirSync(destHub, { recursive: true });
fs.mkdirSync(destSubnav, { recursive: true });

const pulled = [];

const pullOne = (entry, destDir, group) => {
  const outPath = path.join(destDir, entry.out);
  if (write) {
    const r = spawnSync('scp', [...scpArgs, `${sshTarget}:${entry.vm}`, outPath], { stdio: 'inherit' });
    if (r.status !== 0) process.exit(r.status || 1);
  } else if (!fs.existsSync(outPath)) {
    console.log(`  → manquant ${group}/${entry.out}`);
    return;
  }
  const hash = sha256(outPath);
  const size = fs.statSync(outPath).size;
  console.log(`  ${write ? '✓' : '→'} ${group}/${entry.out} (${size} o)`);
  pulled.push({
    role: entry.role,
    group,
    cssClass: entry.cssClass,
    out: entry.out,
    vm: entry.vm,
    sha256: hash,
    destRel: path.relative(path.join(ROOT, 'usr/share/capsuleos'), outPath),
  });
};

console.log(`=== Pull sidebar Paramètres KDE Neon (${sshTarget}) ===`);
for (const entry of manifest.hub) pullOne(entry, destHub, 'hub');
for (const entry of manifest.subnav) pullOne(entry, destSubnav, 'subnav');

if (write) {
  const invPath = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-kde-settings-sidebar-icons.json');
  fs.writeFileSync(invPath, `${JSON.stringify({
    version: 1,
    registryId: manifest.registryId,
    generatedAt: new Date().toISOString(),
    source: 'pull-kde-neon-settings-sidebar-icons.mjs',
    manifest: 'root/tools/lab/kde-neon-settings-sidebar-icons-manifest.json',
    icons: pulled,
  }, null, 2)}\n`);
  const sourceVm = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/neon/systemsettings/SOURCE-VM.txt');
  fs.appendFileSync(sourceVm, `\n# Sidebar Paramètres — pull ${new Date().toISOString()} (${sshTarget})\n`);
  console.log(`→ inventaire root/docs/inventaires/linux-kde-neon-kde-settings-sidebar-icons.json`);
}

console.log(`✓ pull-kde-neon-settings-sidebar-icons — ${pulled.length} icônes`);
