#!/usr/bin/env node
/**
 * Smoke état campagne GNOME Paramètres (V0 Rocky).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-gnome-campaign-state.mjs --id linux-rocky
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const errors = [];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', requireV0: true };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--no-v0') opts.requireV0 = false;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const statePath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-campaign-state.json`);

  if (!fs.existsSync(statePath)) {
    errors.push(`État campagne absent — generate-gnome-campaign-state.mjs --id ${opts.id} --write`);
  } else {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (state.version !== 1) errors.push('version campagne invalide');
    if ((state.panels || []).length < 18) {
      errors.push(`panneaux ${state.panels?.length || 0}/18 — matrice parity incomplète`);
    }
    for (const panel of state.panels || []) {
      if (!panel.levels?.structure) {
        errors.push(`${panel.label} : structure HTML manquante`);
      }
    }
    if (state.summary?.openP0Gaps > 0) {
      errors.push(`${state.summary.openP0Gaps} contentGap(s) P0 ouvert(s)`);
    }
    if (opts.requireV0 && opts.id === 'linux-rocky' && !state.summary?.v0Closed) {
      errors.push(`V0 non clôturé — RealΣ ${state.summary?.realSigmaPanels}/${state.summary?.panelsTotal}`);
      const gaps = (state.panels || []).flatMap((p) => p.contentGaps
        .filter((g) => g.severity === 'P0' && g.status !== 'accepted')
        .map((g) => `  ${p.label}: ${g.note}`));
      gaps.slice(0, 5).forEach((g) => errors.push(g));
    }
    const docPath = path.join(ROOT, 'root/docs/campagne-reproduction-gnome-toolkit.md');
    if (!fs.existsSync(docPath)) {
      errors.push('campagne-reproduction-gnome-toolkit.md absent');
    }
  }

  if (errors.length) {
    console.error(`smoke-gnome-campaign-state ${opts.id} — échec\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log(`✓ smoke-gnome-campaign-state ${opts.id} OK`);
};

main();
