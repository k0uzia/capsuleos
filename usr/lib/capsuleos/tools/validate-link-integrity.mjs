#!/usr/bin/env node
/**
 * Vérifie l’existence des cibles href/src et la cohérence registre / hubs / pick-os.
 * Usage : node usr/lib/capsuleos/tools/validate-link-integrity.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const ASSETS_ROOT = path.join(ROOT, 'usr/share/capsuleos/assets');
const PICK_OS_ICONS = path.join(ASSETS_ROOT, 'images/platforms/pick-os');

const PORTAL_HUBS = [
  'index.html',
  'home/Debian/index.html',
  'OS/windows/index.html',
  'OS/linux/index.html',
];

const LEGACY_IN_HTML = [
  { id: '././assets', re: /\.\/(\.\/)+assets\// },
  { id: 'hub ../.././assets', re: /\.\.\/.*\/\.\/assets\// },
  { id: 'portail ./assets sans usr/share', re: /(?:src|href)=["'](?!\.\/usr\/share\/capsuleos\/assets)\.\/assets\// },
];

const errors = [];
const warnings = [];

const stripQuery = (u) => u.split('?')[0].split('#')[0];

const hasResourceBoot = (html) =>
  /capsule-resource\.js/i.test(html) || /capsule-skin-boot\.js/i.test(html);

const parseBase = (html, fileDir) => {
  const m = html.match(/<base\s+[^>]*href=["']([^"']+)["']/i);
  if (!m) return fileDir;
  return path.normalize(path.join(fileDir, m[1]));
};

const extractUrls = (html) => {
  const urls = [];
  const attrRe = /(?:src|href)=["']([^"']+)["']/gi;
  let m;
  while ((m = attrRe.exec(html))) urls.push(m[1]);
  return urls;
};

const isExternal = (u) =>
  /^(?:https?:|\/\/|mailto:|javascript:|data:|#)/i.test(u) || u.startsWith('//');

const resolveUrl = (baseDir, url) => {
  const clean = stripQuery(url);
  if (!clean || isExternal(clean)) return null;
  if (clean.startsWith('/')) return path.join(ROOT, clean.slice(1));
  return path.normalize(path.join(baseDir, clean));
};

const checkHtmlFile = (rel, opts = {}) => {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    errors.push(`Fichier manquant: ${rel}`);
    return;
  }
  const html = fs.readFileSync(full, 'utf8');
  const fileDir = path.dirname(full);
  const baseDir = parseBase(html, fileDir);
  const portal = opts.portal === true;
  const hydrated = hasResourceBoot(html);

  LEGACY_IN_HTML.forEach((p) => {
    if (portal && p.id.includes('portail') && p.re.test(html)) {
      errors.push(`${rel}: motif interdit (${p.id})`);
    }
    if (!portal && (p.id === '././assets' || p.id.includes('hub')) && p.re.test(html)) {
      errors.push(`${rel}: motif interdit (${p.id})`);
    }
  });

  if (portal) {
    const bareAssets = /(?:src|href)=["']\.\/assets\//.test(html);
    if (bareAssets) errors.push(`${rel}: hub portail — utiliser usr/share/capsuleos/assets`);
  }

  for (const url of extractUrls(html)) {
    if (isExternal(url)) continue;
    const resolved = resolveUrl(baseDir, url);
    if (!resolved) continue;

    if (url.includes('./assets/') || url.includes('../assets/')) {
      if (hydrated) continue;
      if (!fs.existsSync(resolved)) {
        const kernelPath = resolved.replace(
          /[/\\]OS[/\\][^/\\]+[/\\].*[/\\]assets[/\\]/,
          `${path.sep}usr${path.sep}share${path.sep}capsuleos${path.sep}assets${path.sep}`,
        );
        if (!fs.existsSync(kernelPath) && !fs.existsSync(resolved)) {
          errors.push(`${rel}: asset introuvable ${url}`);
        }
      }
      continue;
    }

    if (/\.(html|js|css|json|webp|png|svg|jpg|jpeg|gif|ico|woff2?)$/i.test(stripQuery(url))) {
      if (!fs.existsSync(resolved)) {
        errors.push(`${rel}: cible introuvable ${url}`);
      }
    }
  }
};

const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const active = registry.entries.filter((e) => e.status === 'active');

active.forEach((entry) => {
  if (entry.facade) {
    const facadePath = path.join(ROOT, entry.facade);
    if (!fs.existsSync(facadePath)) {
      errors.push(`Registre ${entry.id}: façade introuvable ${entry.facade}`);
    } else {
      checkHtmlFile(entry.facade, { portal: false });
      const html = fs.readFileSync(facadePath, 'utf8');
      if (entry.family === 'linux' && !hasResourceBoot(html)) {
        errors.push(`${entry.facade}: façade Linux sans capsule-resource / capsule-skin-boot`);
      }
    }
  }
  if (entry.skin) {
    const skinPath = path.join(ROOT, entry.skin);
    if (!fs.existsSync(skinPath)) {
      warnings.push(`Registre ${entry.id}: skin introuvable ${entry.skin}`);
    }
  }
});

PORTAL_HUBS.forEach((rel) => checkHtmlFile(rel, { portal: true }));

const VENDOR_ICON = {
  mint: 'mint.png',
  ubuntu: 'ubuntu.png',
  fedora: 'fedora.png',
  debian: 'debian.png',
  mx: 'mx.png',
  opensuse: 'opensuse.png',
  popos: 'popos.png',
  anduin: 'anduin.png',
  rocky: 'rocky.png',
  redhat: 'redhat.png',
  google: 'vanillaicecream.png',
  apple: 'sonoma.png',
};

const winIcon = (id) => {
  const ver = id.replace('windows-', '');
  const map = {
    95: 'win95',
    98: 'win98',
    me: 'winme',
    2000: 'win2000',
    xp: 'winxp',
    vista: 'vista',
    7: 'win7',
    8: 'win8',
    '8.1': 'win8',
    10: 'win10',
    11: 'win11',
  };
  return `${map[ver] || 'win11'}.png`;
};

const resolvePickIconFile = (entry) => {
  if (entry.assets?.pickIcon) {
    return path.join(ROOT, 'usr/share/capsuleos/assets', entry.assets.pickIcon);
  }
  if (entry.family === 'linux') {
    return path.join(PICK_OS_ICONS, 'linux', VENDOR_ICON[entry.vendor] || 'debian.png');
  }
  if (entry.family === 'windows') {
    return path.join(PICK_OS_ICONS, 'windows', winIcon(entry.id));
  }
  if (entry.family === 'macos') {
    return path.join(PICK_OS_ICONS, 'macos', 'sonoma.png');
  }
  if (entry.family === 'android') {
    return path.join(PICK_OS_ICONS, 'android', 'vanillaicecream.png');
  }
  if (entry.family === 'ios') {
    return path.join(PICK_OS_ICONS, 'ios', 'apple.svg');
  }
  return null;
};

const iconCheckEntries = active.length
  ? active
  : registry.entries.filter((e) => e.assets?.pickIcon);
iconCheckEntries.forEach((entry) => {
  const iconFile = resolvePickIconFile(entry);
  if (iconFile && !fs.existsSync(iconFile)) {
    errors.push(`pick-os icône manquante: ${path.relative(ROOT, iconFile)} (${entry.id})`);
  }
});

const linuxActive = active.filter((e) => e.family === 'linux');
const debianHub = path.join(ROOT, 'home/Debian/index.html');
if (fs.existsSync(debianHub)) {
  const hubHtml = fs.readFileSync(debianHub, 'utf8');
  const hubLinks = [...hubHtml.matchAll(/href=["']([^"']*index\.html)["']/g)].map((m) => m[1]);
  if (hubLinks.length < linuxActive.length) {
    warnings.push(`Hub Debian: ${hubLinks.length} liens vs ${linuxActive.length} Linux actifs`);
  }
}

const winActive = active.filter((e) => e.family === 'windows');
const winHub = path.join(ROOT, 'OS/windows/index.html');
if (fs.existsSync(winHub)) {
  const hubHtml = fs.readFileSync(winHub, 'utf8');
  const hubLinks = [...hubHtml.matchAll(/href=["'](\.\/versions\/[^"']+)["']/g)].map((m) => m[1]);
  if (hubLinks.length < winActive.length) {
    warnings.push(`Hub Windows: ${hubLinks.length} liens vs ${winActive.length} versions actives`);
  }
}

if (warnings.length) {
  console.warn('\nAvertissements:');
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
}

if (errors.length) {
  console.error(`\n✗ validate-link-integrity : ${errors.length} erreur(s)`);
  errors.slice(0, 40).forEach((e) => console.error(`  ✗ ${e}`));
  if (errors.length > 40) console.error(`  ... et ${errors.length - 40} autres`);
  process.exit(1);
}

console.log(
  `✓ validate-link-integrity OK — ${active.length} entrées actives, ${PORTAL_HUBS.length} hubs`,
);
