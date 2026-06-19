#!/usr/bin/env node
/**
 * Fusionne l'inventaire VM fiches installées → discover-catalog.json (appDetails).
 *
 *   node root/tools/lab/merge-discover-installed-app-details.mjs
 *   node root/tools/lab/merge-discover-installed-app-details.mjs --dry-run
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const INVENTORY = path.join(ROOT, 'root/docs/inventaires/linux-kde-neon-discover-installed-app-details.json');
const CATALOG = path.join(ROOT, 'home/Debian/KDE-Neon/content/discover-catalog.json');
const dryRun = process.argv.includes('--dry-run');

if (!fs.existsSync(INVENTORY)) {
  console.error('Inventaire absent — vm-kde-neon-discover-installed-app-details-inventory.sh');
  process.exit(1);
}

const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
catalog.appDetails = catalog.appDetails || {};

let merged = 0;
for (const [appId, detail] of Object.entries(inv.apps || {})) {
  const existing = catalog.appDetails[appId] || {};
  const next = {
    ...existing,
    summary: detail.summary || existing.summary || '',
    description: detail.description || existing.description || detail.summary || '',
    version: detail.version || existing.version || '',
    size: detail.size || existing.size || '',
    license: detail.license || existing.license || '',
    origin: detail.origin || existing.origin || '',
    developer: detail.developer || existing.developer || '',
    verifiedDeveloper: detail.verifiedDeveloper ?? existing.verifiedDeveloper,
    installed: true,
    primaryAction: 'Lancer',
  };
  if (Array.isArray(existing.screenshots) && existing.screenshots.length) {
    next.screenshots = existing.screenshots;
  } else if (Array.isArray(detail.screenshots) && detail.screenshots.length) {
    next.screenshots = detail.screenshots;
  }
  catalog.appDetails[appId] = next;
  merged += 1;

  const installedEntry = (catalog.installed || []).find((a) => a.id === appId);
  if (installedEntry && detail.sizeKb) {
    installedEntry.sizeKb = detail.sizeKb;
  }
  if (installedEntry?.desc) {
    const badSummary = !next.summary || /[\u4e00-\u9fff]/.test(next.summary);
    if (badSummary) {
      next.summary = installedEntry.desc;
    }
    if (!next.description || next.description.length < 20) {
      next.description = installedEntry.desc;
    }
  }
  if (appId === 'firefox') {
    if (!next.license) next.license = existing.license || 'MPL-2.0';
    if (!next.developer) next.developer = existing.developer || 'Mozilla';
    if (!next.verifiedDeveloper) next.verifiedDeveloper = true;
  }
}

if (dryRun) {
  console.log(JSON.stringify({ merged, appIds: Object.keys(inv.apps || {}) }, null, 2));
  process.exit(0);
}

fs.writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`OK merge appDetails installées : ${merged} fiches → ${CATALOG}`);
