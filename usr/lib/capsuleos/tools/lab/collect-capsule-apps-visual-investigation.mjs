#!/usr/bin/env node
/**
 * Captures Capsule apps (couche Vc) — squelette ; réutilise capture-capsule-rocky pour P0.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/collect-capsule-apps-visual-investigation.mjs --id linux-rocky
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { appsPathsForRegistry, capsuleCaptureCandidates } from './apps-replication-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  if (!fs.existsSync(paths.appsVisualInvestigation)) {
    console.error('✗ inventaire apps-visual absent — collect-vm-apps-visual-investigation d’abord');
    process.exit(1);
  }

  if (opts.id === 'linux-rocky') {
    const script = path.join(ROOT, 'root/tools/lab/capture-capsule-rocky.mjs');
    if (fs.existsSync(script)) {
      const dest = paths.capsuleCapturesDir;
      fs.mkdirSync(dest, { recursive: true });
      const res = spawnSync(process.execPath, [script, dest], {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env },
      });
      if (res.status !== 0) process.exit(res.status || 1);
    }
  }

  const inv = JSON.parse(fs.readFileSync(paths.appsVisualInvestigation, 'utf8'));
  for (const item of inv.investigations || []) {
    if (item.parityPriority !== 'P0' || item.status !== 'documented') continue;
    const slot = item.controlId;
    const candidates = capsuleCaptureCandidates(slot).map((name) => path.join(paths.capsuleCapturesDir, name));
    const found = candidates.find((p) => fs.existsSync(p));
    if (found) {
      item.capsuleCaptures = [{ path: found.replace(`${ROOT}/`, ''), shot: 'default' }];
    }
  }

  inv.summary.capsuleCapturesP0 = (inv.investigations || []).filter(
    (i) => i.parityPriority === 'P0' && (i.capsuleCaptures || []).length,
  ).length;
  inv.updatedAt = new Date().toISOString();
  fs.writeFileSync(paths.appsVisualInvestigation, `${JSON.stringify(inv, null, 2)}\n`);
  console.log(`✓ AppVc — capsuleCapturesP0=${inv.summary.capsuleCapturesP0}`);
};

main();
