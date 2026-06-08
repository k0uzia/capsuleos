#!/usr/bin/env node
/**
 * Checkpoint assets post-clonage — existence des fichiers référencés par un skin OS.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --skin home/Debian/Mint
 *   node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint --hash
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const ASSETS_ROOT = path.join(ROOT, 'usr/share/capsuleos/assets');
const MANIFEST = path.join(ASSETS_ROOT, 'manifest.json');

const IMAGE_EXT = ['.png', '.svg', '.webp', '.jpg', '.jpeg', '.gif', '.ico'];
const EXTRA_KERNEL = {
  'linux-mint': [
    'usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js',
  ],
};

const args = process.argv.slice(2);
const idIdx = args.indexOf('--id');
const skinIdx = args.indexOf('--skin');
const withHash = args.includes('--hash');

const errors = [];
const warnings = [];

const stripQuery = (u) => u.split('?')[0].split('#')[0];

const isExternal = (u) => /^(?:https?:|\/\/|mailto:|javascript:|data:|#)/i.test(u);

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

const loadTarget = () => {
  if (skinIdx >= 0) {
    const skinRel = args[skinIdx + 1];
    const skinDir = path.join(ROOT, skinRel);
    const profilePath = path.join(skinDir, 'skin.profile.json');
    if (!fs.existsSync(profilePath)) {
      console.error(`✗ skin.profile.json introuvable sous ${skinRel}`);
      process.exit(1);
    }
    return { id: readJson(path.relative(ROOT, profilePath)).id || skinRel, skinRel, profile: readJson(path.relative(ROOT, profilePath)) };
  }
  if (idIdx >= 0) {
    const id = args[idIdx + 1];
    const registry = readJson('etc/capsuleos/os-registry.json');
    const entry = registry.entries.find((e) => e.id === id);
    if (!entry || !entry.skin) {
      console.error(`✗ entrée registre introuvable ou sans skin: ${id}`);
      process.exit(1);
    }
    const profilePath = path.join(ROOT, path.dirname(entry.skin), 'skin.profile.json');
    const profile = fs.existsSync(profilePath)
      ? JSON.parse(fs.readFileSync(profilePath, 'utf8'))
      : null;
    return { id, skinRel: entry.skin, profile };
  }
  console.error('Usage: validate-clone-assets.mjs --id <registryId> | --skin <path>');
  process.exit(1);
};

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

const target = loadTarget();
const skinDir = path.join(ROOT, path.dirname(target.skinRel));
const assetsBase = target.profile?.assets?.assetsBase || '../../../usr/share/capsuleos/assets';
const scanFiles = walkSkin(skinDir);
const kernelExtras = EXTRA_KERNEL[target.id] || [];
kernelExtras.forEach((rel) => {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) scanFiles.push(full);
});

const hashIndex = loadHashIndex();
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
  console.warn(`\n⚠ ${warnings.length} avertissement(s) hash`);
  warnings.slice(0, 10).forEach((w) => console.warn(`  ${w}`));
}

if (errors.length) {
  console.error(`\n✗ validate-clone-assets : ${errors.length} asset(s) manquant(s)`);
  errors.slice(0, 40).forEach((e) => console.error(`  ✗ ${e}`));
  if (errors.length > 40) console.error(`  ... et ${errors.length - 40} autres`);
  process.exit(1);
}

console.log('✓ validate-clone-assets OK — tous les assets référencés existent');
