#!/usr/bin/env node
/**
 * Cartographie écarts ground truth Cinnamon — prédicats Cin*.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id linux-mint --write
 *   node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id linux-mint --write --sync-man
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildCinnamonGaps,
  writeCinnamonFormalState,
  cinPathsForRegistry,
  readJsonIfExists,
  ROOT,
} from './cinnamon-ground-truth-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', write: false, json: false, syncMan: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--sync-man') opts.syncMan = true;
  }
  return opts;
};

const syncManifestPlaybook = (registryId) => {
  const paths = cinPathsForRegistry(registryId);
  const integration = readJsonIfExists(paths.integrationPass);
  const playbookPath = paths.manifestPlaybook;
  if (!integration?.manSigma || !fs.existsSync(playbookPath)) {
    return { synced: false, reason: 'integration-pass ou playbook absent' };
  }
  const playbook = JSON.parse(fs.readFileSync(playbookPath, 'utf8'));
  let changed = false;
  if (integration.manSigma.stagingCompleted && playbook.staging?.status !== 'completed') {
    playbook.staging = { ...playbook.staging, status: 'completed', completedAt: integration.generatedAt };
    changed = true;
  }
  if (integration.manSigma.importCompleted && playbook.import?.status !== 'completed') {
    playbook.import = { ...playbook.import, status: 'completed', completedAt: integration.generatedAt };
    changed = true;
  }
  if (integration.manSigma.manifestApproved) {
    playbook.validation = {
      ...playbook.validation,
      status: 'approved',
      approved: true,
      approvedAt: integration.generatedAt,
    };
    changed = true;
  }
  if (playbook.summary) {
    playbook.summary.drift = 0;
    playbook.summary.pull = playbook.summary.pull ?? 0;
    changed = true;
  }
  if (changed) {
    playbook.updatedAt = new Date().toISOString();
    playbook.pf4ClosedAt = new Date().toISOString();
    fs.writeFileSync(playbookPath, `${JSON.stringify(playbook, null, 2)}\n`);
  }
  return { synced: changed, playbookPath };
};

const printHuman = (gapMap) => {
  const s = gapMap.predicates;
  process.stdout.write(`\n=== cinnamon-ground-truth-gaps ${gapMap.registryId} ===\n`);
  process.stdout.write(
    `CinI=${s.CinI} CinM=${s.CinM} CinA=${s.CinA} CinC=${s.CinC} `
      + `CinS=${s.CinS} CinΠ=${s.CinΠ} CinCred=${s.CinCred} CinΣ=${s.CinΣ}\n`,
  );
  process.stdout.write(
    `Π_global=${gapMap.metrics.pi_global} · cloisonnement=${gapMap.metrics.cloisonnementScore} `
      + `· CSS phys=${gapMap.metrics.physicalCssUrls}\n`,
  );
  process.stdout.write(`Gaps: ${gapMap.summary.totalGaps} (P0=${gapMap.summary.p0} P1=${gapMap.summary.p1} P2=${gapMap.summary.p2})\n`);
  gapMap.gaps.forEach((g) => {
    process.stdout.write(`  [${g.priority}] ${g.id} → ${g.predicate}: ${g.summary}\n`);
  });
  if (gapMap.summary.cinSigma) {
    process.stdout.write('✓ CinΣ satisfait sur périmètre cartographié\n');
  } else if (gapMap.summary.totalGaps === 0) {
    process.stdout.write('✓ Aucun écart documenté — vérifier prédicats formels\n');
  }
};

const main = () => {
  const opts = parseArgs();
  if (opts.syncMan) {
    const sync = syncManifestPlaybook(opts.id);
    if (sync.synced) {
      process.stdout.write(`✓ Playbook ManΣ synchronisé — ${sync.playbookPath}\n`);
    }
  }
  const gapMap = buildCinnamonGaps(opts.id);
  if (opts.write) {
    const outPath = cinPathsForRegistry(opts.id).gaps;
    fs.writeFileSync(outPath, `${JSON.stringify(gapMap, null, 2)}\n`);
    process.stdout.write(`Écrit ${outPath}\n`);
    writeCinnamonFormalState(opts.id);
    const repPath = cinPathsForRegistry(opts.id).replicationState;
    const rep = readJsonIfExists(repPath);
    if (rep) {
      rep.currentFocus = 'cinnamon-perfection-pass';
      rep.groundTruth = {
        chain: 'cinnamon',
        contract: 'etc/capsuleos/contracts/cinnamon-ground-truth-chain.json',
        doc: 'root/docs/ground-truth-cinnamon.md',
        predicates: gapMap.predicates,
        cinSigma: gapMap.summary.cinSigma,
        gaps: gapMap.summary.totalGaps,
        evaluatedAt: gapMap.generatedAt,
      };
      rep.updatedAt = new Date().toISOString();
      fs.writeFileSync(repPath, `${JSON.stringify(rep, null, 2)}\n`);
    }
  }
  if (opts.json) {
    process.stdout.write(`${JSON.stringify(gapMap, null, 2)}\n`);
  } else {
    printHuman(gapMap);
  }
};

main();
