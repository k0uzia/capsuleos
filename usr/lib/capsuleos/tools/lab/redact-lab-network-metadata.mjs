#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Anonymise les IP / hôtes SSH lab dans les métadonnées versionnées.
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/redact-lab-network-metadata.mjs [--write|--check]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const PRIVATE_IP = /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g;
const SSH_AT_IP = /\b([A-Za-z0-9._-]+)@(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g;

const VENDOR_REGISTRY = {
  mint: 'linux-mint',
  linuxmint: 'linux-mint',
  rocky: 'linux-rocky',
  fedora: 'linux-fedora',
  alma: 'linux-alma',
  almalinux: 'linux-alma',
  ubuntu: 'linux-ubuntu',
  neon: 'linux-kde-neon',
  popos: 'linux-popos',
  anduinos: 'linux-anduinos',
  anduin: 'linux-anduinos',
  opensuse: 'linux-opensuse',
  mx: 'linux-mx-kde',
  debian: 'linux-debian-kde',
};

const SCAN_ROOTS = [
  'usr/share/capsuleos/assets',
  'home/Debian/Mint/style/assets',
  'root/docs',
  'etc/capsuleos/contracts',
  'root/skills',
  'home/Debian/KDE-Neon/content',
  'root/tools/lab',
  'usr/lib/capsuleos/tools/lab',
];

const SKIP_FILES = new Set([
  'usr/lib/capsuleos/shells/linux/terminal/terminal-network.js',
  'etc/capsuleos/lab-inventory.example.json',
  'usr/lib/capsuleos/tools/lab/lab-inventory-resolve.mjs',
  'usr/lib/capsuleos/tools/lab/lab-ssh.mjs',
  'root/tools/lab/lab-inventory-ssh.sh',
  'usr/lib/capsuleos/tools/lab/patch-lab-shell-ssh.mjs',
  'usr/lib/capsuleos/tools/lab/patch-lab-mjs-ssh.mjs',
]);

const SKIP_DIR_NAMES = new Set(['node_modules', '.git', 'captures', 'node_modules']);

function inferRegistryId(filePath, content) {
  const fromJson = content.match(/"registryId"\s*:\s*"([^"]+)"/);
  if (fromJson) {
    return fromJson[1];
  }
  const base = path.basename(filePath);
  const invMatch = base.match(/^linux-([a-z0-9-]+)-/);
  if (invMatch) {
    return `linux-${invMatch[1]}`;
  }
  if (base.endsWith('-vm.json')) {
    return base.replace(/-vm\.json$/, '');
  }
  const vendorMatch = filePath.match(/\/vendors\/([^/]+)\//);
  if (vendorMatch && VENDOR_REGISTRY[vendorMatch[1]]) {
    return VENDOR_REGISTRY[vendorMatch[1]];
  }
  if (filePath.includes('/toolkits/cinnamon/') || filePath.includes('/icons/cinnamon/nemo/')) {
    return 'linux-mint';
  }
  if (filePath.includes('/toolkits/kde/')) {
    return 'linux-kde-neon';
  }
  return 'linux-lab';
}

function redactContent(content, registryId, filePath) {
  let next = content;

  next = next.replace(
    /Assets copiés depuis la VM lab \([^)]+\)/g,
    `Assets copiés depuis la VM lab (registryId: ${registryId})`,
  );
  next = next.replace(
    /# Host: [^\n]+/g,
    `# Host: <lab-inventory:${registryId}>`,
  );
  next = next.replace(
    /# ssh: [^\n]+/gi,
    `# ssh: <lab-inventory:${registryId}>`,
  );
  next = next.replace(
    /# Source VM : [^\n]+/g,
    `# Source VM : registryId ${registryId} — voir lab-inventory.json (local)`,
  );
  next = next.replace(
    /Source VM : [^\n]+/g,
    `Source VM : registryId ${registryId} — voir lab-inventory.json (local)`,
  );
  next = next.replace(
    /\(goupil@[^)]+\)/g,
    `(registryId: ${registryId})`,
  );
  next = next.replace(
    /\(capsule@[^)]+\)/g,
    `(registryId: ${registryId})`,
  );
  next = next.replace(
    /VM ([a-zA-Z0-9._-]+@(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)(?:\d{1,3}\.)*\d{1,3})/g,
    `VM <lab-inventory:${registryId}>`,
  );

  next = next.replace(SSH_AT_IP, `<lab-inventory:${registryId}>`);
  next = next.replace(PRIVATE_IP, '<lab-ip>');
  next = next.replace(/192\.168\.122\.x/g, '203.0.113.x (TEST-NET-3)');
  next = next.replace(/192\.168\.1\.x/g, '203.0.113.x (TEST-NET-3)');

  if (filePath.endsWith('SOURCE-VM.txt') && !next.includes('lab-inventory.json')) {
    next = `${next.trim()}\nConnexion SSH : etc/capsuleos/lab-inventory.json (local, gitignoré).\n`;
  }

  return next;
}

function walkFiles(dir, out) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(ent.name)) {
      continue;
    }
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkFiles(abs, out);
      continue;
    }
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (SKIP_FILES.has(rel)) {
      continue;
    }
    if (!/\.(json|txt|md|mjs|js|css|html)$/i.test(ent.name) && ent.name !== 'SOURCE-VM.txt') {
      continue;
    }
    if (ent.name.endsWith('.sh')) {
      continue;
    }
    out.push(abs);
  }
}

function collectTargets() {
  const files = [];
  SCAN_ROOTS.forEach((rel) => walkFiles(path.join(ROOT, rel), files));
  return [...new Set(files)];
}

const writeMode = process.argv.includes('--write');
const checkMode = process.argv.includes('--check') || !writeMode;

const targets = collectTargets();
const violations = [];
let changed = 0;

targets.forEach((abs) => {
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  const original = fs.readFileSync(abs, 'utf8');
  if (!PRIVATE_IP.test(original) && !SSH_AT_IP.test(original)) {
    PRIVATE_IP.lastIndex = 0;
    SSH_AT_IP.lastIndex = 0;
    return;
  }
  PRIVATE_IP.lastIndex = 0;
  SSH_AT_IP.lastIndex = 0;

  const registryId = inferRegistryId(rel, original);
  const redacted = redactContent(original, registryId, rel);

  if (redacted !== original) {
    if (writeMode) {
      fs.writeFileSync(abs, redacted);
    }
    changed += 1;
  }

  if (PRIVATE_IP.test(redacted) || SSH_AT_IP.test(redacted)) {
    violations.push(rel);
  }
  PRIVATE_IP.lastIndex = 0;
  SSH_AT_IP.lastIndex = 0;
});

if (checkMode && (violations.length || (writeMode === false && changed > 0))) {
  if (!writeMode && changed > 0) {
    console.error(`  ✗ ${changed} fichier(s) contiennent encore des IP lab — lancer avec --write`);
    process.exit(1);
  }
  if (violations.length) {
    violations.slice(0, 20).forEach((v) => console.error(`  ✗ IP restantes : ${v}`));
    process.exit(1);
  }
}

if (writeMode) {
  console.log(`✓ redact-lab-network-metadata — ${changed} fichier(s) anonymisé(s)`);
} else {
  console.log('✓ redact-lab-network-metadata --check OK');
}
