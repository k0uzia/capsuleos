#!/usr/bin/env node
/**
 * Smoke parité visuelle Paramètres KDE (KdV) — Φ_norm ≥ seuil campagne.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-kde-neon').trim();
const allowStub = process.argv.includes('--allow-stub');
const invPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-apps-visual-investigation.json`);
const regPath = path.join(ROOT, 'root/tools/lab/kde-settings-controls-registry.json');
const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/ui-components-kde.json');
const phiThreshold = fs.existsSync(regPath)
  ? (JSON.parse(fs.readFileSync(regPath, 'utf8')).phiThreshold || 90)
  : 90;

const errors = [];
const warnings = [];

const expectedThemesShots = () => {
  if (!fs.existsSync(contractPath)) return [];
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  return contract.appCompositions?.themes?.acquisitionOrder || [];
};

if (!fs.existsSync(invPath)) {
  if (allowStub) {
    warnings.push('inventaire visuel absent — compare-apps --write requis');
  } else {
    errors.push('inventaire visuel absent — compare-apps --write requis');
  }
} else {
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const themes = (inv.investigations || []).find((it) => it.controlId === 'themes');
  const expected = expectedThemesShots();

  if (!themes) {
    errors.push('slot themes absent inventaire apps');
  } else {
    const shots = themes.componentShots || [];
    for (const shotId of expected) {
      const shot = shots.find((s) => s.shotId === shotId);
      if (!shot) {
        errors.push(`shot manquant: ${shotId}`);
        continue;
      }
      if (!shot.vmCapture) errors.push(`vmCapture absent: ${shotId}`);
      if (!shot.capsuleCapture) errors.push(`capsuleCapture absent: ${shotId}`);
      if (!shot.capsuleParity?.comparedAt && !shot.capsuleParity?.phiNormalized) {
        errors.push(`comparaison absente: ${shotId}`);
      }
    }

    const scores = (themes.componentShots || []).map(
      (s) => s.capsuleParity?.phiNormalized ?? 0,
    );
    const minPhi = scores.length ? Math.min(...scores) : 0;
    const aboveThreshold = scores.filter((s) => s >= phiThreshold).length;
    if (minPhi < phiThreshold) {
      errors.push(`phiNormalizedMin=${minPhi} (seuil v15=${phiThreshold}, ${aboveThreshold}/${scores.length}≥seuil)`);
    }
  }
}

if (errors.length) {
  console.error(`smoke-kde-settings-visual-parity ${registry} — échec`);
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  if (warnings.length) warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  process.exit(1);
}
console.log(`✓ smoke-kde-settings-visual-parity ${registry} OK — KdV (seuil ${phiThreshold})`);
warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
