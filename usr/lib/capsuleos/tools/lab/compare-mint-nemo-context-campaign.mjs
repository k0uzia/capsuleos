#!/usr/bin/env node
/**
 * Compare campagne Nemo VM vs recette — rapport markdown + mise à jour matrice.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/compare-mint-nemo-context-campaign.mjs
 *   node usr/lib/capsuleos/tools/lab/compare-mint-nemo-context-campaign.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ROOT,
  SCENARIOS_PATH,
  MATRIX_PATH,
  classifyGap,
  diffLabels,
  filterPedagogicalLabels,
  readJson,
} from './mint-nemo-context-campaign-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAPSULE_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/nemo-context-campaign-capsule.json',
);
const VM_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/nemo-context-campaign-vm.json',
);
const REPORT_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/nemo-context-campaign-report.md',
);
const GROUND_TRUTH_PATH = path.join(
  ROOT,
  'root/docs/inventaires/ground-truth-cinnamon.md',
);

const parseArgs = () => {
  const args = process.argv.slice(2);
  return { write: args.includes('--write') };
};

const opts = parseArgs();

if (!fs.existsSync(CAPSULE_PATH)) {
  console.error(`Manquant: ${CAPSULE_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(VM_PATH)) {
  console.error(`Manquant: ${VM_PATH}`);
  process.exit(1);
}

const scenariosDoc = readJson(SCENARIOS_PATH);
const matrix = readJson(MATRIX_PATH);
const capsule = readJson(CAPSULE_PATH);
const vm = readJson(VM_PATH);

const rows = [];
let p0 = 0;
let p1 = 0;
const campaignNotes = [];

for (const scenario of scenariosDoc.scenarios) {
  const cap = capsule.results?.[scenario.id] || {};
  const vmr = vm.results?.[scenario.id] || {};
  const capLabels = (cap.labels || []).map((l) => l.replace(' [disabled]', ''));
  const vmLabels = filterPedagogicalLabels(vmr.labels || [], matrix);
  const cross = diffLabels(capLabels, vmLabels);
  const gap = classifyGap(scenario, cap, vmr, matrix);
  if (gap.p0) p0 += 1;
  if (gap.p1) p1 += 1;

  const verdict = gap.p0 ? 'P0' : gap.p1 ? 'P1' : cap.skipped || (scenario.optional && !cap.visible) ? 'skip' : 'ok';
  rows.push({
    id: scenario.id,
    priority: scenario.priority,
    verdict,
    capsuleVisible: !!cap.visible,
    vmVisible: !!vmr.visible,
    capsuleLabels: capLabels,
    vmLabels,
    missingInCapsule: cross.missing,
    extrasInCapsule: cross.extras,
    orderMismatch: cross.orderMismatch,
    gap,
  });

  if (verdict !== 'ok' && verdict !== 'skip') {
    campaignNotes.push({
      id: scenario.id,
      verdict,
      note: `Capsule: ${capLabels.join(' | ') || '—'} · VM: ${vmLabels.join(' | ') || '—'}`,
    });
  }
}

const lines = [];
lines.push('# Campagne clic droit Nemo — VM vs recette');
lines.push('');
lines.push(`**Date** : ${new Date().toISOString().slice(0, 10)}`);
lines.push(`**Scénarios** : ${scenariosDoc.scenarios.length}`);
lines.push(`**Écarts P0** : ${p0} · **P1** : ${p1}`);
lines.push('');
lines.push('## Synthèse');
lines.push('');
lines.push('| Métrique | Valeur |');
lines.push('|----------|--------|');
lines.push(`| Recette (Capsule) | ${capsule.scenarioCount} scénarios · ${capsule.p0Gaps} P0 · ${capsule.p1Gaps} P1 |`);
lines.push(`| VM Mint | ${vm.scenarioCount} scénarios Nemo · ${Object.values(vm.results || {}).filter((r) => r.visible).length} menus visibles |`);
lines.push(`| Cross-diff P0 | ${p0} |`);
lines.push(`| Cross-diff P1 | ${p1} |`);
lines.push('');
lines.push('## Détail par scénario');
lines.push('');
lines.push('| ID | P | Verdict | Capsule | VM | Manquants recette | Extras recette |');
lines.push('|----|---|---------|---------|-----|-------------------|----------------|');

for (const row of rows) {
  lines.push(
    `| ${row.id} | ${row.priority} | ${row.verdict} | ${row.capsuleVisible ? 'oui' : 'non'} | ${row.vmVisible ? 'oui' : 'non'} | ${row.missingInCapsule.join(', ') || '—'} | ${row.extrasInCapsule.join(', ') || '—'} |`,
  );
}

lines.push('');
lines.push('## Labels VM (échantillon ground truth)');
lines.push('');
const vmSamples = rows.filter((r) => r.vmLabels.length > 0).slice(0, 8);
for (const s of vmSamples) {
  lines.push(`- **${s.id}** : ${s.vmLabels.join(' → ')}`);
}

lines.push('');
lines.push('## Actions correctives');
lines.push('');
if (p0 === 0 && p1 === 0) {
  lines.push('Aucun écart P0/P1 détecté sur la campagne.');
} else {
  const p0rows = rows.filter((r) => r.verdict === 'P0');
  const p1rows = rows.filter((r) => r.verdict === 'P1');
  if (p0rows.length) {
    lines.push('### P0');
    p0rows.forEach((r) => {
      lines.push(`- \`${r.id}\` : menu ${r.capsuleVisible ? 'visible' : 'absent'} — manquants ${r.missingInCapsule.join(', ') || 'n/a'}`);
    });
  }
  if (p1rows.length) {
    lines.push('### P1');
    p1rows.forEach((r) => {
      lines.push(`- \`${r.id}\` : ${r.missingInCapsule.length ? `manquants ${r.missingInCapsule.join(', ')}` : 'ordre/extras'} ${r.extrasInCapsule.length ? `· extras ${r.extrasInCapsule.join(', ')}` : ''}`);
    });
  }
}

lines.push('');
lines.push('## Fichiers');
lines.push('');
lines.push(`- Scénarios : \`${SCENARIOS_PATH.replace(`${ROOT}/`, '')}\``);
lines.push(`- Recette : \`${CAPSULE_PATH.replace(`${ROOT}/`, '')}\``);
lines.push(`- VM : \`${VM_PATH.replace(`${ROOT}/`, '')}\``);
lines.push(`- Runner recette : \`usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign.mjs\``);
lines.push(`- Runner VM : \`usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign-vm.mjs\``);

const report = `${lines.join('\n')}\n`;

if (opts.write) {
  fs.writeFileSync(REPORT_PATH, report);

  matrix.campaign = {
    collectedAt: new Date().toISOString(),
    scenarios: SCENARIOS_PATH.replace(`${ROOT}/`, ''),
    capsule: CAPSULE_PATH.replace(`${ROOT}/`, ''),
    vm: VM_PATH.replace(`${ROOT}/`, ''),
    report: REPORT_PATH.replace(`${ROOT}/`, ''),
    p0Gaps: p0,
    p1Gaps: p1,
    notes: campaignNotes.slice(0, 30),
  };
  fs.writeFileSync(MATRIX_PATH, `${JSON.stringify(matrix, null, 2)}\n`);

  const gtSection = [
    '',
    '## Campagne clic droit Nemo (VM vs recette)',
    '',
    `Dernière passe : **${new Date().toISOString().slice(0, 10)}**`,
    '',
    `- Scénarios : \`nemo-context-scenarios.json\` (${scenariosDoc.scenarios.length})`,
    `- Écarts : **${p0} P0**, **${p1} P1**`,
    `- Rapport : [\`nemo-context-campaign-report.md\`](interactions/linux-mint/nemo-context-campaign-report.md)`,
    '',
    'Workflow :',
    '',
    '```bash',
    'node usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign.mjs',
    'node usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign-vm.mjs',
    'node usr/lib/capsuleos/tools/lab/compare-mint-nemo-context-campaign.mjs --write',
    '```',
    '',
  ].join('\n');

  let gt = '';
  if (fs.existsSync(GROUND_TRUTH_PATH)) {
    gt = fs.readFileSync(GROUND_TRUTH_PATH, 'utf8');
    if (gt.includes('## Campagne clic droit Nemo')) {
      gt = gt.replace(/## Campagne clic droit Nemo[\s\S]*?(?=\n## |\n# |$)/, `${gtSection}\n`);
    } else {
      gt += gtSection;
    }
  } else {
    gt = `# Ground truth Cinnamon — Linux Mint\n\nRéférence VM lab \`capsule@192.168.1.146\` · Cinnamon 6.6.7 · locale fr_FR.\n${gtSection}`;
  }
  fs.writeFileSync(GROUND_TRUTH_PATH, gt);
}

console.log(JSON.stringify({
  report: REPORT_PATH.replace(`${ROOT}/`, ''),
  scenarioCount: scenariosDoc.scenarios.length,
  p0Gaps: p0,
  p1Gaps: p1,
  written: opts.write,
}, null, 2));

if (!opts.write) {
  process.stdout.write('\n---\n');
  process.stdout.write(report);
}
