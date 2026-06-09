#!/usr/bin/env node
/**
 * Gate formalisation PbΣ — Paramètres GNOME (P0 actifs).
 *
 * Usage : node usr/lib/capsuleos/tools/validate-gnome-settings-pbsigma.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');

const REQUIRED_PB = new Set([
  'linux-rocky',
  'linux-ubuntu',
]);

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const errors = [];
const warnings = [];

for (const entry of registry.entries) {
  if (!REQUIRED_PB.has(entry.id)) {
    continue;
  }
  if (entry.family !== 'linux' || entry.status !== 'active') {
    errors.push(`${entry.id}: entrée registre inactive ou non-Linux`);
    continue;
  }

  const toolkitId = entry.toolkit && entry.toolkit.id;
  if (toolkitId !== 'gnome') {
    warnings.push(`${entry.id}: toolkit.id !== gnome (${toolkitId}) — playbook gnome-settings non applicable`);
  }

  const readyRel = `root/docs/inventaires/${entry.id}-gnome-settings-h6-ready.json`;
  const closureRel = `root/docs/inventaires/${entry.id}-gnome-settings-h6-closure.json`;
  const visualRel = `root/docs/inventaires/${entry.id}-gnome-settings-visual-investigation.json`;
  const readyPath = path.join(ROOT, readyRel);
  const closurePath = path.join(ROOT, closureRel);
  const visualPath = path.join(ROOT, visualRel);

  if (!fs.existsSync(readyPath)) {
    errors.push(`${entry.id}: gate h6-ready absente (${readyRel})`);
  } else {
    const ready = JSON.parse(fs.readFileSync(readyPath, 'utf8'));
    if (!ready.h6Ready) {
      errors.push(`${entry.id}: h6Ready !== true (${readyRel})`);
    }
    if (!ready.pbSigma) {
      errors.push(`${entry.id}: pbSigma !== true (${readyRel})`);
    }
    if (ready.registryId && ready.registryId !== entry.id) {
      errors.push(`${entry.id}: registryId incohérent dans h6-ready (${ready.registryId})`);
    }
  }

  if (!fs.existsSync(closurePath)) {
    errors.push(`${entry.id}: clôture H6 absente (${closureRel})`);
  } else {
    const closure = JSON.parse(fs.readFileSync(closurePath, 'utf8'));
    if (closure.status !== 'closed') {
      errors.push(`${entry.id}: status !== "closed" (${closureRel})`);
    }
    const pbSigma = closure.predicates && closure.predicates.PbΣ;
    if (pbSigma !== true) {
      errors.push(`${entry.id}: predicates.PbΣ !== true (${closureRel})`);
    }
    if (closure.registryId && closure.registryId !== entry.id) {
      errors.push(`${entry.id}: registryId incohérent dans h6-closure (${closure.registryId})`);
    }
  }

  if (!fs.existsSync(visualPath)) {
    warnings.push(`${entry.id}: visual-investigation absent (${visualRel})`);
  }
}

if (warnings.length) {
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

if (errors.length) {
  console.error(`✗ validate-gnome-settings-pbsigma — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

console.log(`✓ validate-gnome-settings-pbsigma OK — PbΣ requis pour ${[...REQUIRED_PB].join(', ')}`);
