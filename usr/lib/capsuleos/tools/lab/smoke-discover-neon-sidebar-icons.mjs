#!/usr/bin/env node
/**
 * Smoke assets icônes sidebar Discover — parité SHA256 VM ↔ dépôt (prédicat S).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-discover-neon-sidebar-icons.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const script = path.join(ROOT, 'root/tools/lab/pull-kde-neon-discover-sidebar-icons.sh');

const r = spawnSync('bash', [script, '--verify-only'], {
  cwd: ROOT,
  encoding: 'utf8',
  env: {
    ...process.env,
    KDE_NEON_SSH: process.env.KDE_NEON_SSH || 'goupil@192.168.123.52',
  },
});

const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
if (r.status !== 0) {
  console.error('smoke-discover-neon-sidebar-icons — ÉCHEC');
  console.error(out);
  process.exit(1);
}

const okCount = (out.match(/✓/g) || []).length;
console.log(`smoke-discover-neon-sidebar-icons — OK (${okCount} icônes sidebar alignées VM)`);
