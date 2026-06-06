#!/usr/bin/env node
/**
 * Smoke structurel apps — matrice catalogue ↔ template ↔ skin ↔ embed (couche 1).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-apps-matrix.mjs --id linux-rocky
 */
import fs from 'fs';
import path from 'path';
import { buildCatalog, skinIndexPath } from './apps-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';
import { validateOsFacadeFidelity } from '../linux/os-facade-fidelity-lib.mjs';

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
  const errors = [];
  const catalog = buildCatalog(opts.id);
  const indexHtml = fs.readFileSync(skinIndexPath(opts.id), 'utf8');
  const embedPath = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-app-embed.js');
  const embed = fs.existsSync(embedPath) ? fs.readFileSync(embedPath, 'utf8') : '';

  const skinDir = path.dirname(skinIndexPath(opts.id));
  const styleApps = path.join(skinDir, 'style/apps');

  for (const row of catalog.rows) {
    if (row.statut !== 'ok' || !row.slotCapsule || !row.specs) continue;

    const { template, skinCss, chromeProvider } = row.specs;
    const embedOnlyTemplates = new Set(['nemo-gnome', 'nemo-cosmic', 'dolphin', 'nautilus']);
    if (template) {
      const embedKey = template.endsWith('.html') ? template.replace('.html', '') : template;
      if (!embedOnlyTemplates.has(template)) {
        const tpl = path.join(ROOT, 'usr/share/capsuleos/linux/apps', template);
        if (!fs.existsSync(tpl)) errors.push(`${row.labelFr} : template ${template} absent`);
      }
      if (embed && !embed.includes(`"${embedKey}"`)) {
        errors.push(`${row.labelFr} : clé embed "${embedKey}" absente de capsule-app-embed.js`);
      }
    }

    if (skinCss) {
      const css = path.join(styleApps, skinCss);
      if (!fs.existsSync(css)) errors.push(`${row.labelFr} : skin ${skinCss} absent`);
    }

    if (!indexHtml.includes(`data-link="${row.slotCapsule}"`)) {
      errors.push(`${row.labelFr} : data-link="${row.slotCapsule}" absent de index.html`);
    }

    if (chromeProvider && !indexHtml.includes('capsule-window.js')) {
      errors.push('index.html : capsule-window.js requis pour chrome apps');
    }
  }

  errors.push(...validateOsFacadeFidelity(opts.id));

  if (errors.length) {
    console.error(`smoke-apps-matrix ${opts.id} — échec\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const okRows = catalog.rows.filter((r) => r.statut === 'ok' && r.specs).length;
  console.log(`✓ smoke-apps-matrix ${opts.id} OK — ${okRows} app(s) ok vérifiée(s)`);
};

main();
