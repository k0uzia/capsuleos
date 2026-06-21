#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Résout ssh / champs lab depuis etc/capsuleos/lab-inventory.json (local, gitignoré).
 * Usage : node usr/lib/capsuleos/tools/lab/lab-inventory-resolve.mjs --id linux-mint [--field ssh]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');

export function loadInventoryHost(registryId) {
  if (!fs.existsSync(INVENTORY)) {
    return null;
  }
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  return (inv.hosts || []).find((h) => h.registryId === registryId) || null;
}

export function resolveInventoryField(registryId, field) {
  const host = loadInventoryHost(registryId);
  if (!host) {
    return null;
  }
  if (field === 'ssh') {
    return host.ssh || null;
  }
  return host[field] ?? null;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  let registryId = 'linux-mint';
  let field = 'ssh';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) {
      registryId = args[++i];
    } else if (args[i] === '--field' && args[i + 1]) {
      field = args[++i];
    }
  }
  const value = resolveInventoryField(registryId, field);
  if (!value) {
    process.stderr.write(
      `lab-inventory.json absent ou registryId inconnu: ${registryId}\n`
      + 'Copier etc/capsuleos/lab-inventory.example.json → lab-inventory.json\n',
    );
    process.exit(1);
  }
  process.stdout.write(String(value));
}
