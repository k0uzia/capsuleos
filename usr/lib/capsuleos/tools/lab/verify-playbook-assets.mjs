#!/usr/bin/env node
/**
 * Gate A — vérification absolue de la présence des assets réels dans le dépôt
 * (matrice playbook Paramètres GNOME ↔ fichiers sous usr/share/capsuleos/assets/).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs
 *   node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry linux-rocky --strict
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT, resolveLabMatrix } from './lab-recipe-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const registryIdx = args.indexOf('--registry');
const registry = registryIdx >= 0 ? args[registryIdx + 1] : 'linux-rocky';

const errors = [];
const warnings = [];

const readJson = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`Fichier manquant: ${rel}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
};

const sha256File = (abs) => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(abs));
  return hash.digest('hex');
};

let matrixRel;
let matrix;
try {
  const resolved = resolveLabMatrix(registry, 'assets');
  matrixRel = resolved.relative;
  matrix = readJson(matrixRel);
} catch (e) {
  console.error(`✗ verify-playbook-assets — ${e.message}`);
  process.exit(1);
}

const traceRel = matrix.sourceTraceFile;
const traceAbs = path.join(ROOT, traceRel);
if (!fs.existsSync(traceAbs)) {
  errors.push(`SOURCE-VM absent: ${traceRel}`);
} else if (fs.statSync(traceAbs).size < 20) {
  errors.push(`SOURCE-VM vide ou trop court: ${traceRel}`);
}

const assets = matrix.assets || [];
let present = 0;
let missing = 0;
const missingList = [];

for (const asset of assets) {
  if (asset.optionalOnVm) continue;
  const rel = asset.capsulePath;
  if (!rel) {
    errors.push(`Asset "${asset.id}" sans capsulePath`);
    continue;
  }
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    missing += 1;
    missingList.push({ id: asset.id, capsulePath: rel, vmPath: asset.vmPath });
    errors.push(`Asset absent dépôt: ${rel} (VM: ${asset.vmPath})`);
    continue;
  }
  const st = fs.statSync(abs);
  if (!st.isFile() || st.size < 1) {
    missing += 1;
    errors.push(`Asset vide: ${rel}`);
    continue;
  }
  present += 1;
}

const vmInventoryPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-gnome-settings-assets.json`);
let vmCompared = 0;
let vmDrift = 0;

if (fs.existsSync(vmInventoryPath)) {
  const inv = JSON.parse(fs.readFileSync(vmInventoryPath, 'utf8'));
  for (const row of inv.assets || []) {
    if (!row.existsOnVm || !row.sha256 || !row.capsulePath) continue;
    const matrixAsset = assets.find((a) => a.id === row.id);
    if (matrixAsset?.transcodeFromVm || row.transcodeFromVm) continue;
    const abs = path.join(ROOT, row.capsulePath);
    if (!fs.existsSync(abs)) continue;
    vmCompared += 1;
    const localSha = sha256File(abs);
    if (localSha !== row.sha256) {
      vmDrift += 1;
      errors.push(`Dérive SHA256 ${row.id}: VM ${row.sha256.slice(0, 12)}… ≠ dépôt ${localSha.slice(0, 12)}…`);
    }
  }
} else if (strict) {
  warnings.push(`Inventaire VM assets absent: ${path.relative(ROOT, vmInventoryPath)} (gate S partielle)`);
}

const report = {
  registry,
  generatedAt: new Date().toISOString(),
  gateA: {
    assetsTotal: assets.length,
    presentInRepo: present,
    missingInRepo: missing,
    sourceTraceFile: traceRel,
    sourceTracePresent: fs.existsSync(traceAbs),
  },
  gateS: {
    vmInventoryPath: path.relative(ROOT, vmInventoryPath),
    vmInventoryPresent: fs.existsSync(vmInventoryPath),
    sha256Compared: vmCompared,
    sha256Drift: vmDrift,
  },
  missingAssets: missingList,
  pullHint: matrix.pullScript || 'root/tools/lab/pull-vm-assets.sh',
};

const outDir = path.join(ROOT, 'root/docs/inventaires');
fs.mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, `${registry}-gnome-settings-assets-capsule-check.json`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (warnings.length) {
  warnings.forEach((w) => console.warn(`⚠ ${w}`));
}

if (errors.length) {
  console.error(`✗ verify-playbook-assets — ${errors.length} écart(s), ${present}/${assets.length} présents`);
  errors.slice(0, 15).forEach((e) => console.error(`  ${e}`));
  if (missingList.length) {
    console.error(`  → bash ${matrix.pullScript} --id ${registry}`);
  }
  console.error(`  Rapport: ${path.relative(ROOT, reportPath)}`);
  process.exit(1);
}

console.log(`✓ verify-playbook-assets OK — ${present}/${assets.length} assets, SOURCE-VM présent`);
if (vmCompared) {
  console.log(`  SHA256 VM↔dépôt: ${vmCompared - vmDrift}/${vmCompared} alignés`);
}
console.log(`  ${path.relative(ROOT, reportPath)}`);
