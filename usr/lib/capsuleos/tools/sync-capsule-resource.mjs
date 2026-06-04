#!/usr/bin/env node
/**
 * Copie le capsule-resource.js canonique vers OS/linux/kernel/js/ (évite la dérive).
 * Usage : node usr/lib/capsuleos/tools/sync-capsule-resource.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const SRC = path.join(ROOT, 'usr/lib/capsuleos/common/capsule-resource.js');
const DEST = path.join(ROOT, 'OS/linux/kernel/js/capsule-resource.js');

const banner = `/** Copie synchronisée — ne pas éditer. Source : usr/lib/capsuleos/common/capsule-resource.js */\n`;
const body = fs.readFileSync(SRC, 'utf8');
fs.writeFileSync(DEST, banner + body, 'utf8');
console.log(`Sync ${path.relative(ROOT, SRC)} → ${path.relative(ROOT, DEST)}`);
