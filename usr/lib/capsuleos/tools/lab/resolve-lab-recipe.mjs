#!/usr/bin/env node
/**
 * Inspecte la recette lab pour un registryId — gaps, matrices, profil (JSON agent).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/resolve-lab-recipe.mjs --id linux-ubuntu
 *   node usr/lib/capsuleos/tools/lab/resolve-lab-recipe.mjs --id linux-rocky --human
 */
import { loadRecipeProfile, evaluateRecipeGaps } from './lab-recipe-resolver.mjs';
import { resolvePipeline } from './capsule-pipeline-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', human: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--human') opts.human = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const profile = loadRecipeProfile(opts.id);
  const gaps = evaluateRecipeGaps(opts.id);
  let pipeline = null;
  try {
    pipeline = resolvePipeline(opts.id);
  } catch {
    pipeline = { rule: 'R-PIPELINE-ERR', message: 'pipeline indisponible' };
  }

  const out = {
    registryId: opts.id,
    profile,
    recipe: gaps,
    pipelineNext: pipeline.rule ? {
      rule: pipeline.rule,
      layer: pipeline.layer,
      command: pipeline.command,
      autoExecute: pipeline.autoExecute,
      message: pipeline.message,
    } : null,
    algorithm: {
      model: 'P(d) profil hot-reload → A(d,k) matrices strictes → pipeline gates',
      hotReload: [
        'etc/capsuleos/contracts/lab-recipe-profiles.json',
        'root/tools/lab/gnome-settings-*-matrix-{vendor}.json',
        'CAPSULE_RECIPE_OVERRIDE (JSON optionnel)',
      ],
      bootstrap: gaps.ready ? null : `bootstrap-gnome-settings-matrices.mjs --id ${opts.id} --write`,
    },
  };

  if (opts.human) {
    process.stdout.write(`Recette ${opts.id} (${profile.toolkit}/${profile.vendor})\n`);
    process.stdout.write(`  Prête: ${gaps.ready ? 'oui' : 'non'}\n`);
    if (gaps.gaps.length) {
      gaps.gaps.forEach((g) => process.stdout.write(`  ✗ ${g.kind}: ${g.error}\n`));
    }
    Object.entries(gaps.matrices).forEach(([k, m]) => {
      process.stdout.write(`  ✓ ${k}: ${m.relative} (${m.source})\n`);
    });
    if (out.pipelineNext?.command) {
      process.stdout.write(`Pipeline: [${out.pipelineNext.layer}] ${out.pipelineNext.rule}\n`);
      process.stdout.write(`  → ${out.pipelineNext.command}\n`);
    }
    return;
  }

  process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
};

main();
