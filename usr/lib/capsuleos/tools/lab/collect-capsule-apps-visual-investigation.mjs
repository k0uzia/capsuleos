#!/usr/bin/env node
/**
 * Captures Capsule apps (couche Vc) — réutilise capture-capsule-rocky pour P0–P2.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/serve-capsule-http.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/collect-capsule-apps-visual-investigation.mjs --id linux-rocky
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/collect-capsule-apps-visual-investigation.mjs --id linux-rocky --filter P1
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { appsPathsForRegistry, findCapsuleCapture } from './apps-replication-lib.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';
import { ROOT } from './replication-chain-lib.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const GNOME_RHEL_CAPTURE_IDS = ['linux-rocky', 'linux-alma', 'linux-fedora'];
const KDE_NEON_CAPTURE_IDS = ['linux-kde-neon'];
const MINT_CAPTURE_IDS = ['linux-mint'];

const PRIORITIES = ['P0', 'P1', 'P2'];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', filter: 'all' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--filter' && args[i + 1]) opts.filter = args[++i];
  }
  return opts;
};

const prioritiesForFilter = (filter) => {
  if (filter === 'all') return PRIORITIES;
  return PRIORITIES.includes(filter) ? [filter] : [filter];
};

const countCapsuleCaptures = (investigations, prio) => (investigations || []).filter(
  (i) => i.parityPriority === prio && (i.capsuleCaptures || []).length,
).length;

const main = () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  if (!fs.existsSync(paths.appsVisualInvestigation)) {
    console.error('✗ inventaire apps-visual absent — collect-vm-apps-visual-investigation d’abord');
    process.exit(1);
  }

  const httpBase = resolveCapsuleHttpBase(opts.id);
  process.env.CAPSULE_HTTP_BASE = httpBase;

  if (GNOME_RHEL_CAPTURE_IDS.includes(opts.id)) {
    const script = path.join(ROOT, 'root/tools/lab/capture-capsule-rocky.mjs');
    if (fs.existsSync(script)) {
      const dest = paths.capsuleCapturesDir;
      fs.mkdirSync(dest, { recursive: true });
      const res = spawnSync(process.execPath, [script, dest], {
        cwd: ROOT,
        stdio: 'inherit',
        env: {
          ...process.env,
          CAPSULE_HTTP_BASE: httpBase,
          CAPSULE_ROCKY_URL: resolveCapsuleOsUrl(opts.id, httpBase),
        },
      });
      if (res.status !== 0) process.exit(res.status || 1);
    }
  }

  if (KDE_NEON_CAPTURE_IDS.includes(opts.id)) {
    const script = path.join(ROOT, 'root/tools/lab/capture-capsule-kde-neon.mjs');
    if (fs.existsSync(script)) {
      const dest = paths.capsuleCapturesDir;
      fs.mkdirSync(dest, { recursive: true });
      const res = spawnSync(process.execPath, [script, dest, '--apps-p0'], {
        cwd: ROOT,
        stdio: 'inherit',
        env: {
          ...process.env,
          CAPSULE_HTTP_BASE: httpBase,
          CAPSULE_KDE_NEON_URL: resolveCapsuleOsUrl(opts.id, httpBase),
        },
      });
      if (res.status !== 0) process.exit(res.status || 1);
    }
  }

  if (MINT_CAPTURE_IDS.includes(opts.id)) {
    const script = path.join(ROOT, 'root/tools/lab/capture-capsule-mint.mjs');
    if (fs.existsSync(script)) {
      const dest = paths.capsuleCapturesDir;
      fs.mkdirSync(dest, { recursive: true });
      const res = spawnSync(process.execPath, [script, dest], {
        cwd: ROOT,
        stdio: 'inherit',
        env: {
          ...process.env,
          CAPSULE_HTTP_BASE: httpBase,
          CAPSULE_MINT_URL: resolveCapsuleOsUrl(opts.id, httpBase),
        },
      });
      if (res.status !== 0) process.exit(res.status || 1);
    }
  }

  const inv = JSON.parse(fs.readFileSync(paths.appsVisualInvestigation, 'utf8'));
  const priorities = prioritiesForFilter(opts.filter);

  for (const item of inv.investigations || []) {
    if (!priorities.includes(item.parityPriority) || item.status !== 'documented') continue;
    const slot = item.controlId;
    const found = findCapsuleCapture(opts.id, slot, paths);
    if (found) {
      item.capsuleCaptures = [{ path: found.replace(`${ROOT}/`, ''), shot: 'default' }];
    }
    for (const shot of item.componentShots || []) {
      const shotCap = path.join(
        ROOT,
        'root/docs/inventaires/captures',
        opts.id,
        'apps-visual-capsule',
        slot,
        `${shot.shotId}-capsule.png`,
      );
      if (fs.existsSync(shotCap) && fs.statSync(shotCap).size > 0) {
        shot.capsuleCapture = shotCap.replace(`${ROOT}/`, '');
        shot.status = 'captured';
      }
    }
  }

  inv.summary = inv.summary || {};
  inv.summary.capsuleCapturesP0 = countCapsuleCaptures(inv.investigations, 'P0');
  inv.summary.capsuleCapturesP1 = countCapsuleCaptures(inv.investigations, 'P1');
  inv.summary.capsuleCapturesP2 = countCapsuleCaptures(inv.investigations, 'P2');
  inv.updatedAt = new Date().toISOString();
  fs.writeFileSync(paths.appsVisualInvestigation, `${JSON.stringify(inv, null, 2)}\n`);
  console.log(
    `✓ AppVc — filter=${opts.filter} ` +
      `P0=${inv.summary.capsuleCapturesP0} P1=${inv.summary.capsuleCapturesP1} P2=${inv.summary.capsuleCapturesP2}`,
  );
};

main();
