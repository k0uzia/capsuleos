#!/usr/bin/env node
/**
 * Gate propositionnel VΣ — états UI, effets, menus.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-ui-state-effects.mjs --id linux-ubuntu
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', requireCapsule: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--require-capsule') opts.requireCapsule = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const invPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-ui-state-effects.json`);
  const errors = [];

  if (!fs.existsSync(invPath)) {
    errors.push(`inventaire absent — collect-ui-state-effects.mjs --id ${opts.id} --write`);
    console.error(errors.join('\n'));
    process.exit(1);
  }

  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const p = inv.summary?.predicates || {};

  if (!p.Ve) errors.push('¬Ve — transitions P0 non documentées');
  if (!p.Vx) errors.push('¬Vx — effets/transitions non mesurés');
  if (!p.Vm) errors.push('¬Vm — menus/popovers non énumérés');
  if (opts.requireCapsule && !p.Vμ) errors.push('¬Vμ — Capsule non reproduit (relancer --capsule)');
  if (!p.VΣ && !opts.requireCapsule) {
    if (p.Ve && p.Vx && p.Vm) {
      inv.summary.predicates.VΣ = true;
    }
  }
  if (opts.requireCapsule && !p.VΣ) errors.push('¬VΣ — clôture effets UI incomplète');

  const p0Gaps = (inv.investigations || []).filter(
    (i) => i.capsuleParity?.parityPriority === 'P0' && i.capsuleParity?.visualMatch === 'unknown',
  );
  if (p0Gaps.length) {
    errors.push(`${p0Gaps.length} transition(s) P0 sans visualMatch classé`);
  }

  if (errors.length) {
    console.error(`smoke-ui-state-effects ${opts.id} — ÉCHEC`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  process.stdout.write(`OK smoke-ui-state-effects ${opts.id} — VΣ=${inv.summary.predicates.VΣ}\n`);
};

main();
