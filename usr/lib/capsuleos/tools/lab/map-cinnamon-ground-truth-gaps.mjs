#!/usr/bin/env node
/**
 * Met à jour les gaps ground-truth Cinnamon Mint (TIER-C-THEMES et autres).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id linux-mint --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAIN_PATH = path.join(ROOT, 'etc/capsuleos/contracts/cinnamon-ground-truth-chain.json');
const GT_MD = path.join(ROOT, 'root/docs/inventaires/ground-truth-cinnamon.md');
const ROUTING_MATRIX = path.join(ROOT, 'root/docs/inventaires/interactions/linux-mint/menu-cs-routing.json');

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

const buildGroundTruthMd = (routing, chain) => {
  const lines = [];
  lines.push('# Ground truth Cinnamon — Linux Mint');
  lines.push('');
  lines.push(`Dernière mise à jour : ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push('## TIER-C-THEMES — routage menu → csPanel');
  lines.push('');
  if (routing) {
    lines.push(`| Métrique | Valeur |`);
    lines.push(`|----------|--------|`);
    lines.push(`| Entrées menu \`dataLink: themes\` | ${routing.summary.themesMenuEntries} |`);
    lines.push(`| Routage csPanel OK | ${routing.summary.routedOk} (${routing.summary.parityPct} %) |`);
    lines.push(`| Panneaux cinnamon-settings | ${routing.summary.cinnamonPanelCount} |`);
    lines.push(`| Smoke gate | \`smoke-mint-menu-cs-routing.mjs\` |`);
    lines.push('');
    const gaps = routing.entries.filter((e) => e.status !== 'ok');
    if (gaps.length) {
      lines.push('### Gaps restants');
      gaps.forEach((g) => {
        lines.push(`- **${g.labelFr}** — ${g.status}${g.csPanel ? ` (panel \`${g.csPanel}\`)` : ''}`);
      });
    } else {
      lines.push('**Statut : clos** — 100 % des entrées menu themes routées vers un panneau enregistré.');
    }
  } else {
    lines.push('_Matrice menu-cs-routing.json absente — exécuter `generate-menu-cs-routing-matrix.mjs --write`._');
  }
  lines.push('');
  lines.push('## Chaîne validation');
  lines.push('');
  if (chain?.rules) {
    chain.rules.forEach((r) => {
      lines.push(`- **${r.id}** — ${r.label} : \`${r.gate}\``);
    });
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
};

const main = () => {
  const write = process.argv.includes('--write');
  const id = process.argv.includes('--id') ? process.argv[process.argv.indexOf('--id') + 1] : 'linux-mint';
  if (id !== 'linux-mint') {
    console.error('Seul linux-mint est supporté pour cette gate.');
    process.exit(1);
  }

  const routing = readJson(ROUTING_MATRIX);
  let chain = readJson(CHAIN_PATH);
  if (!chain) {
    chain = {
      registryId: 'linux-mint',
      updatedAt: new Date().toISOString(),
      rules: [
        {
          id: 'R-CIN-TIER-C',
          label: 'Menu Préférences → themes → csPanel',
          gate: 'usr/lib/capsuleos/tools/lab/smoke-mint-menu-cs-routing.mjs',
          matrix: 'root/docs/inventaires/interactions/linux-mint/menu-cs-routing.json',
          predicate: 'themesMenuCsRoutingOk',
        },
        {
          id: 'R-CIN-THEMES-SMOKE',
          label: 'cinnamon-settings shell de base',
          gate: 'usr/lib/capsuleos/tools/lab/smoke-mint-cinnamon-settings.mjs',
          predicate: 'cinnamonSettingsShellOk',
        },
      ],
    };
  }

  if (routing) {
    chain.updatedAt = new Date().toISOString();
    chain.tiers = chain.tiers || {};
    chain.tiers['TIER-C-THEMES'] = {
      status: routing.summary.parityPct === 100 ? 'closed' : 'open',
      parityPct: routing.summary.parityPct,
      themesMenuEntries: routing.summary.themesMenuEntries,
      routedOk: routing.summary.routedOk,
    };
  }

  const md = buildGroundTruthMd(routing, chain);

  if (write) {
    fs.mkdirSync(path.dirname(CHAIN_PATH), { recursive: true });
    fs.writeFileSync(CHAIN_PATH, `${JSON.stringify(chain, null, 2)}\n`);
    fs.mkdirSync(path.dirname(GT_MD), { recursive: true });
    fs.writeFileSync(GT_MD, md);
    console.log(`✓ ${CHAIN_PATH.replace(`${ROOT}/`, '')}`);
    console.log(`✓ ${GT_MD.replace(`${ROOT}/`, '')}`);
    if (routing) {
      console.log(`  TIER-C-THEMES ${routing.summary.routedOk}/${routing.summary.themesMenuEntries} (${routing.summary.parityPct}%)`);
    }
  } else {
    process.stdout.write(md);
  }
};

main();
