#!/usr/bin/env node
/**
 * Checkpoint assets post-clonage — existence des fichiers référencés par un skin OS.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --all
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --all --tier P0
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --skin home/Debian/Mint
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  EXTRA_KERNEL_BY_ID,
  listCloneTargets,
  ROOT_FROM_TOOLS,
} from './clone-checkpoints-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = ROOT_FROM_TOOLS;
const ASSETS_ROOT = path.join(ROOT, 'usr/share/capsuleos/assets');
const MANIFEST = path.join(ASSETS_ROOT, 'manifest.json');

const IMAGE_EXT = ['.png', '.svg', '.webp', '.jpg', '.jpeg', '.gif', '.ico'];

const args = process.argv.slice(2);
const idIdx = args.indexOf('--id');
const skinIdx = args.indexOf('--skin');
const tierIdx = args.indexOf('--tier');
const runAll = args.includes('--all');
const withHash = args.includes('--hash');

const stripQuery = (u) => u.split('?')[0].split('#')[0];
const isExternal = (u) => /^(?:https?:|\/\/|mailto:|javascript:|data:|#)/i.test(u);
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

const fileExists = (abs) => {
  if (fs.existsSync(abs)) return abs;
  const ext = path.extname(abs);
  if (ext) return null;
  for (let i = 0; i < IMAGE_EXT.length; i += 1) {
    const candidate = abs + IMAGE_EXT[i];
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
};

const resolveLogical = (skinDir, url, assetsBase) => {
  const clean = stripQuery(url);
  if (clean.startsWith('./assets/')) {
    const tail = clean.slice('./assets/'.length);
    const base = path.normalize(path.join(skinDir, assetsBase || '../../../usr/share/capsuleos/assets'));
    return path.join(base, tail);
  }
  if (clean.startsWith('./icons/')) {
    const tail = clean.slice('./icons/'.length);
    const base = path.normalize(path.join(skinDir, assetsBase || '../../../usr/share/capsuleos/assets'));
    return path.join(base, 'icons', tail);
  }
  if (clean.includes('usr/share/capsuleos/assets/')) {
    const tail = clean.replace(/^.*usr\/share\/capsuleos\/assets\//, '');
    return path.join(ASSETS_ROOT, tail);
  }
  if (!path.isAbsolute(clean) && !clean.startsWith('..')) {
    return path.normalize(path.join(skinDir, clean));
  }
  return path.normalize(path.join(skinDir, clean));
};

const extractRefs = (text) => {
  const refs = new Set();
  const panelPrefixMatch = text.match(/var\s+panelIcon\s*=\s*['"]([^'"]+)['"]/);
  const panelPrefix = panelPrefixMatch ? panelPrefixMatch[1] : null;
  const patterns = [
    /(?:src|href)=["']([^"']+)["']/gi,
    /url\((['"]?)([^'")]+)\1?\)/gi,
    /icon:\s*['"]([^'"]+)['"]/g,
    /(?:app\.icon\s*=\s*|img\.src\s*=\s*)(?:resolveCapsuleResourceUrl\([^)]*\)\s*\|\|\s*)?['"]([^'"]+)['"]/g,
    /panelIcon\s*\+\s*['"]([^'"]+)['"]/g,
  ];
  patterns.forEach((re) => {
    let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text))) {
      let u = m[m.length - 1];
      if (re.source.includes('panelIcon') && panelPrefix) {
        u = panelPrefix + u;
      }
      if (u && !isExternal(u) && (u.includes('assets') || u.includes('icons') || /\.(png|svg|webp|jpg|jpeg|gif|ico)$/i.test(u))) {
        refs.add(stripQuery(u));
      }
    }
  });
  return [...refs];
};

const walkSkin = (dir, files = []) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name === 'node_modules' || name === '.git') continue;
    const st = fs.lstatSync(full);
    if (st.isDirectory()) {
      walkSkin(full, files);
    } else if (/\.(html|css|js|json)$/i.test(name)) {
      files.push(full);
    }
  }
  return files;
};

const loadHashIndex = () => {
  if (!withHash || !fs.existsSync(MANIFEST)) return null;
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const index = new Map();
  const files = manifest.files || manifest.entries || [];
  if (Array.isArray(files)) {
    files.forEach((entry) => {
      if (entry.path && entry.sha256) index.set(entry.path.replace(/^\//, ''), entry.sha256);
    });
  }
  return index;
};

const sha256File = (abs) => {
  const buf = fs.readFileSync(abs);
  return crypto.createHash('sha256').update(buf).digest('hex');
};

const resolveTarget = (id, skinRel) => {
  const profilePath = path.join(ROOT, path.dirname(skinRel), 'skin.profile.json');
  const profile = fs.existsSync(profilePath)
    ? JSON.parse(fs.readFileSync(profilePath, 'utf8'))
    : null;
  return { id, skinRel, profile };
};

const loadSingleTarget = () => {
  if (skinIdx >= 0) {
    const skinRel = args[skinIdx + 1];
    const profilePath = path.join(ROOT, skinRel, 'skin.profile.json');
    if (!fs.existsSync(path.join(ROOT, skinRel))) {
      console.error(`✗ skin introuvable: ${skinRel}`);
      process.exit(1);
    }
    const profile = fs.existsSync(profilePath)
      ? readJson(path.relative(ROOT, profilePath))
      : null;
    return resolveTarget(profile?.id || skinRel, skinRel.endsWith('index.html') ? skinRel : `${skinRel}/index.html`);
  }
  if (idIdx >= 0) {
    const id = args[idIdx + 1];
    const registry = readJson('etc/capsuleos/os-registry.json');
    const entry = registry.entries.find((e) => e.id === id);
    if (!entry || !entry.skin) {
      console.error(`✗ entrée registre introuvable ou sans skin: ${id}`);
      process.exit(1);
    }
    return resolveTarget(id, entry.skin);
  }
  return null;
};

const validateOne = (target, hashIndex) => {
  const errors = [];
  const warnings = [];
  const skinDir = path.join(ROOT, path.dirname(target.skinRel));
  const assetsBase = target.profile?.assets?.assetsBase || '../../../usr/share/capsuleos/assets';
  const scanFiles = walkSkin(skinDir);
  const kernelExtras = EXTRA_KERNEL_BY_ID[target.id] || [];
  kernelExtras.forEach((rel) => {
    const full = path.join(ROOT, rel);
    if (fs.existsSync(full)) scanFiles.push(full);
  });

  const checked = new Set();
  scanFiles.forEach((file) => {
    const rel = path.relative(ROOT, file);
    const text = fs.readFileSync(file, 'utf8');
    extractRefs(text).forEach((url) => {
      const key = `${rel}::${url}`;
      if (checked.has(key)) return;
      checked.add(key);
      const resolved = resolveLogical(skinDir, url, assetsBase);
      const found = fileExists(resolved);
      if (!found) {
        errors.push(`${rel}: asset introuvable → ${url}`);
        return;
      }
      if (hashIndex) {
        const relAsset = path.relative(ASSETS_ROOT, found).split(path.sep).join('/');
        const expected = hashIndex.get(relAsset);
        if (expected) {
          const actual = sha256File(found);
          if (actual !== expected) {
            warnings.push(`${relAsset}: hash drift (attendu ${expected.slice(0, 8)}…, obtenu ${actual.slice(0, 8)}…)`);
          }
        }
      }
    });
  });

  console.log(`── validate-clone-assets (${target.id}) ──`);
  console.log(`  Skin: ${target.skinRel}`);
  console.log(`  Références uniques: ${checked.size}`);
  if (warnings.length) {
    console.warn(`  ⚠ ${warnings.length} avertissement(s) hash`);
    warnings.slice(0, 5).forEach((w) => console.warn(`    ${w}`));
  }
  if (errors.length) {
    console.error(`  ✗ ${errors.length} asset(s) manquant(s)`);
    errors.slice(0, 10).forEach((e) => console.error(`    ✗ ${e}`));
    return false;
  }
  console.log('  ✓ OK');
  return true;
};

const hashIndex = loadHashIndex();

if (runAll) {
  const tier = tierIdx >= 0 ? args[tierIdx + 1] : null;
  const targets = listCloneTargets(ROOT, { tier });
  if (!targets.length) {
    console.error('✗ aucune cible clone');
    process.exit(1);
  }
  console.log(`validate-clone-assets --all (${targets.length} skin(s)${tier ? `, tier ${tier}` : ''})`);
  let failed = false;
  targets.forEach((entry) => {
    const ok = validateOne(resolveTarget(entry.id, entry.skin), hashIndex);
    if (!ok) failed = true;
  });
  if (failed) {
    console.error('\n✗ validate-clone-assets --all : échec');
    process.exit(1);
  }
  console.log('\n✓ validate-clone-assets --all OK');
  process.exit(0);
}

const single = loadSingleTarget();
if (!single) {
  console.error('Usage: validate-clone-assets.mjs --id <id> | --skin <path> | --all [--tier P0]');
  process.exit(1);
}

const ok = validateOne(single, hashIndex);
process.exit(ok ? 0 : 1);
