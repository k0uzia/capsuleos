#!/usr/bin/env node
/**
 * Vérifie l'existence des fichiers référencés (menu + apps + gabarits).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/validate-skin-icon-paths.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/validate-skin-icon-paths.mjs --id linux-mint --json
 *   node usr/lib/capsuleos/tools/validate-skin-icon-paths.mjs --id linux-mint --http
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets');
const REGISTRY_PATH = path.join(ROOT, 'etc/capsuleos/os-registry.json');

const EXT_TRY = ['', '.png', '.webp', '.svg', '.jpg', '.xpm', '.gif'];

const SKIN_SCOPES = {
  'linux-mint': {
    skin: 'home/Debian/Mint',
    skinPage: 'home/Debian/Mint/index.html',
    scanRoots: [
      'home/Debian/Mint',
      'usr/lib/capsuleos/shells/linux',
      'usr/share/capsuleos/linux/apps',
      'usr/share/capsuleos/linux/explorers',
    ],
    kernelExtras: [
      'usr/lib/capsuleos/shells/linux/mainMenu-data-cinnamon.js',
    ],
  },
  'linux-kde-neon': {
    skin: 'home/Debian/KDE-Neon',
    skinPage: 'home/Debian/KDE-Neon/index.html',
    scanRoots: [
      'home/Debian/KDE-Neon',
      'usr/share/capsuleos/linux/apps',
      'usr/share/capsuleos/linux/explorers/dolphin',
    ],
    kernelExtras: [
      'usr/lib/capsuleos/shells/linux/tray-popover-kde.js',
      'usr/lib/capsuleos/shells/linux/plasma-panel-mode.js',
    ],
  },
  'linux-ubuntu': {
    skin: 'home/Debian/Ubuntu',
    skinPage: 'home/Debian/Ubuntu/index.html',
    scanRoots: [
      'home/Debian/Ubuntu',
      'usr/lib/capsuleos/shells/linux',
      'usr/share/capsuleos/linux/apps',
      'usr/share/capsuleos/linux/explorers',
    ],
    kernelExtras: [],
  },
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', json: false, http: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--json') opts.json = true;
    else if (args[i] === '--http') opts.http = true;
  }
  return opts;
};

const fileExists = (absPath) => {
  try {
    const st = fs.lstatSync(absPath);
    return st.isFile() || st.isSymbolicLink();
  } catch {
    return false;
  }
};

const isConcreteAssetRef = (ref) => {
  if (!ref || ref.endsWith('/')) return false;
  const tail = ref.split('/').pop() || '';
  if (!tail) return false;
  if (/\.(png|webp|svg|jpg|gif|xpm|ico)$/i.test(tail)) return true;
  const dirOnly = new Set(['nemo', 'adwaita', 'yaru', 'cs', 'kde', 'cinnamon', 'gnome', 'cosmic']);
  if (dirOnly.has(tail)) return false;
  if (tail.endsWith('/')) return false;
  return tail.length > 2;
};

const resolveAssetRel = (ref) => {
  if (!ref || typeof ref !== 'string') return null;
  if (ref.startsWith('data:') || ref.startsWith('http') || ref.startsWith('#')) return null;
  if (!isConcreteAssetRef(ref)) return null;
  let rel = null;
  if (ref.startsWith('../../../usr/share/capsuleos/assets/')) {
    rel = ref.replace('../../../usr/share/capsuleos/assets/', '');
  } else if (ref.startsWith('./assets/')) {
    rel = ref.slice('./assets/'.length);
  } else {
    const idx = ref.indexOf('assets/');
    if (idx >= 0) rel = ref.slice(idx + 'assets/'.length);
  }
  if (!rel || rel.includes('..')) return null;
  return rel;
};

const resolveOnDisk = (rel) => {
  const base = path.join(ASSETS, rel);
  if (fileExists(base)) {
    return base;
  }
  const dot = rel.lastIndexOf('.');
  const stem = dot > 0 ? rel.slice(0, dot) : rel;
  const ext = dot > 0 ? rel.slice(dot) : '';
  if (ext && EXT_TRY.indexOf(ext) >= 0) {
    const noExt = path.join(ASSETS, stem);
    if (fileExists(noExt)) return noExt;
    for (let i = 0; i < EXT_TRY.length; i += 1) {
      const e = EXT_TRY[i];
      if (e === ext) continue;
      const p = noExt + e;
      if (fileExists(p)) return p;
    }
  }
  for (let i = 0; i < EXT_TRY.length; i += 1) {
    const p = base + EXT_TRY[i];
    if (fileExists(p)) return p;
  }
  return null;
};

const loadSkinProfile = (scope) => {
  const profilePath = path.join(ROOT, scope.skin, 'skin.profile.json');
  if (!fs.existsSync(profilePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
};

const resolveBrowserRef = (ref, assetsBase) => {
  if (!ref || typeof ref !== 'string') return ref;
  if (/^(https?:|data:|blob:|\/\/)/.test(ref)) return ref;
  let logical = ref;
  if (ref.startsWith('./assets/') && assetsBase) {
    const tail = ref.slice('./assets/'.length);
    logical = `${assetsBase.replace(/\/+$/, '')}/${tail}`;
  }
  return inferIconUrl(logical);
};

const loadRasterExtMap = () => {
  const jsPath = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/cinnamon-app-raster-ext.js');
  if (!fs.existsSync(jsPath)) {
    return {};
  }
  const text = fs.readFileSync(jsPath, 'utf8');
  const map = {};
  const re = /'([^']+)':\s*'(png|svg)'/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
};

const RASTER_EXT_MAP = loadRasterExtMap();

const inferIconUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (/\.(png|svg|webp|jpg|jpeg|gif|xpm|ico)$/i.test(url)) return url;
  if (url.includes('/vendors/mint/panel/')) return `${url}.webp`;
  if (url.includes('/icons/cinnamon/cs/')) return `${url}.png`;
  if (url.includes('/toolkits/') && url.includes('/apps/')) {
    const leaf = url.split('/').pop() || '';
    if (RASTER_EXT_MAP[leaf]) {
      return `${url}.${RASTER_EXT_MAP[leaf]}`;
    }
    if (/^(com\.github\.maoschanz\.drawing|io\.github\.celluloid_player\.Celluloid|org\.freedesktop\.IBus\.Setup|org\.gnome\.FileRoller|org\.gnome\.PowerStats|org\.gnome\.SystemMonitor)$/.test(leaf)) {
      return `${url}.png`;
    }
    return `${url}.svg`;
  }
  if (url.includes('/icons/')) return `${url}.svg`;
  if (url.includes('/images/')) return `${url}.png`;
  return url;
};

const resolveBrowserUrl = (ref, pageUrl, assetsBase) => {
  const resolved = resolveBrowserRef(ref, assetsBase);
  if (!resolved) return null;
  try {
    return new URL(resolved, pageUrl).href;
  } catch {
    return null;
  }
};

const urlCandidates = (ref, pageUrl, assetsBase) => {
  const primary = resolveBrowserUrl(ref, pageUrl, assetsBase);
  if (!primary) return [];
  const out = [primary];
  const dot = ref.lastIndexOf('.');
  const hasExt = dot > ref.lastIndexOf('/');
  if (hasExt) {
    const stemRef = ref.slice(0, dot);
    for (let i = 0; i < EXT_TRY.length; i += 1) {
      const ext = EXT_TRY[i];
      if (!ext || ref.endsWith(ext)) continue;
      const alt = resolveBrowserUrl(`${stemRef}${ext}`, pageUrl, assetsBase);
      if (alt && out.indexOf(alt) < 0) out.push(alt);
    }
  } else {
    for (let i = 0; i < EXT_TRY.length; i += 1) {
      const ext = EXT_TRY[i];
      if (!ext) continue;
      const alt = resolveBrowserUrl(`${ref}${ext}`, pageUrl, assetsBase);
      if (alt && out.indexOf(alt) < 0) out.push(alt);
    }
  }
  return out;
};

const httpOk = async (url) => {
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow' });
    }
    return res.ok;
  } catch {
    return false;
  }
};

const REF_PATTERNS = [
  /src=["'](\.\/assets\/[^"']+)["']/g,
  /src=["']((?:\.\.\/)+usr\/share\/capsuleos\/assets\/[^"']+)["']/g,
  /url\(["']?(\.\/assets\/[^"')]+)["']?\)/g,
  /icon:\s*["'](\.\/assets\/[^"']+)["']/g,
  /icon\s*=\s*["'](\.\/assets\/[^"']+)["']/g,
];

const walkFiles = (rootRel, out) => {
  const full = path.join(ROOT, rootRel);
  if (!fs.existsSync(full)) return;
  const stack = [full];
  while (stack.length) {
    const dir = stack.pop();
    let names;
    try {
      names = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (let i = 0; i < names.length; i += 1) {
      const name = names[i];
      if (name === 'node_modules') continue;
      const p = path.join(dir, name);
      let st;
      try {
        st = fs.lstatSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        stack.push(p);
      } else if (/\.(html|css|js|json)$/.test(name)) {
        out.push(p);
      }
    }
  }
};

const scanFile = (filePath, hits, broken) => {
  const relFile = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const text = fs.readFileSync(filePath, 'utf8');
  const seen = new Set();
  for (let p = 0; p < REF_PATTERNS.length; p += 1) {
    const re = REF_PATTERNS[p];
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const ref = m[1];
      if (!ref || !/(images|icons)\//.test(ref)) continue;
      const key = `${relFile}|${ref}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({ file: relFile, ref });
      const assetRel = resolveAssetRel(ref);
      if (!assetRel) continue;
      const resolved = resolveOnDisk(assetRel);
      if (!resolved) {
        broken.push({ file: relFile, ref, assetRel });
      }
    }
  }
};

const checkHttpRefs = async (hits, scope, profile) => {
  const httpBase = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501').replace(/\/+$/, '');
  const skinPage = scope.skinPage || `${scope.skin}/index.html`;
  const pageUrl = `${httpBase}/${skinPage.replace(/\\/g, '/')}`;
  const assetsBase = profile && profile.assets && profile.assets.assetsBase
    ? profile.assets.assetsBase
    : '../../../usr/share/capsuleos/assets';
  const broken = [];
  const checked = new Set();

  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i];
    if (!hit.ref.startsWith('./assets/')) continue;
    const key = hit.ref;
    if (checked.has(key)) continue;
    checked.add(key);

    const candidates = urlCandidates(hit.ref, pageUrl, assetsBase);
    let ok = false;
    for (let c = 0; c < candidates.length; c += 1) {
      if (await httpOk(candidates[c])) {
        ok = true;
        break;
      }
    }
    if (!ok) {
      broken.push({
        ref: hit.ref,
        url: candidates[0] || null,
        file: hit.file,
      });
    }
  }
  return { httpBase, pageUrl, assetsBase, brokenCount: broken.length, broken };
};

const main = async () => {
  const opts = parseArgs();
  const scope = SKIN_SCOPES[opts.id];
  if (!scope) {
    console.error(`✗ validate-skin-icon-paths — scope inconnu: ${opts.id}`);
    process.exit(1);
  }

  const files = [];
  scope.scanRoots.forEach((r) => walkFiles(r, files));
  scope.kernelExtras.forEach((rel) => {
    const p = path.join(ROOT, rel);
    if (fs.existsSync(p)) files.push(p);
  });

  const hits = [];
  const broken = [];
  files.forEach((f) => scanFile(f, hits, broken));

  let httpReport = null;
  if (opts.http) {
    const profile = loadSkinProfile(scope);
    httpReport = await checkHttpRefs(hits, scope, profile);
  }

  const report = {
    registryId: opts.id,
    scannedFiles: files.length,
    refsChecked: hits.length,
    brokenCount: broken.length,
    broken,
    http: httpReport,
  };

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`validate-skin-icon-paths — ${opts.id}\n`);
    process.stdout.write(`Fichiers: ${files.length} · refs: ${hits.length} · cassées disque: ${broken.length}\n`);
    broken.forEach((b) => {
      process.stdout.write(`  ✗ ${b.ref}\n    ${b.file}\n`);
    });
    if (httpReport) {
      process.stdout.write(`HTTP (${httpReport.httpBase}) · refs ./assets: ${httpReport.brokenCount} 404\n`);
      httpReport.broken.forEach((b) => {
        process.stdout.write(`  ✗ ${b.ref}\n    ${b.url}\n    ${b.file}\n`);
      });
    }
  }

  const failDisk = broken.length > 0;
  const failHttp = httpReport && httpReport.brokenCount > 0;
  if (failDisk || failHttp) {
    process.exit(1);
  }
  process.stdout.write(`✓ validate-skin-icon-paths OK — ${opts.id}\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
