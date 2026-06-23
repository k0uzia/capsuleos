#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Remplace les fallbacks SSH/IP lab en dur dans usr/lib/capsuleos/tools/lab/*.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB = __dirname;

const IMPORT = "import { resolveInventoryField } from './lab-inventory-resolve.mjs';\n";

const ENV_REGISTRY = [
  { env: 'KDE_NEON_SSH', registryId: 'linux-kde-neon' },
  { env: 'MINT_SSH', registryId: 'linux-mint' },
  { env: 'ROCKY_SSH', registryId: 'linux-rocky' },
  { env: 'FEDORA_SSH', registryId: 'linux-fedora' },
  { env: 'UBUNTU_SSH', registryId: 'linux-ubuntu' },
  { env: 'POPOS_SSH', registryId: 'linux-popos' },
];

function patchFile(abs) {
  const rel = path.basename(abs);
  if (rel === 'lab-inventory-resolve.mjs' || rel === 'lab-ssh.mjs' || rel === 'redact-lab-network-metadata.mjs' || rel === 'patch-lab-shell-ssh.mjs') {
    return false;
  }
  let text = fs.readFileSync(abs, 'utf8');
  if (!/192\.168\.|<lab-inventory:linux-lab>|goupil@|capsule@192/.test(text)) {
    return false;
  }

  let registryId = 'linux-lab';
  if (/kde-neon|KDE_NEON/i.test(text)) {
    registryId = 'linux-kde-neon';
  } else if (/linux-mint|MINT_SSH|mint/i.test(rel) || /linux-mint/.test(text)) {
    registryId = 'linux-mint';
  }

  ENV_REGISTRY.forEach(({ env, registryId: rid }) => {
    if (text.includes(env)) {
      registryId = rid;
    }
  });

  text = text.replace(
    /const ssh = process\.env\.[A-Z_]+ \|\| '[^']*';/g,
    `const ssh = process.env.KDE_NEON_SSH || resolveInventoryField('${registryId}', 'ssh');`,
  );
  text = text.replace(
    /process\.env\.[A-Z_]+ \|\| '<lab-inventory:[^']+>'/g,
    `process.env.KDE_NEON_SSH || resolveInventoryField('${registryId}', 'ssh')`,
  );
  text = text.replace(
    /process\.env\.[A-Z_]+ \|\| '[^']*@<lab-ip>'/g,
    `process.env.KDE_NEON_SSH || resolveInventoryField('${registryId}', 'ssh')`,
  );
  text = text.replace(
    /'[^']*@<lab-ip>'/g,
    "resolveInventoryField('linux-lab', 'ssh')",
  );
  text = text.replace(
    /<lab-inventory:linux-lab>/g,
    `<lab-inventory:${registryId}>`,
  );

  if (!text.includes('resolveInventoryField') && /192\.168\./.test(text)) {
    return false;
  }

  if (!text.includes("from './lab-inventory-resolve.mjs'") && text.includes('resolveInventoryField')) {
    const importEnd = text.lastIndexOf('\nimport ');
    if (importEnd >= 0) {
      const nextLine = text.indexOf('\n', importEnd + 1);
      text = `${text.slice(0, nextLine + 1)}${IMPORT}${text.slice(nextLine + 1)}`;
    } else {
      text = `${IMPORT}${text}`;
    }
  }

  if (/192\.168\.|goupil@192|capsule@192/.test(text)) {
    console.error(`  ✗ IP restantes : ${rel}`);
    return false;
  }

  fs.writeFileSync(abs, text);
  return true;
}

let changed = 0;
fs.readdirSync(LAB).filter((n) => n.endsWith('.mjs')).forEach((name) => {
  if (patchFile(path.join(LAB, name))) {
    changed += 1;
  }
});

console.log(`✓ patch-lab-mjs-ssh — ${changed} module(s) mis à jour`);
