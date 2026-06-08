#!/usr/bin/env node
/**
 * Rapport d'avancement formel — instantané prédicats par registryId actif.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-formal-advancement-report.mjs
 *   node usr/lib/capsuleos/tools/lab/generate-formal-advancement-report.mjs --write
 *   node usr/lib/capsuleos/tools/lab/generate-formal-advancement-report.mjs --id linux-ubuntu
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';
import { evaluateManifestGates } from './manifest-gates-lib.mjs';
import { evaluateFormalRules, loadFormalState } from './formal-rules-lib.mjs';
import { evaluateUniversal, findNextLayer } from './playbook-general-lib.mjs';
import { evaluateAppsPredicates } from './apps-catalog-lib.mjs';
import { evaluateVisualFidelity } from './visual-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const REACTIVATION_PATH = path.join(ROOT, 'etc/capsuleos/reactivation-queue.json');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { write: false, ids: [], family: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--id' && args[i + 1]) opts.ids.push(args[++i]);
    else if (args[i] === '--family' && args[i + 1]) opts.family = args[++i];
  }
  return opts;
};

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

const gateIcon = (ok) => (ok ? '✓' : '✗');

const h6Status = (registryId) => {
  const p = path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-h6-closure.json`);
  const doc = readJson(p);
  return doc?.status === 'closed' ? 'closed' : doc ? doc.status : 'none';
};

const runValidateAll = () => {
  const res = spawnSync(process.execPath, [path.join(ROOT, 'usr/lib/capsuleos/tools/validate-all.mjs')], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  const out = `${res.stdout || ''}\n${res.stderr || ''}`;
  const failures = [...out.matchAll(/✗ ([^\n]+)/g)].map((m) => m[1].trim());
  const uniqueFailures = [...new Set(failures)];
  return {
    ok: res.status === 0,
    exitCode: res.status,
    failures: uniqueFailures.slice(0, 20),
    failureCount: uniqueFailures.length,
  };
};

const posture = (row) => {
  if (row.gates.H6 && row.gates.ManΣ) return 'clôturé';
  if (row.gates.H6 && !row.gates.ManΣ) return 'H6 sans ManΣ';
  if (row.manifest.ManA === false && row.manifest.PbM) return 'manifeste en revue';
  if (row.manifest.ManV && !row.manifest.ManA) return 'manifeste partiel';
  if (row.playbook.PbΣ && !row.gates.H6) return 'PbΣ prêt H5/H6';
  if (row.nextRule?.startsWith('R-MAN')) return 'migration manifeste';
  if (row.nextRule === 'R-H1') return 'socle H₂';
  return 'amorçage';
};

const freezeNote = (row) => {
  if (row.id === 'linux-rocky' && row.gates.H6) {
    return 'Ne pas régresser shell/apps/fidélité — migration ManΣ en voie parallèle uniquement';
  }
  if (row.id === 'linux-ubuntu' && row.manifest.PbM && !row.manifest.ManA) {
    return 'Grille Aperçu référencée — import staging bloqué jusqu’à ManA';
  }
  if (row.id === 'linux-fedora' && row.gates.H6) {
    return 'H6 atteint via ancienne chaîne — manifeste à collecter sans toucher skin';
  }
  return null;
};

const collectRow = (entry) => {
  const id = entry.id;
  const manifest = evaluateManifestGates(id);
  const formal = loadFormalState(id);
  const next = evaluateFormalRules(id);
  const pbEval = evaluateUniversal(id);
  const pbNext = findNextLayer(pbEval);
  const apps = evaluateAppsPredicates(id);
  const fidelity = evaluateVisualFidelity(id);
  const procManifest = fs.existsSync(path.join(ROOT, 'proc', id, 'distribution-manifest.json'));

  return {
    id,
    vendor: entry.vendor,
    tier: entry.tier,
    toolkit: entry.toolkit?.id || entry.toolkit,
    displayName: entry.displayName,
    procManifest,
    h6: h6Status(id),
    manifest,
    gates: formal.gates,
    nextRule: next.rule,
    nextMessage: next.message,
    nextCommand: next.command,
    playbook: pbEval.state,
    playbookNext: pbNext,
    apps: {
      AppV: apps.AppV,
      AppC: apps.AppC,
      AppP0: apps.AppP0,
      AppΣ: apps.AppΣ,
      p0Gaps: apps.summary?.p0Gaps ?? null,
    },
    fidelity: {
      Tp: fidelity.Tp,
      Tf: fidelity.Tf,
      Tv: fidelity.Tv,
    },
    posture: null,
    freeze: null,
  };
};

const buildMarkdown = (snapshot) => {
  const lines = [];
  lines.push('# Rapport d\'avancement formel — CapsuleOS');
  lines.push('');
  lines.push(`> Généré : \`${snapshot.generatedAt}\` · Commit : \`${snapshot.git.head}\``);
  lines.push(`> Outil : \`generate-formal-advancement-report.mjs\` · Référence : [logique-formelle.md](../logique-formelle.md)`);
  lines.push('');
  lines.push('## 1. Synthèse globale');
  lines.push('');
  lines.push(`| Indicateur | État |`);
  lines.push(`|------------|------|`);
  lines.push(`| **H₂** (validate-all) | ${gateIcon(snapshot.global.H2.ok)} exit ${snapshot.global.H2.exitCode} — ${snapshot.global.H2.failureCount} gate(s) en échec |`);
  lines.push(`| **M** (lab-inventory) | ${gateIcon(fs.existsSync(path.join(ROOT, 'etc/capsuleos/lab-inventory.json')))} |`);
  lines.push(`| Registries évalués | ${snapshot.rows.length} |`);
  lines.push(`| File réactivation | ${snapshot.reactivation.ids.length} ID(s) |`);
  lines.push('');
  if (snapshot.global.H2.failures.length) {
    lines.push('### Blocages H₂ (ne pas merger sans plan)');
    lines.push('');
    for (const f of snapshot.global.H2.failures) lines.push(`- ${f}`);
    lines.push('');
  }
  lines.push('## 2. Posture par distribution (Linux actives)');
  lines.push('');
  lines.push('| Registry | Tier | Toolkit | Posture | H₆ | ManΣ | AppΣ | Tf | Prochaine règle |');
  lines.push('|----------|------|---------|---------|----|------|------|----|-----------------|');
  for (const row of snapshot.rows) {
    lines.push(`| ${row.id} | ${row.tier} | ${row.toolkit} | ${row.posture} | ${gateIcon(row.gates.H6)} | ${gateIcon(row.gates.ManΣ)} | ${gateIcon(row.apps.AppΣ)} | ${gateIcon(row.fidelity.Tf)} | ${row.nextRule} |`);
  }
  lines.push('');
  lines.push('## 3. Chaîne manifeste (ManΣ)');
  lines.push('');
  lines.push('| Registry | ManV | ManS | PbM | ManA | ManSt | ManI | proc/ | Playbook pull/drift |');
  lines.push('|----------|------|------|-----|------|-------|------|-------|---------------------|');
  for (const row of snapshot.rows) {
    const s = row.manifest.playbookSummary;
    const pb = s ? `${s.pull}/${s.drift}/${s.skip}` : '—';
    const m = row.manifest;
    lines.push(`| ${row.id} | ${gateIcon(m.ManV)} | ${gateIcon(m.ManS)} | ${gateIcon(m.PbM)} | ${gateIcon(m.ManA)} | ${gateIcon(m.ManSt)} | ${gateIcon(m.ManI)} | ${gateIcon(row.procManifest)} | ${pb} |`);
  }
  lines.push('');
  lines.push('## 4. Zones à ne pas perturber');
  lines.push('');
  const frozen = snapshot.rows.filter((r) => r.freeze);
  if (!frozen.length) {
    lines.push('_Aucune zone gelée explicite._');
  } else {
    for (const row of frozen) {
      lines.push(`- **${row.id}** — ${row.freeze}`);
    }
  }
  lines.push('');
  lines.push('## 5. Actions admissibles (priorité agent)');
  lines.push('');
  for (const row of snapshot.rows) {
    lines.push(`### ${row.id} (${row.displayName})`);
    lines.push('');
    lines.push(`- **Règle** : \`${row.nextRule}\` — ${row.nextMessage}`);
    if (row.nextCommand) lines.push(`- **Commande** : \`${row.nextCommand}\``);
    if (row.playbookNext?.rule) {
      lines.push(`- **Playbook général** : \`${row.playbookNext.rule}\` — ${row.playbookNext.reason || row.playbookNext.message || row.playbookNext.layer}`);
    }
    lines.push('');
  }
  lines.push('## 6. Recommandations de séquençage');
  lines.push('');
  for (const rec of snapshot.recommendations) lines.push(`- ${rec}`);
  lines.push('');
  lines.push('## 7. Artefacts');
  lines.push('');
  lines.push(`- JSON machine : \`root/docs/inventaires/${snapshot.outputBase}.json\``);
  lines.push(`- Régénérer : \`node usr/lib/capsuleos/tools/lab/generate-formal-advancement-report.mjs --write\``);
  lines.push('');
  return `${lines.join('\n')}\n`;
};

const buildRecommendations = (rows, global) => {
  const rec = [];
  const ubuntu = rows.find((r) => r.id === 'linux-ubuntu');
  const rocky = rows.find((r) => r.id === 'linux-rocky');

  if (!global.H2.ok) {
    rec.push('**H₂ rouge** — traiter les échecs validate-all avant toute extension skin transverse.');
  }
  if (ubuntu?.manifest.PbM && !ubuntu.manifest.ManA) {
    rec.push('**linux-ubuntu** — revue humaine playbook manifeste (ManA) puis staging/import ; évite les patchs overview/icônes manuels.');
  }
  if (rocky?.gates.H6 && !rocky.manifest.ManV) {
    rec.push('**linux-rocky** — collecte manifeste en **voie parallèle** (R-MAN0) sans modifier `home/RedHat/Rocky/` tant que H₆ est la référence.');
  }
  if (rows.filter((r) => r.manifest.ManV).length === 1) {
    rec.push('Infrastructure ManΣ déployée — étendre à **linux-rocky** puis **linux-fedora** avant les toolkits stub (cinnamon, kde, cosmic).');
  }
  const stubs = rows.filter((r) => r.playbook.toolkitStub);
  if (stubs.length) {
    rec.push(`Toolkits stub (${stubs.map((s) => s.id).join(', ')}) — ne pas forcer PbT avant branchement playbook toolkit.`);
  }
  rec.push('Agents : charger `vm-distribution-manifest` pour toute action Man* ; `os-clone-from-vm` pour patch skin post-ManΣ.');
  return rec;
};

const main = () => {
  const opts = parseArgs();
  const registry = readJson(REGISTRY_PATH);
  const reactivation = readJson(REACTIVATION_PATH) || { ids: [] };
  let entries = registry.entries.filter((e) => e.status === 'active');
  if (opts.family) entries = entries.filter((e) => e.family === opts.family);
  else entries = entries.filter((e) => e.family === 'linux');
  if (opts.ids.length) entries = entries.filter((e) => opts.ids.includes(e.id));

  const H2 = runValidateAll();
  const rows = entries.map(collectRow).map((row) => ({
    ...row,
    posture: posture(row),
    freeze: freezeNote(row),
  }));

  const gitHead = spawnSync('git', ['log', '-1', '--format=%h %s'], { cwd: ROOT, encoding: 'utf8' }).stdout?.trim() || 'unknown';
  const dateSlug = new Date().toISOString().slice(0, 10);
  const outputBase = `avancement-formel-${dateSlug}`;

  const snapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    git: { head: gitHead },
    global: { H2 },
    reactivation,
    rows,
    recommendations: buildRecommendations(rows, { H2 }),
    outputBase,
  };

  const md = buildMarkdown(snapshot);
  console.log(md);

  if (opts.write) {
    const jsonPath = path.join(ROOT, 'root/docs/inventaires', `${outputBase}.json`);
    const mdPath = path.join(ROOT, 'root/docs/inventaires', `${outputBase}.md`);
    fs.writeFileSync(jsonPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    fs.writeFileSync(mdPath, md);
    console.error(`\n✓ Écrit : ${mdPath}`);
    console.error(`✓ Écrit : ${jsonPath}`);
  }
};

main();
