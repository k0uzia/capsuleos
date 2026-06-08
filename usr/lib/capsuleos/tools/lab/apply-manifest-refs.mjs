#!/usr/bin/env node
/**
 * Applique les rewrite-ref du playbook manifeste sur le skin home/ (post-import ManI).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/apply-manifest-refs.mjs --id linux-ubuntu --write
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  loadPlaybook,
  writePlaybook,
  buildPlaybook,
} from './manifest-playbook-lib.mjs';
import { writeIconPackRefs, ICON_PACK_CATEGORIES } from './manifest-icon-pack-refs-lib.mjs';
import { skinIndexPath } from './apps-catalog-lib.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSET_PREFIX = '../../../usr/share/capsuleos/assets/';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false, skipSync: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--skip-sync') opts.skipSync = true;
  }
  return opts;
};

const runScript = (script, argv, write) => {
  const args = [...argv];
  if (write && !args.includes('--write')) args.push('--write');
  const res = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  return res.status === 0;
};

const patchWallpaperRefs = (registryId, items, write) => {
  const indexPath = skinIndexPath(registryId);
  let html = fs.readFileSync(indexPath, 'utf8');
  let patched = 0;

  for (const item of items) {
    if (item.category !== 'wallpaper' || !item.capsuleRelative) continue;
    const newRef = `${ASSET_PREFIX}${item.capsuleRelative}`;
    const base = path.basename(item.capsuleRelative);
    if (html.includes(newRef)) continue;
    if (html.includes(base)) {
      html = html.split(base).join(path.basename(newRef));
      patched += 1;
    } else if (write) {
      console.warn(`  ⚠ wallpaper ${base} — aucune ref skin à réécrire`);
    }
  }

  if (write && patched) {
    fs.writeFileSync(indexPath, html, 'utf8');
  }
  return patched;
};

const main = () => {
  const opts = parseArgs();
  let playbook = loadPlaybook(opts.id);
  if (!playbook) {
    console.error('Playbook absent');
    process.exit(1);
  }
  if (playbook.import?.status !== 'completed' && opts.write) {
    console.error('Import non terminé — import-manifest-staging.mjs --write');
    process.exit(1);
  }

  const rewriteItems = (playbook.items || []).filter((i) => i.action === 'rewrite-ref');
  const appIcons = rewriteItems.filter((i) => i.category === 'app-icon');
  const wallpapers = rewriteItems.filter((i) => i.category === 'wallpaper');
  const mediaDrift = rewriteItems.filter((i) => ICON_PACK_CATEGORIES.has(i.category));

  console.log(`── apply-manifest-refs ${opts.id} ──`);
  console.log(
    `  rewrite-ref: ${rewriteItems.length} (apps=${appIcons.length}, wallpaper=${wallpapers.length}, media=${mediaDrift.length})`,
  );

  if (appIcons.length || playbook.items?.some((i) => i.category === 'app-icon')) {
    console.log('→ generate-overview-apps-grid');
    if (!runScript('generate-overview-apps-grid.mjs', ['--id', opts.id], opts.write)) {
      process.exit(1);
    }
  }

  const wpPatched = patchWallpaperRefs(opts.id, wallpapers, opts.write);
  if (wpPatched) console.log(`  ✓ ${wpPatched} ref(s) wallpaper`);

  const { pathCount, outPath } = writeIconPackRefs(opts.id, playbook, opts.write);
  console.log(`  ✓ manifest media refs — ${pathCount} chemins → ${outPath.replace(`${ROOT}/`, '')}`);

  if (opts.write) {
    playbook = buildPlaybook(opts.id);
    writePlaybook(opts.id, playbook);
    console.log(
      `  ✓ playbook régénéré — pull=${playbook.summary.pull} drift=${playbook.summary.drift} skip=${playbook.summary.skip}`,
    );
  }

  if (!opts.skipSync && opts.write) {
    console.log('→ sync-linux-skin-closure');
    const syncRes = spawnSync(process.execPath, [
      path.join(ROOT, 'usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs'),
    ], { cwd: ROOT, stdio: 'inherit' });
    if (syncRes.status !== 0) process.exit(1);
  }

  if (opts.write) {
    const final = loadPlaybook(opts.id);
    final.phases = (final.phases || []).map((p) => (
      p.id === 'integrate-skin' ? { ...p, status: 'done' } : p
    ));
    writePlaybook(opts.id, final);
    console.log('✓ integrate-skin — playbook mis à jour');
  } else {
    console.log('Dry-run — ajouter --write pour appliquer');
  }
};

main();
