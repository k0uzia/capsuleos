#!/usr/bin/env node
/**
 * Smoke P6 — propagation KDE v15 Neon → dérivés (P-OS7).
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-kde-v15-propagation.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const errors = [];

const derived = ['linux-debian-kde', 'linux-mx-kde', 'linux-opensuse'];

const runNode = (label, script, args = []) => {
  const r = spawnSync('node', [script, ...args], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    errors.push(`${label} — échec`);
    return false;
  }
  return true;
};

runNode('P4 propagation', 'usr/lib/capsuleos/tools/lab/smoke-kde-p4-propagation.mjs');
runNode('V4 P3 propagation', 'usr/lib/capsuleos/tools/lab/smoke-kde-v4-p3-propagation.mjs');

derived.forEach((id) => {
  const profilePath = path.join(ROOT, 'etc/capsuleos/profiles', `${id}.json`);
  if (!fs.existsSync(profilePath)) {
    errors.push(`${id} : profil absent`);
    return;
  }
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  const themesOverride = profile.capsuleGlobals?.CAPSULE_TEMPLATE_OVERRIDES?.themes || '';
  if (!themesOverride.includes('systemsettings_kde_neon.html')) {
    errors.push(`${id} : profil themes → systemsettings_kde_neon.html requis (v15)`);
  }
  if (!runNode(`toolkit-paradigm ${id}`, 'usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs', ['--id', id])) {
    return;
  }
  const registryPath = path.join(ROOT, 'etc/capsuleos/os-registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const entry = (registry.entries || []).find((e) => e.id === id);
  const upstream = entry?.upstreamId || profile.upstreamId;
  if (id === 'linux-mx-kde' && upstream && upstream !== 'linux-debian-kde') {
    errors.push(`${id} : upstream attendu linux-debian-kde (${upstream})`);
  }
});

const neonProfile = path.join(ROOT, 'etc/capsuleos/profiles/linux-kde-neon.json');
if (fs.existsSync(neonProfile)) {
  const p = JSON.parse(fs.readFileSync(neonProfile, 'utf8'));
  const themes = p.capsuleGlobals?.CAPSULE_TEMPLATE_OVERRIDES?.themes || '';
  if (!themes.includes('systemsettings_kde_neon.html')) {
    errors.push('linux-kde-neon : gabarit canon neon requis');
  }
}

const slots = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'etc/capsuleos/contracts/slots-manifest.json'), 'utf8')
);
const kdeVariant = slots.slots?.themes?.toolkitVariants?.kde;
if (!kdeVariant || !String(kdeVariant.template || '').includes('systemsettings_kde_neon.html')) {
  errors.push('slots-manifest themes.toolkitVariants.kde → systemsettings_kde_neon.html requis');
}

const report = {
  ok: errors.length === 0,
  phase: 'P6-v15-propagation',
  derived: derived.length,
  errors,
};

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
