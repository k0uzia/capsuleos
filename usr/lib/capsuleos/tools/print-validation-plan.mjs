#!/usr/bin/env node
/**
 * Plan de validation discriminée selon les fichiers modifiés.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/print-validation-plan.mjs
 *   node usr/lib/capsuleos/tools/print-validation-plan.mjs --staged
 *   node usr/lib/capsuleos/tools/print-validation-plan.mjs home/Debian/Mint/style/apps/nemo.skin.css
 *
 * Voir root/docs/agent-validation-discipline.md
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const TOOLS = 'usr/lib/capsuleos/tools';

const RULES = [
  {
    id: 'doc-skills',
    label: 'Doc / skills / règles Cursor',
    match: (p) => /^(root\/(docs|skills)|\.cursor\/rules|contrib\.md)/.test(p),
    reads: ['root/docs/parcours-agent.md', 'root/docs/agent-validation-discipline.md'],
    gates: [],
    optional: ['node usr/lib/capsuleos/tools/validate-agent-skills.mjs'],
    push: [],
  },
  {
    id: 'assets',
    label: 'Assets (zones autorisées)',
    match: (p) => /^usr\/share\/capsuleos\/assets\//.test(p) || /^home\/public\/Images\//.test(p),
    reads: ['root/docs/politique-assets.md'],
    gates: ['node usr/lib/capsuleos/tools/validate-asset-zones.mjs'],
    optional: ['node usr/lib/capsuleos/tools/validate-assets-all.mjs'],
    push: [],
  },
  {
    id: 'skin-linux',
    label: 'Skin Linux (home/)',
    match: (p) => /^home\/[^/]+\/[^/]+\//.test(p) && !/^home\/public\//.test(p),
    reads: [
      'root/docs/convention-reproduction-os.md',
      'root/docs/convention-rafraichissement-vues.md',
    ],
    gates: [
      'node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs',
      'node usr/lib/capsuleos/tools/validate-capsule.mjs',
    ],
    optional: [
      'node usr/lib/capsuleos/tools/lab/smoke-mint-nemo.mjs',
      'node usr/lib/capsuleos/tools/lab/run-capsule-panel-browser.mjs',
    ],
    push: ['Rv : vues cohérentes sur slots touchés', 'sync-linux-skin-closure avant push'],
  },
  {
    id: 'linux-templates',
    label: 'Gabarits apps / explorateurs Linux',
    match: (p) => /^usr\/share\/capsuleos\/linux\/(apps|explorers)\//.test(p),
    reads: ['root/docs/apps-linux-par-distro.md'],
    gates: [
      'node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs',
      'node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs',
    ],
    optional: ['node usr/lib/capsuleos/tools/build-embeds-all.mjs'],
    push: ['file:// smoke sur 1 app'],
  },
  {
    id: 'noyau-js',
    label: 'JS noyau (usr/lib/capsuleos)',
    match: (p) => /^usr\/lib\/capsuleos\//.test(p) && !/^usr\/lib\/capsuleos\/tools\/lab\//.test(p),
    reads: ['root/docs/passe-vanilla-json.md'],
    gates: ['node usr/lib/capsuleos/tools/validate-quality-all.mjs'],
    optional: [
      'node usr/lib/capsuleos/tools/build-capsule-window.mjs',
      'node usr/lib/capsuleos/tools/validate-desktop-window-boot.mjs',
    ],
    push: [],
  },
  {
    id: 'registry',
    label: 'Registre / profils etc/capsuleos',
    match: (p) => /^etc\/capsuleos\//.test(p) || /os-registry-entries\.mjs$/.test(p),
    reads: ['root/docs/ajouter-os-scalable.md'],
    gates: ['node usr/lib/capsuleos/tools/validate-capsule.mjs'],
    optional: [
      'node usr/lib/capsuleos/tools/build-os-registry.mjs',
      'node usr/lib/capsuleos/tools/print-agent-brief.mjs <registryId>',
    ],
    push: [],
  },
  {
    id: 'lab',
    label: 'Outils lab / smokes Playwright',
    match: (p) => /^usr\/lib\/capsuleos\/tools\/lab\//.test(p),
    reads: ['root/docs/convention-rafraichissement-vues.md'],
    gates: [],
    optional: ['Exécuter les smokes modifiés (attentes conditionnelles, mint-smoke-open.mjs)'],
    push: [],
  },
  {
    id: 'links-html',
    label: 'HTML statique / hubs OS',
    match: (p) => /\.html$/.test(p) && !/^home\/[^/]+\/[^/]+\//.test(p),
    reads: ['root/skills/link-routing/SKILL.md'],
    gates: ['node usr/lib/capsuleos/tools/validate-links-all.mjs'],
    optional: [],
    push: [],
  },
];

const RELEASE_GATE = 'node usr/lib/capsuleos/tools/validate-all.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { staged: false, paths: [] };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--staged') opts.staged = true;
    else if (!args[i].startsWith('--')) opts.paths.push(args[i]);
  }
  return opts;
};

const gitChangedPaths = (staged) => {
  const flag = staged ? '--cached' : '';
  const r = spawnSync('git', ['diff', flag, '--name-only', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (r.status !== 0 || !r.stdout) return [];
  return r.stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
};

const normalizePath = (p) => p.replace(/\\/g, '/').replace(/^\.\//, '');

const classify = (paths) => {
  const matched = new Map();
  const unmatched = [];
  paths.forEach((raw) => {
    const p = normalizePath(raw);
    let hit = false;
    RULES.forEach((rule) => {
      if (rule.match(p)) {
        hit = true;
        if (!matched.has(rule.id)) matched.set(rule.id, { rule, paths: [] });
        matched.get(rule.id).paths.push(p);
      }
    });
    if (!hit) unmatched.push(p);
  });
  return { matched, unmatched };
};

const uniq = (arr) => [...new Set(arr)];

const printSection = (title, items) => {
  if (!items.length) return;
  console.log(`\n## ${title}`);
  items.forEach((line) => console.log(`  ${line}`));
};

const main = () => {
  const opts = parseArgs();
  let paths = opts.paths.map(normalizePath);
  if (!paths.length) {
    paths = gitChangedPaths(opts.staged);
  }
  if (!paths.length) {
    console.log('Aucun fichier modifié détecté (git diff vide).');
    console.log('Usage: print-validation-plan.mjs [--staged] [fichier …]');
    process.exit(0);
  }

  const { matched, unmatched } = classify(paths);
  const rules = [...matched.values()].map((v) => v.rule);

  console.log('# Plan de validation CapsuleOS');
  console.log(`\nFichiers analysés (${paths.length}) :`);
  paths.slice(0, 20).forEach((p) => console.log(`  - ${p}`));
  if (paths.length > 20) console.log(`  … +${paths.length - 20} autres`);

  if (!rules.length) {
    console.log('\n⚠ Aucune règle connue — baseline recommandée :');
    console.log(`  ${RELEASE_GATE}`);
    if (unmatched.length) {
      printSection('Chemins non classés', unmatched);
    }
    process.exit(0);
  }

  printSection(
    'Lectures',
    uniq(rules.flatMap((r) => r.reads)),
  );
  printSection(
    'Gates obligatoires (zone touchée)',
    uniq(rules.flatMap((r) => r.gates)),
  );
  printSection(
    'Optionnel / smokes',
    uniq(rules.flatMap((r) => r.optional)),
  );
  printSection(
    'Avant push (si merge significatif)',
    uniq([
      ...rules.flatMap((r) => r.push),
      RELEASE_GATE,
      'Rectifier les rouges dans la zone touchée uniquement',
    ]),
  );

  const needsBaseline = rules.some((r) =>
    ['skin-linux', 'noyau-js', 'linux-templates', 'registry'].includes(r.id),
  );
  if (needsBaseline) {
    console.log('\n## Session (première intervention ou gros patch)');
    console.log(`  ${RELEASE_GATE}  # H₂ baseline — noter échecs hors zone`);
  }

  if (unmatched.length) {
    printSection('Chemins non classés (vérifier manuellement)', unmatched);
  }

  console.log('\nDoc : root/docs/agent-validation-discipline.md');
};

main();
