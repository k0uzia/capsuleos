#!/usr/bin/env node
/**
 * Reset ciblé Paramètres KDE — purge métriques themes sans toucher aux autres apps P0.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/reset-kde-neon-settings-campaign.mjs
 *   node usr/lib/capsuleos/tools/lab/reset-kde-neon-settings-campaign.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = 'linux-kde-neon';
const SLOT = 'themes';
const INV = path.join(ROOT, 'root/docs/inventaires');
const write = process.argv.includes('--write');

const rmCapture = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return;
  if (!write) {
    console.log(`[dry-run] supprimer ${rel}`);
    return;
  }
  fs.rmSync(abs, { recursive: true, force: true });
  console.log(`✓ supprimé ${rel}`);
};

const purgeThemesInvestigation = () => {
  const file = path.join(INV, `${REGISTRY}-apps-visual-investigation.json`);
  if (!fs.existsSync(file)) return;
  const inv = JSON.parse(fs.readFileSync(file, 'utf8'));
  const item = (inv.investigations || []).find((i) => i.controlId === SLOT);
  if (!item) return;
  item.vmCaptures = [];
  item.capsuleCaptures = [];
  if (item.capsuleParity) delete item.capsuleParity;
  for (const shot of item.componentShots || []) {
    delete shot.vmCapture;
    delete shot.capsuleCapture;
    delete shot.capsuleParity;
    shot.status = 'pending';
  }
  inv.updatedAt = new Date().toISOString();
  inv.note = 'Reset ciblé themes — autres slots P0 conservés.';
  if (write) {
    fs.writeFileSync(file, `${JSON.stringify(inv, null, 2)}\n`);
    console.log(`✓ réinitialisé themes dans ${file.replace(`${ROOT}/`, '')}`);
  }
};

const main = () => {
  console.log(`\n── reset-kde-neon-settings-campaign ${write ? '--write' : '(dry-run)'} ──\n`);
  rmCapture(`root/docs/inventaires/captures/${REGISTRY}/apps-visual/${SLOT}`);
  rmCapture(`root/docs/inventaires/captures/${REGISTRY}/apps-visual-capsule/${SLOT}`);
  const legacyVm = `root/docs/inventaires/captures/${REGISTRY}/apps-visual/${SLOT}-vm.png`;
  const legacyCap = `root/docs/inventaires/captures/${REGISTRY}/apps-visual-capsule/${SLOT}.png`;
  for (const rel of [legacyVm, legacyCap]) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      if (write) {
        fs.unlinkSync(abs);
        console.log(`✓ supprimé ${rel}`);
      } else {
        console.log(`[dry-run] supprimer ${rel}`);
      }
    }
  }
  const settingsState = path.join(INV, `${REGISTRY}-settings-effects-state.json`);
  if (fs.existsSync(settingsState) && write) {
    fs.writeFileSync(settingsState, `${JSON.stringify({
      registryId: REGISTRY,
      updatedAt: new Date().toISOString(),
      status: 'pending',
      note: 'Reset ciblé Paramètres — re-mesure Se+ requise',
    }, null, 2)}\n`);
    console.log(`✓ réinitialisé ${settingsState.replace(`${ROOT}/`, '')}`);
  }
  purgeThemesInvestigation();
  console.log(`\n${write ? '✓' : '→'} reset-kde-neon-settings-campaign terminé`);
};

main();
