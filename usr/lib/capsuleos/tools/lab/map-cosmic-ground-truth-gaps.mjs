#!/usr/bin/env node
/**
 * Cartographie gaps ground truth COSMIC — agrège gates Cos*.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/map-cosmic-ground-truth-gaps.mjs --id linux-popos
 *   node usr/lib/capsuleos/tools/lab/map-cosmic-ground-truth-gaps.mjs --id linux-popos --write
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ROOT } from './replication-chain-lib.mjs';

const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || 'linux-popos').trim();
const write = process.argv.includes('--write');

const contract = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'etc/capsuleos/contracts/cosmic-ground-truth-chain.json'),
  'utf8',
));

const results = [];
for (const gate of contract.gates || []) {
  const script = path.join(ROOT, gate.script);
  const args = (gate.args || []).join(' ');
  const cmd = `node ${script} ${args}`.trim();
  let ok = false;
  let detail = '';
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    ok = true;
  } catch (e) {
    detail = (e.stderr || e.stdout || e.message || '').split('\n')[0];
  }
  results.push({ predicate: gate.predicate, ok, cmd, detail });
}

const report = {
  registryId: registry,
  evaluatedAt: new Date().toISOString(),
  contract: 'etc/capsuleos/contracts/cosmic-ground-truth-chain.json',
  gates: results,
  allOk: results.every((r) => r.ok),
};

const outPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-cosmic-ground-truth-gaps.json`);
if (write) {
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Écrit ${outPath}`);
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.allOk ? 0 : 1);
