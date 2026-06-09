/**
 * Résolution centralisée vendor → slug dossier + icônes pick-os / logo À propos.
 * Slug = nom du répertoire sous usr/share/capsuleos/assets/images/vendors/.
 *
 * Alias registryId / vendor → slug (commentaire minimal — source de vérité : champ vendor du registre).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../..');
export const ASSETS_ROOT = path.join(ROOT, 'usr/share/capsuleos/assets');
export const VENDORS_ROOT = path.join(ASSETS_ROOT, 'images/vendors');
export const PICK_OS_ROOT = path.join(ASSETS_ROOT, 'images/platforms/pick-os');

/** vendor ou suffixe registryId → slug dossier vendors/ existant ou attendu */
export const VENDOR_SLUG_ALIASES = {
  anduinos: 'anduin',
  'linux-anduinos': 'anduin',
  linuxmint: 'mint',
  'linux-mint': 'mint',
  'mx-kde': 'mx',
  'linux-mx-kde': 'mx',
  'kde-neon': 'neon',
  'linux-kde-neon': 'neon',
  pop_os: 'popos',
  'linux-popos': 'popos',
  rhel: 'rocky',
  almalinux: 'alma',
  'linux-alma': 'alma',
  'linux-rocky': 'rocky',
  redhat: 'fedora',
  generic: 'debian',
  lineage: 'debian',
  manjaro: 'debian',
  zorin: 'debian',
  kali: 'debian',
  valve: 'debian',
  nixos: 'debian',
  slackware: 'debian',
  gentoo: 'debian',
  alpine: 'debian',
  arch: 'arch',
  elementary: 'elementary',
  freebsd: 'debian',
  openbsd: 'debian',
  netbsd: 'debian',
  ghostbsd: 'debian',
  haiku: 'debian',
  reactos: 'debian',
  qnx: 'debian',
  windriver: 'debian',
  minix: 'debian',
  huawei: 'debian',
  oracle: 'debian',
};

const WIN_PICK = {
  'windows-95': 'win95.png',
  'windows-98': 'win98.png',
  'windows-me': 'winme.png',
  'windows-2000': 'win2000.png',
  'windows-xp': 'winxp.png',
  'windows-vista': 'vista.png',
  'windows-7': 'win7.png',
  'windows-8': 'win8.png',
  'windows-8.1': 'win8.png',
  'windows-10': 'win10.png',
  'windows-11': 'win11.png',
};

const LOGO_CANDIDATES = [
  '{slug}-logo.svg',
  '{slug}-logo.png',
  'logo.svg',
  'logo.png',
  '{slug}.svg',
  '{slug}.png',
  'favicon.svg',
  'pop-logo.png',
  'mint-logo.svg',
  'fedora-logo.svg',
  'ubuntu-logo.svg',
  'rocky-logo.svg',
  'opensuse-logo.svg',
  'anduin-logo.svg',
  'mx-logo.png',
];

const vendorDirExists = (slug) => {
  if (!slug) return false;
  return fs.existsSync(path.join(VENDORS_ROOT, slug));
};

/**
 * @param {{ id?: string, vendor?: string }} entry
 * @returns {string}
 */
export const resolveVendorSlug = (entry) => {
  const id = entry.id || '';
  const vendor = entry.vendor || '';
  const candidates = [
    vendor,
    VENDOR_SLUG_ALIASES[vendor],
    id.replace(/^(linux|windows|macos|android|ios)-/, ''),
    VENDOR_SLUG_ALIASES[id],
  ].filter(Boolean);

  for (let i = 0; i < candidates.length; i += 1) {
    const slug = candidates[i];
    if (vendorDirExists(slug)) {
      return slug;
    }
  }
  for (let i = 0; i < candidates.length; i += 1) {
    const alias = VENDOR_SLUG_ALIASES[candidates[i]];
    if (alias && vendorDirExists(alias)) {
      return alias;
    }
  }
  if (vendor) return vendor;
  const fromId = id.replace(/^(linux|windows|macos|android|ios)-/, '');
  return fromId || 'debian';
};

