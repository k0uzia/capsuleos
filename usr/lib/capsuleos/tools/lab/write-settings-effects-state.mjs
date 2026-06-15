#!/usr/bin/env node
/**
 * Écrit l'état Π_se settings-effects par registry (généralisation replication-state).
 * Usage : node usr/lib/capsuleos/tools/lab/write-settings-effects-state.mjs --id linux-kde-neon
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const registry = (process.argv.find((a, i) => process.argv[i - 1] === '--id') || '').trim();
if (!registry) {
  console.error('Usage: write-settings-effects-state.mjs --id <registryId>');
  process.exit(1);
}

const contract = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'etc/capsuleos/contracts/settings-effects-chain.json'), 'utf8')
);

const toolkitChains = contract.toolkitChains || {};
let gate = null;
let toolkit = null;
Object.entries(toolkitChains).forEach(([tk, chain]) => {
  if (chain.pilotRegistryId === registry) {
    gate = chain.verifyGate;
    toolkit = tk;
  }
});

const recipes = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'etc/capsuleos/contracts/lab-recipe-profiles.json'), 'utf8')
);
const profile = recipes.profiles[registry];
if (!gate && profile?.toolkit && toolkitChains[profile.toolkit]) {
  gate = toolkitChains[profile.toolkit].verifyGate;
  toolkit = profile.toolkit;
}

if (!gate) {
  console.error(`Aucune gate settings-effects pour ${registry}`);
  process.exit(1);
}

const gatePath = path.join(ROOT, gate);
const r = spawnSync('node', [gatePath, '--id', registry], { cwd: ROOT, encoding: 'utf8' });
const seSigma = r.status === 0;

const state = {
  registryId: registry,
  domain: 'settings-effects',
  generatedAt: new Date().toISOString(),
  toolkit,
  predicates: { Se: true, SeΣ: seSigma },
  gate,
  phase: seSigma ? 'closed' : 'open',
  stdout: (r.stdout || '').trim().split('\n').slice(-1)[0] || '',
};

const outPath = path.join(ROOT, 'root/docs/inventaires', `${registry}-settings-effects-state.json`);
fs.writeFileSync(outPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
console.log(`→ ${outPath} SeΣ=${seSigma}`);
process.exit(seSigma ? 0 : 1);
