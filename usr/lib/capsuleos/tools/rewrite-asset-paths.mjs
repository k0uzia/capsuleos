#!/usr/bin/env node
/**
 * Réécrit les chemins ./media/img/ → ./assets/ dans html, css, js, json.
 * Usage : node usr/lib/capsuleos/tools/rewrite-asset-paths.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');

const SKIP_DIRS = new Set(['node_modules', '.git', 'var/lib/capsuleos/generated']);

const TOOLKIT_BY_PATH = [
  [/mx-kde|opensuse|debian-kde/i, 'kde'],
  [/[/\\]mint[/\\]|families[/\\]debian[/\\]mint/i, 'cinnamon'],
  [/popos|cosmic/i, 'cosmic'],
  [/ubuntu|fedora|anduinos|gnome/i, 'gnome'],
  [/bsd|ghost/i, 'bsd-ghost'],
  [/android/i, 'android-material'],
  [/ios[/\\]15/i, 'ios'],
  [/macos|sonoma/i, 'macos-aqua'],
  [/windows/i, 'windows'],
];

const vendorFromPath = (fp) => {
  if (/mint/i.test(fp)) return 'mint';
  if (/ubuntu/i.test(fp)) return 'ubuntu';
  if (/fedora/i.test(fp)) return 'fedora';
  if (/mx-kde|mxkde/i.test(fp)) return 'mx';
  if (/opensuse/i.test(fp)) return 'opensuse';
  if (/debian-kde|debiankde/i.test(fp)) return 'debian';
  if (/popos/i.test(fp)) return 'popos';
  if (/anduinos/i.test(fp)) return 'anduin';
  return 'common';
};

const toolkitFromPath = (fp) => {
  for (const [re, tk] of TOOLKIT_BY_PATH) {
    if (re.test(fp)) return tk;
  }
  return 'cinnamon';
};

const windowsVersionFromPath = (fp) => {
  const m = fp.match(/versions[/\\]([^/\\]+)/i);
  if (m) return m[1].toLowerCase();
  if (/windows[/\\]11[/\\]/i.test(fp)) return '11';
  return null;
};

const depthToAssets = (filePath) => {
  const rel = path.relative(ROOT, filePath);
  const parts = rel.split(path.sep);
  const depth = parts.length - 1;
  return '../'.repeat(depth) + 'usr/share/capsuleos/assets';
};

const rewriteContent = (text, filePath) => {
  const tk = toolkitFromPath(filePath);
  const vendor = vendorFromPath(filePath);
  const winVer = windowsVersionFromPath(filePath);
  const isWindowsSkin = Boolean(winVer) || /OS[/\\]windows[/\\]/i.test(filePath);
  const winTk = winVer ? `windows/${winVer}` : 'windows';
  const assetsRel = depthToAssets(filePath);
  let out = text;

  const rules = [
    // CSS sélecteurs attribut (Dolphin)
    [/\/media\/img\/elements\/kde\//g, '/assets/icons/kde/elements/'],
    [/\/media\/img\/elements\/places32\//g, '/assets/icons/kde/places32/'],
    [/\/media\/img\/elements\/nemo\//g, tk === 'kde' ? '/assets/icons/kde/nemo/' : '/assets/icons/cinnamon/nemo/'],
    [/\/media\/img\/mimeTypes\//g, '/assets/icons/kde/mimeTypes/'],

    // Références croisées skins / shared
    [/(?:\.\.\/)+SUSE\/openSUSE\/media\/img\/elements\/places32/gi, './assets/icons/kde/places32'],
    [/(?:\.\.\/)+suse\/opensuse\/media\/img\/elements\/places32/gi, './assets/icons/kde/places32'],
    [/(?:\.\.\/)+shared\/media\/img\/apps\//g, './assets/images/toolkits/gnome/apps/'],
    [/(?:\.\.\/)+shared\/media\/img\//g, './assets/images/toolkits/windows/shared/'],
    [/(?:\.\.\/)+ubuntu\/media\/img\/apps\//g, './assets/images/toolkits/gnome/apps/'],

    // Android / iOS
    [/\.\/assets\/icones\//g, './assets/images/toolkits/android-material/icones/'],
    [/\.\/assets\/images\/android_background/g, './assets/images/toolkits/android-material/images/android_background'],
    [/(?:\.\/|\.\.\/)?assets\/icones\//g, './assets/images/toolkits/android-material/icones/'],
    [/(?:\.\/|\.\.\/)?assets\/images\/(android_background)/g, './assets/images/toolkits/android-material/images/$1'],

    // Sous-dossiers media/img (skins Linux / Windows)
    [/\.\/media\/img\/elements\/kde\//g, './assets/icons/kde/elements/'],
    [/\.\/media\/img\/elements\/places32\//g, './assets/icons/kde/places32/'],
    [
      /\.\/media\/img\/elements\/nemo\//g,
      tk === 'kde' ? './assets/icons/kde/nemo/' : './assets/icons/cinnamon/nemo/',
    ],
    [/\.\/media\/img\/mimeTypes\//g, './assets/icons/kde/mimeTypes/'],
    [/\.\/media\/img\/actions\//g, './assets/images/toolkits/gnome/symbolic/'],
    [/\.\/media\/img\/apps\//g, `./assets/images/toolkits/${tk}/apps/`],
    [/\.\/media\/img\/panel\//g, './assets/images/toolkits/kde/panel/'],
    [/\.\/media\/img\/menu-rail\//g, './assets/images/toolkits/kde/menu-rail/'],
    [/\.\/media\/img\/menu\//g, `./assets/images/toolkits/${tk === 'kde' ? 'kde' : tk}/menu/`],
    [/\.\/media\/img\/dock\//g, './assets/images/toolkits/gnome/dock/'],
    [/\.\/media\/img\/symbolic\//g, './assets/images/toolkits/gnome/symbolic/'],
    [/\.\/media\/img\/category\//g, `./assets/images/toolkits/${tk}/category/`],
    [/\.\/media\/img\/header\//g, `./assets/images/toolkits/${tk}/header/`],
    [/\.\/media\/img\/taskbar\//g, './assets/images/vendors/anduin/taskbar/'],
    [/\.\/media\/img\/assets\//g, `./assets/images/vendors/${vendor}/`],

    // ${base}/media/img/header (capsule-window)
    [
      /\$\{base\}\/media\/img\/header\//g,
      `\${base}/assets/images/toolkits/${tk === 'kde' ? 'kde' : tk}/header/`,
    ],

    // Branding legacy
    [/usr\/share\/capsuleos\/branding\/icons\//g, './assets/images/platforms/pick-os/'],
    [/usr\/share\/capsuleos\/branding\/brands\//g, './assets/images/platforms/brands/'],
    [/usr\/share\/capsuleos\/branding\/accueil\.svg/g, './assets/images/common/accueil.svg'],
    [/usr\/share\/capsuleos\/branding\/capsule\.webp/g, './assets/images/common/capsule.webp'],
    [/usr\/share\/capsuleos\/linux\/media\/img\//g, './assets/images/toolkits/gnome/apps/'],
    [/usr\/share\/capsuleos\/icons\/linux\//g, './assets/images/platforms/pick-os/'],

    // Chemins relatifs profonds vers assets noyau
    [/\.\.\/media\/img\/header\//g, `${assetsRel}/images/toolkits/${tk}/header/`],
    [/\.\.\/media\/img\//g, `${assetsRel}/images/toolkits/${tk}/`],

    // Catch-all ./media/img/ (après règles spécifiques)
    [
      /\.\/media\/img\//g,
      isWindowsSkin
        ? `./assets/images/toolkits/${winTk}/`
        : `./assets/images/toolkits/${tk}/`,
    ],

    // Dossiers skin legacy home|OS/.../assets/ (fichiers isolés)
    [/assets\/images\/toolkits\/gnome\/apps\/apps\//g, './assets/images/toolkits/gnome/apps/'],
    [/\.\/assets\/mint\.webp/g, './assets/images/vendors/mint/mint.webp'],
    [/\.\/assets\/debian-logo-at\.svg/g, './assets/images/vendors/debian/debian-logo-at.svg'],
    [/\.\/assets\/debian-logo\.svg/g, './assets/images/vendors/debian/debian-logo.svg'],
    [/\.\/assets\/favicon\.svg/g, './assets/images/vendors/fedora/favicon.svg'],
    [
      /\.\.\/\.\.\/\.\.\/shared\/content\/Dossier_personnel\/Images\/lunaire-bureau\.png/g,
      '../../../home/public/Images/lunaire-bureau.png',
    ],
    [
      /shared\/content\/Dossier_personnel\/Images\/lunaire-bureau\.png/g,
      'home/public/Images/lunaire-bureau.png',
    ],
  ];

  for (const [re, rep] of rules) {
    if (rep === null) continue;
    out = out.replace(re, rep);
  }
  return out;
};

const walk = (dir, changed) => {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    let st;
    try {
      st = fs.lstatSync(full);
    } catch {
      continue;
    }
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) {
      walk(full, changed);
      continue;
    }
    if (!/\.(html|css|js|json|md|mjs)$/i.test(name)) continue;
    if (full.includes('migrate-to-assets') || full.includes('rewrite-asset-paths')) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (
      !text.includes('media/img') &&
      !text.includes('branding/icons') &&
      !text.includes('branding/brands') &&
      !text.includes('branding/accueil') &&
      !text.includes('branding/capsule') &&
      !text.includes('icons/linux') &&
      !/assets\/icones/.test(text) &&
      !/\.\/assets\/(mint\.webp|debian-logo|favicon\.svg)/.test(text) &&
      !/Dossier_personnel\/Images\/lunaire-bureau/.test(text)
    ) {
      continue;
    }
    const next = rewriteContent(text, full);
    if (next !== text) {
      changed.push(path.relative(ROOT, full));
      if (!DRY) fs.writeFileSync(full, next, 'utf8');
    }
  }
};

const changed = [];
walk(ROOT, changed);
console.log(`${DRY ? '[dry-run] ' : ''}${changed.length} fichiers réécrits`);
if (changed.length <= 40) {
  changed.forEach((f) => console.log(' ', f));
} else {
  changed.slice(0, 20).forEach((f) => console.log(' ', f));
  console.log(`  ... et ${changed.length - 20} autres`);
}