const pickOsPlatformPath = (entry, slug) => {
  if (entry.family === 'windows' && WIN_PICK[entry.id]) {
    return path.join(PICK_OS_ROOT, 'windows', WIN_PICK[entry.id]);
  }
  if (entry.family === 'macos') {
    return path.join(PICK_OS_ROOT, 'macos', 'sonoma.png');
  }
  if (entry.family === 'android') {
    return path.join(PICK_OS_ROOT, 'android', 'vanillaicecream.png');
  }
  if (entry.family === 'ios') {
    const iosApple = path.join(PICK_OS_ROOT, 'ios', 'apple.svg');
    if (fs.existsSync(iosApple)) return iosApple;
    return path.join(PICK_OS_ROOT, 'macos', 'sonoma.png');
  }
  if (entry.family === 'linux' || !entry.family) {
    const platformIcon = path.join(PICK_OS_ROOT, 'linux', `${slug}.png`);
    if (fs.existsSync(platformIcon)) {
      return platformIcon;
    }
  }
  return null;
};

const scanVendorLogo = (slug, preferRaster) => {
  const dir = path.join(VENDORS_ROOT, slug);
  if (!fs.existsSync(dir)) return null;
  const names = [];
  LOGO_CANDIDATES.forEach((pattern) => {
    names.push(pattern.replace(/\{slug\}/g, slug));
  });
  const files = fs.readdirSync(dir);
  const ordered = [];
  names.forEach((name) => {
    if (files.includes(name)) ordered.push(name);
  });
  files.forEach((name) => {
    if (/logo\.(svg|png|webp)$/i.test(name) && !ordered.includes(name)) {
      ordered.push(name);
    }
  });
  if (!ordered.length) return null;
  if (preferRaster) {
    const raster = ordered.find((n) => /\.(png|webp|jpg|jpeg)$/i.test(n));
    if (raster) return raster;
  }
  return ordered[0];
};

/**
 * Chemin relatif sous usr/share/capsuleos/assets/ (sans préfixe ./).
 * @param {{ id?: string, vendor?: string, family?: string }} entry
 * @param {{ preferRaster?: boolean }} [opts]
 */
export const resolvePickIconAsset = (entry, opts) => {
  const preferRaster = opts && opts.preferRaster !== false;
  const slug = resolveVendorSlug(entry);
  const platform = pickOsPlatformPath(entry, slug);
  if (platform && fs.existsSync(platform)) {
    return path.relative(ASSETS_ROOT, platform).split(path.sep).join('/');
  }
  const vendorFile = scanVendorLogo(slug, preferRaster);
  if (vendorFile) {
    return `images/vendors/${slug}/${vendorFile}`;
  }
  if (entry.family === 'windows' && WIN_PICK[entry.id]) {
    return `images/platforms/pick-os/windows/${WIN_PICK[entry.id]}`;
  }
  if (entry.family === 'macos') {
    return 'images/platforms/pick-os/macos/sonoma.png';
  }
  if (entry.family === 'android') {
    return 'images/platforms/pick-os/android/vanillaicecream.png';
  }
  return 'images/platforms/pick-os/linux/debian.png';
};

/**
 * Chemin logique skin : ./assets/images/vendors/<slug>/<fichier>
 * @param {{ id?: string, vendor?: string }} entry
 */
export const resolveAboutLogoLogical = (entry) => {
  const slug = resolveVendorSlug(entry);
  const vendorFile = scanVendorLogo(slug, false);
  if (!vendorFile) {
    return null;
  }
  return `./assets/images/vendors/${slug}/${vendorFile}`;
};

/**
 * Chemin absolu du fichier logo À propos.
 */
export const resolveAboutLogoFile = (entry) => {
  const logical = resolveAboutLogoLogical(entry);
  if (!logical) return null;
  const rel = logical.replace(/^\.\/assets\//, '');
  return path.join(ASSETS_ROOT, rel);
};

/**
 * Chemin absolu du fichier icône pick-os.
 */
export const resolvePickIconFile = (entry) => {
  const rel = resolvePickIconAsset(entry);
  return path.join(ASSETS_ROOT, rel);
};

/**
 * URL portail pick-os (depuis index.html).
 */
export const resolvePickIconPortalUrl = (entry) => {
  return `./usr/share/capsuleos/assets/${resolvePickIconAsset(entry)}`;
};
