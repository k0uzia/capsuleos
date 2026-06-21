#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Remplace les IP lab en dur dans root/tools/lab/*.sh par resolve_lab_ssh.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB = path.resolve(__dirname, '../../../../../root/tools/lab');

const REPLACEMENTS = [
  {
    re: /SSH_TARGET="\$\{KDE_NEON_SSH:-[^"]+\}"/g,
    to: 'SSH_TARGET="${KDE_NEON_SSH:-$(resolve_lab_ssh linux-kde-neon KDE_NEON_SSH)}"',
  },
  {
    re: /SSH_TARGET="\$\{ROCKY_SSH:-[^"]+\}"/g,
    to: 'SSH_TARGET="${ROCKY_SSH:-$(resolve_lab_ssh linux-rocky ROCKY_SSH)}"',
  },
  {
    re: /export FEDORA_SSH="\$\{FEDORA_SSH:-[^"]+\}"/g,
    to: 'export FEDORA_SSH="${FEDORA_SSH:-$(resolve_lab_ssh linux-fedora FEDORA_SSH)}"',
  },
  {
    re: /export LAB_SSH="\$\{UBUNTU_SSH:-[^"]+\}"/g,
    to: 'export LAB_SSH="${UBUNTU_SSH:-$(resolve_lab_ssh linux-ubuntu UBUNTU_SSH)}"',
  },
  {
    re: /: "\$\{LAB_SSH:=\$\{FEDORA_SSH:-[^"]+\}\}"/g,
    to: ': "${LAB_SSH:=$(resolve_lab_ssh linux-fedora FEDORA_SSH LAB_SSH)}"',
  },
  {
    re: /HOST="\$\{1:-\$\{CAPSULE_MINT_VM_SSH:-[^"]+\}\}"/g,
    to: 'HOST="${1:-${CAPSULE_MINT_VM_SSH:-$(resolve_lab_ssh linux-mint MINT_SSH CAPSULE_MINT_VM_SSH)}}"',
  },
  {
    re: /TARGET="\$\{1:-[^"]+\}"/g,
    to: 'TARGET="${1:-$(resolve_lab_ssh linux-ubuntu UBUNTU_SSH)}"',
  },
  {
    re: /#   KDE_NEON_SSH=[^\n]+/g,
    to: '#   KDE_NEON_SSH=<lab-inventory:linux-kde-neon> bash ...',
  },
  {
    re: /# Usage : bash root\/tools\/lab\/install-vm-screenshot-agent\.sh \[[^\]]+\]/g,
    to: '# Usage : bash root/tools/lab/install-vm-screenshot-agent.sh [user@host]',
  },
  {
    re: /# Exemple: deploy-xdotool-via-host\.sh [^\n]+/g,
    to: '# Exemple: deploy-xdotool-via-host.sh user@host ~/.ssh/capsuleos-lab',
  },
  {
    re: /#   ssh -i [^\n]+192\.168[^\n]+/g,
    to: '#   ssh -i ~/.ssh/capsuleos-lab user@host \'bash -s\' < root/tools/lab/vm-fedora-lab-bootstrap.sh',
  },
  {
    re: /os\.environ\.get\("KDE_NEON_SSH", "[^"]+"\)/g,
    to: 'os.environ.get("KDE_NEON_SSH", "")',
  },
];

const SOURCE_LINE = '# shellcheck source=lab-inventory-ssh.sh\nsource "$(dirname "$0")/lab-inventory-ssh.sh"\n';

let changed = 0;
for (const name of fs.readdirSync(LAB)) {
  if (!name.endsWith('.sh') || name === 'lab-inventory-ssh.sh') {
    continue;
  }
  const abs = path.join(LAB, name);
  let text = fs.readFileSync(abs, 'utf8');
  if (!/192\.168\.|10\.\d+\.\d+\.\d+/.test(text)) {
    continue;
  }
  REPLACEMENTS.forEach(({ re, to }) => {
    text = text.replace(re, to);
  });
  if (!text.includes('lab-inventory-ssh.sh') && text.includes('resolve_lab_ssh')) {
    const rootMatch = text.match(/^ROOT="\$\(cd[^\n]+\n/m);
    if (rootMatch) {
      text = text.replace(rootMatch[0], `${rootMatch[0]}${SOURCE_LINE}`);
    } else {
      const shebangEnd = text.indexOf('\n', text.indexOf('#!')) + 1;
      text = `${text.slice(0, shebangEnd)}${SOURCE_LINE}${text.slice(shebangEnd)}`;
    }
  }
  if (/192\.168\.|10\.\d+\.\d+\.\d+/.test(text)) {
    console.error(`  ✗ IP restantes : ${name}`);
    process.exitCode = 1;
    continue;
  }
  fs.writeFileSync(abs, text);
  changed += 1;
}

console.log(`✓ patch-lab-shell-ssh — ${changed} script(s) mis à jour`);
