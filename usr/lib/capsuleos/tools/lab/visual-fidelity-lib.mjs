/**
 * Bibliothèque fidélité visuelle — typographie, vues, MIME, a11y.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';
import { loadAppsContract } from './apps-catalog-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/visual-fidelity.json');

export const MIME_PROBE_TYPES = [
  'inode/directory',
  'text/plain',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/x-shellscript',
  'x-scheme-handler/http',
  'x-scheme-handler/https',
  'audio/mpeg',
  'video/mp4',
  'application/zip',
];

export const KNOWN_GLOBS = [
  { glob: '*.pdf', mime: 'application/pdf' },
  { glob: '*.txt', mime: 'text/plain' },
  { glob: '*.jpg', mime: 'image/jpeg' },
  { glob: '*.jpeg', mime: 'image/jpeg' },
  { glob: '*.png', mime: 'image/png' },
  { glob: '*.sh', mime: 'application/x-shellscript' },
  { glob: '*.zip', mime: 'application/zip' },
  { glob: '*.mp3', mime: 'audio/mpeg' },
  { glob: '*.mp4', mime: 'video/mp4' },
];

export const loadVisualFidelityContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

export const visualFidelityPath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-visual-fidelity.json`);

export const deepAuditPath = (registryId) =>
  path.join(ROOT, 'root/docs/inventaires', `${registryId}-deep-audit.json`);

export const skinPathFromRegistry = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const skin = entry.referencePaths?.skin;
  if (!skin) throw new Error(`skin manquant: ${registryId}`);
  return path.join(ROOT, skin);
};

const desktopToVmId = (desktop) => {
  if (!desktop) return null;
  const base = desktop.replace(/\.desktop$/, '');
  return base === 'firefox' ? 'org.mozilla.Firefox' : base;
};

export const buildAppSlotMap = (registryId) => {
  const contract = loadAppsContract();
  const apps = contract.registryOverrides?.[registryId]?.apps || {};
  const map = { firefox: 'firefox', 'firefox.desktop': 'firefox' };
  for (const [vmId, spec] of Object.entries(apps)) {
    if (!spec.slot) continue;
    map[vmId] = spec.slot;
    map[`${vmId}.desktop`] = spec.slot;
  }
  return map;
};

const parseGioMimeHandler = (line) => {
  const m = (line || '').match(/:\s*([^\s]+\.desktop)/);
  return m ? m[1] : null;
};

export const collectMimeViaSsh = (registryId) => {
  const slotMap = buildAppSlotMap(registryId);
  const mimeList = MIME_PROBE_TYPES.map((m) => `"${m}"`).join(' ');
  const script = [
    'set -e',
    'gsettings get org.gnome.desktop.interface icon-theme',
    'echo "---handlers---"',
    `for m in ${mimeList}; do`,
    '  echo "$m|$(gio mime "$m" 2>/dev/null | head -1)"',
    'done',
  ].join('\n');
  const res = spawnSync(process.execPath, [
    path.join(__dirname, 'lab-ssh.mjs'),
    '--id', registryId,
    '--cmd', script,
  ], { cwd: ROOT, encoding: 'utf8', timeout: 90000 });
  if (res.status !== 0) {
    throw new Error(`SSH MIME échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  const lines = (res.stdout || '').split('\n');
  const iconTheme = (lines[0] || '').replace(/^'|'$/g, '').trim() || null;
  const defaultHandlers = [];
  let inHandlers = false;
  for (const line of lines) {
    if (line.trim() === '---handlers---') {
      inHandlers = true;
      continue;
    }
    if (!inHandlers || !line.includes('|')) continue;
    const [mime, raw] = line.split('|');
    const desktop = parseGioMimeHandler(raw);
    const vmId = desktopToVmId(desktop);
    defaultHandlers.push({
      mime: mime.trim(),
      app: vmId,
      desktop,
      capsuleSlot: desktop ? (slotMap[desktop] || slotMap[vmId] || null) : null,
      vmDefault: !!desktop,
    });
  }
  return {
    iconTheme,
    defaultHandlers,
    globsSample: KNOWN_GLOBS.map((g) => `${g.glob} → ${g.mime}`),
    collectedFrom: 'lab-ssh.mjs — gsettings icon-theme + gio mime',
    status: defaultHandlers.filter((h) => h.vmDefault).length >= 4 ? 'documented' : 'partial',
  };
};

export const collectA11yViaSsh = (registryId) => {
  const script = [
    'gsettings get org.gnome.desktop.interface text-scaling-factor',
    'gsettings get org.gnome.desktop.a11y.interface high-contrast',
    'gsettings get org.gnome.desktop.interface font-name',
  ].join('\n');
  const res = spawnSync(process.execPath, [
    path.join(__dirname, 'lab-ssh.mjs'),
    '--id', registryId,
    '--cmd', script,
  ], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
  if (res.status !== 0) {
    throw new Error(`SSH a11y échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  const lines = (res.stdout || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const clean = (v) => (v || '').replace(/^'|'$/g, '');
  return {
    vmGsettings: {
      'org.gnome.desktop.interface text-scaling-factor': clean(lines[0]),
      'org.gnome.desktop.a11y.interface high-contrast': clean(lines[1]),
      'org.gnome.desktop.interface font-name': clean(lines[2]),
    },
    collectedFrom: 'lab-ssh.mjs — gsettings a11y/interface',
  };
};

const TYPOGRAPHY_VENDOR_PROFILES = {
  ubuntu: {
    uiFamily: 'Ubuntu',
    monoFamily: 'Ubuntu Mono',
    capsuleDir: 'usr/share/capsuleos/assets/fonts/vendors/ubuntu',
    cssFile: 'home/Debian/Ubuntu/ubuntu-fonts.css',
  },
  rocky: {
    uiFamily: 'Red Hat Text',
    monoFamily: 'Red Hat Mono',
    capsuleDir: 'usr/share/capsuleos/assets/fonts/vendors/redhat',
    cssFile: 'home/RedHat/Rocky/rocky-fonts.css',
  },
  fedora: {
    uiFamily: 'Adwaita Sans',
    monoFamily: 'Adwaita Mono',
    capsuleDir: 'usr/share/capsuleos/assets/fonts/vendors/fedora',
    cssFile: 'home/RedHat/Fedora/fedora-fonts.css',
  },
  neon: {
    uiFamily: 'Noto Sans',
    monoFamily: 'Ubuntu Mono',
    capsuleDir: 'usr/share/capsuleos/assets/fonts/vendors/neon',
    cssFile: 'home/Debian/KDE-Neon/neon-fonts.css',
  },
  anduin: {
    uiFamily: 'Noto Sans',
    monoFamily: 'Cascadia Code',
    capsuleDir: 'usr/share/capsuleos/assets/fonts/vendors/anduin',
    cssFile: 'home/Debian/AnduinOS/anduin-fonts.css',
  },
  popos: {
    uiFamily: 'Open Sans',
    monoFamily: 'Ubuntu Mono',
    capsuleDir: 'usr/share/capsuleos/assets/fonts/vendors/popos',
    cssFile: 'home/Debian/PopOS/popos-overrides.css',
  },
  mint: {
    uiFamily: 'Ubuntu',
    monoFamily: 'Ubuntu Mono',
    capsuleDir: 'usr/share/capsuleos/assets/fonts/vendors/mint',
    cssFile: 'home/Debian/Mint/mint-fonts.css',
  },
};

export const collectTypographyFontsViaSsh = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const vendor = entry.vendor || registryId.replace(/^linux-/, '');
  const profile = TYPOGRAPHY_VENDOR_PROFILES[vendor] || TYPOGRAPHY_VENDOR_PROFILES.rocky;
  const script = [
    `fc-list "${profile.uiFamily}" -f "%{file}\\n" | head -1`,
    `fc-list "${profile.monoFamily}" -f "%{file}\\n" | head -1`,
  ].join('\n');
  const res = spawnSync(process.execPath, [
    path.join(__dirname, 'lab-ssh.mjs'),
    '--id', registryId,
    '--cmd', script,
  ], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
  if (res.status !== 0) {
    throw new Error(`SSH fonts échec: ${(res.stderr || res.stdout || '').trim()}`);
  }
  const lines = (res.stdout || '').split('\n').map((l) => l.trim()).filter(Boolean);
  return {
    vmPaths: {
      ui: lines[0] || null,
      mono: lines[1] || null,
    },
    capsuleDir: profile.capsuleDir,
    cssFile: profile.cssFile,
    collectedFrom: 'lab-ssh.mjs — fc-list',
  };
};

export const recomputePredicates = (inv) => {
  inv.predicates = inv.predicates || {};
  inv.predicates.Tp = inv.typography?.status === 'documented'
    && !!inv.typography?.capsule?.tokenFile
    && !!inv.typography?.vm?.fontName;
  inv.predicates.Tv = inv.viewContexts?.status === 'documented';
  inv.predicates.Tm = inv.mime?.status === 'documented'
    && !!inv.mime?.iconTheme
    && (inv.mime?.defaultHandlers || []).filter((h) => h.vmDefault).length >= 4;
  inv.predicates.Ta = inv.accessibility?.status === 'documented'
    && (inv.accessibility?.playbookControls || []).length > 0;
  inv.predicates.Tf = inv.predicates.Tp && inv.predicates.Tv && inv.predicates.Tm && inv.predicates.Ta;
  return inv;
};

export const buildVisualFidelityInventory = (registryId) => {
  const contract = loadVisualFidelityContract();
  const defaults = contract.registryDefaults?.[registryId] || {};
  const deep = fs.existsSync(deepAuditPath(registryId))
    ? JSON.parse(fs.readFileSync(deepAuditPath(registryId), 'utf8'))
    : null;
  const theme = deep?.phases?.static?.theme || {};

  const inv = {
    version: 1,
    registryId,
    updatedAt: new Date().toISOString(),
    procedure: 'convention-fidelite-visuelle.md',
    contract: 'etc/capsuleos/contracts/visual-fidelity.json',
    typography: {
      vm: {
        fontName: theme.fontName?.replace(/^'|'$/g, '') || null,
        documentFontName: theme.documentFontName?.replace(/^'|'$/g, '') || null,
        monospaceFontName: theme.monospaceFontName?.replace(/^'|'$/g, '') || null,
        gtkTheme: theme.gtkTheme?.replace(/^'|'$/g, '') || null,
        installedFamilies: (deep?.phases?.static?.fonts?.ui || []).map((f) => f.family),
        source: deep ? `${registryId}-deep-audit.json` : 'registryDefaults',
      },
      capsule: {
        tokenFile: defaults.typography?.tokenFile || null,
        uiStack: defaults.typography?.uiStack || [],
        monoStack: defaults.typography?.monoStack || [],
        uiSizePt: defaults.typography?.uiSizePt ?? null,
        monoSizePt: defaults.typography?.monoSizePt ?? null,
      },
      status: theme.fontName ? 'documented' : 'pending',
    },
    viewContexts: {
      viewportLab: defaults.viewContexts?.viewportLab || contract.viewContexts.labDefaults.viewport,
      playwright: defaults.viewContexts?.playwright || contract.viewContexts.labDefaults.playwright,
      displayScales: ['100', '125', '150', '200'],
      resolutions: ['1920x1080', '1680x1050', '1280x720'],
      orientations: ['landscape', 'portrait', 'landscape-reverse'],
      capsuleHooks: 'usr/share/capsuleos/themes/linux/gnome-shell-preferences.base.css',
      status: 'documented',
    },
    mime: {
      iconTheme: theme.iconTheme?.replace(/^'|'$/g, '') || defaults.mime?.iconTheme || null,
      defaultHandlers: [],
      globsSample: [],
      collectedFrom: null,
      status: 'pending',
    },
    accessibility: {
      vmGsettings: {},
      capsuleHooks: contract.accessibility.requiredHooks.reduce((acc, k) => {
        acc[k] = `html[data-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}]`;
        return acc;
      }, {}),
      cssImports: [],
      playbookControls: ['font-scale', 'contrast'],
      status: 'partial',
    },
    predicates: { Tp: false, Tv: false, Tm: false, Ta: false, Tf: false },
  };

  if (inv.typography.vm.fontName) inv.typography.status = 'documented';
  const a11yCss = defaults.accessibility?.cssImports || [
    'home/RedHat/Rocky/style/gnome-shell/a11y-fedora.css',
    'usr/share/capsuleos/themes/linux/gnome-shell-preferences.base.css',
  ];
  inv.accessibility.cssImports = a11yCss;
  inv.accessibility.playbookControls = ['font-scale', 'contrast', 'display-scale'];
  if (defaults.typography?.tokenFile) {
    inv.typography.capsule.tokenFile = defaults.typography.tokenFile;
  }
  if (registryId === 'linux-rocky' || registryId === 'linux-ubuntu' || registryId === 'linux-anduinos' || registryId === 'linux-mint') {
    inv.accessibility.status = 'documented';
  }

  return recomputePredicates(inv);
};

export const evaluateVisualFidelity = (registryId) => {
  const p = visualFidelityPath(registryId);
  if (!fs.existsSync(p)) {
    return { Tp: false, Tv: false, Tm: false, Ta: false, Tf: false, inventory: null };
  }
  const inv = JSON.parse(fs.readFileSync(p, 'utf8'));
  const preds = inv.predicates || {};
  return {
    Tp: !!preds.Tp,
    Tv: !!preds.Tv,
    Tm: !!preds.Tm,
    Ta: !!preds.Ta,
    Tf: !!preds.Tf,
    inventory: inv,
  };
};

const walkCss = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) walkCss(abs, files);
    else if (name.endsWith('.css')) files.push(abs);
  }
  return files;
};

export const scanTypographyViolations = (registryId) => {
  const contract = loadVisualFidelityContract();
  const entry = loadRegistryEntry(registryId);
  const skinDir = path.join(ROOT, path.dirname(entry.referencePaths.skin), 'style');
  const errors = [];
  const overridesName = contract.registryDefaults?.[registryId]?.typography?.tokenFile;

  if (overridesName) {
    const overridesPath = path.join(ROOT, overridesName);
    const text = fs.readFileSync(overridesPath, 'utf8');
    if (!text.includes('--font-ui')) errors.push(`${overridesName} : --font-ui manquant`);
    if (!text.includes('--font-mono')) errors.push(`${overridesName} : --font-mono manquant`);
  }

  const importsPath = path.join(ROOT, path.dirname(entry.referencePaths.skin), 'style/imports.css');
  if (fs.existsSync(importsPath)) {
    const imp = fs.readFileSync(importsPath, 'utf8');
    if (!imp.includes('a11y')) {
      errors.push('style/imports.css : feuille a11y non importée');
    }
  }

  for (const file of walkCss(skinDir)) {
    const rel = file.replace(`${ROOT}/`, '');
    const skip = contract.typography.allowedExceptions.some((ex) => rel.includes(ex));
    if (skip) continue;
    const content = fs.readFileSync(file, 'utf8');
    const hardCantarell = /font-family:\s*["']Cantarell["']/g;
    const hardInter = /font-family:[^;]*\bInter\b/g;
    if (hardCantarell.test(content)) {
      errors.push(`${rel} : Cantarell en dur — utiliser var(--font-ui)`);
    }
    if (hardInter.test(content)) {
      errors.push(`${rel} : Inter en dur interdit`);
    }
  }

  const prefs = path.join(ROOT, 'usr/share/capsuleos/themes/linux/gnome-shell-preferences.base.css');
  if (!fs.existsSync(prefs)) {
    errors.push('gnome-shell-preferences.base.css introuvable');
  } else {
    const t = fs.readFileSync(prefs, 'utf8');
    if (!t.includes('--a11y-font-scale-factor')) {
      errors.push('gnome-shell-preferences.base.css : --a11y-font-scale-factor absent');
    }
    if (!t.includes('data-display-scale')) {
      errors.push('gnome-shell-preferences.base.css : data-display-scale absent');
    }
  }

  const embedding = evaluateVisualFidelity(registryId).inventory?.typography?.fontEmbedding;
  if (embedding?.capsuleDir) {
    const vendor = registryId.replace(/^linux-/, '');
    const fontChecksByVendor = {
      ubuntu: ['Ubuntu-R.ttf', 'UbuntuMono-R.ttf'],
      fedora: ['AdwaitaSans-Regular.ttf', 'AdwaitaMono-BoldItalic.ttf'],
      rocky: ['RedHatText[wght].ttf', 'RedHatMono[wght].ttf'],
      'kde-neon': ['NotoSans-Bold.ttf', 'Ubuntu[wdth,wght].ttf'],
      anduinos: ['AdwaitaSans-Regular.ttf', 'Ubuntu[wdth,wght].ttf'],
      mint: ['Ubuntu[wdth,wght].ttf', 'UbuntuMono[wght].ttf'],
      popos: ['Ubuntu[wdth,wght].ttf', 'UbuntuMono-Italic[wght].ttf'],
    };
    const fontChecks = fontChecksByVendor[vendor] || ['RedHatText[wght].ttf', 'RedHatMono[wght].ttf'];
    for (const name of fontChecks) {
      const local = path.join(ROOT, embedding.capsuleDir, name);
      if (!fs.existsSync(local)) {
        errors.push(`${embedding.capsuleDir}/${name} absent — import manifeste ou pull-vm-assets`);
      }
    }
    const cssFile = embedding.cssFile;
    if (cssFile && !fs.existsSync(path.join(ROOT, cssFile))) {
      errors.push(`${cssFile} absent (@font-face)`);
    }
  }

  return errors;
};
