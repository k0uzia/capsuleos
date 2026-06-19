#!/usr/bin/env node
/**
 * Smoke manifeste distribution VM — gate avant approbation / import.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadManifest,
  validateManifestStructure,
  loadManifestContract,
} from './vm-manifest-lib.mjs';
import { loadAppsContract } from './apps-catalog-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const errors = [];
  const manifest = loadManifest(opts.id);
  if (!manifest) {
    errors.push(`proc/${opts.id}/distribution-manifest.json absent`);
  } else {
    const contract = loadManifestContract();
    errors.push(...validateManifestStructure(manifest, contract));

    const appsContract = loadAppsContract();
    const overrides = appsContract.registryOverrides?.[opts.id]?.apps || {};
    const p0OnVm = Object.entries(overrides)
      .filter(([, spec]) => spec.priorite === 'P0' && spec.onVm !== false);
    const p0Ids = p0OnVm.map(([id]) => id);

    const gridIds = new Set(
      (manifest.applications?.gridVisible || []).map((e) => e.normalizedId || e.id),
    );
    const allIds = new Set(
      (manifest.applications?.entries || []).map((e) => e.normalizedId || e.id),
    );

    const warnings = [];
    const manifestIdsFor = (p0, spec) => {
      const aliases = Array.isArray(spec.vmManifestIds) ? spec.vmManifestIds : [];
      return [p0, ...aliases];
    };
    const hasManifestId = (ids) => ids.some(
      (id) => gridIds.has(id) || allIds.has(id),
    );
    for (const [p0, spec] of p0OnVm) {
      const ids = manifestIdsFor(p0, spec);
      if (!hasManifestId(ids)) {
        errors.push(`P0 onVm absent du scan VM: ${p0}${spec.note ? ` (${spec.note})` : ''}`);
      } else if (!gridIds.has(p0) && !ids.some((id) => gridIds.has(id))) {
        const hit = ids.find((id) => allIds.has(id));
        const entry = manifest.applications.entries.find(
          (e) => (e.normalizedId || e.id) === hit,
        );
        warnings.push(`P0 présent mais masqué grille: ${p0} (${(entry?.hideReasons || []).join(',')})`);
      }
    }
    const notOnVm = Object.entries(overrides)
      .filter(([, spec]) => spec.priorite === 'P0' && spec.onVm === false);
    for (const [id, spec] of notOnVm) {
      if (!allIds.has(id)) {
        warnings.push(`P0 onVm:false non installé VM (attendu): ${id}`);
      }
    }
    if (warnings.length) {
      warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
    }

    if (!manifest.import?.bundles?.length) {
      errors.push('import.bundles vide');
    }
    if ((manifest.manifestVersion || 1) >= 2) {
      const m = manifest.media || {};
      if (!m.fonts?.entryCount) console.warn('  ⚠ media.fonts vide');
      if (!m.mimetypes?.entryCount) console.warn('  ⚠ media.mimetypes vide');
      if (!m.places?.entryCount) console.warn('  ⚠ media.places vide');
    }
  }

  if (errors.length) {
    console.error(`✗ smoke-vm-distribution-manifest (${opts.id})`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✓ smoke-vm-distribution-manifest OK — ${opts.id}`);
};

main();
