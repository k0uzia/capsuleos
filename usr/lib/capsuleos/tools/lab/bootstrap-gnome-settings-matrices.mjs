#!/usr/bin/env node
/**
 * Bootstrap matrices Paramètres GNOME locales (R-LOC1) — sans emprunt cross-vendor.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/bootstrap-gnome-settings-matrices.mjs --id linux-ubuntu --write
 *   node usr/lib/capsuleos/tools/lab/bootstrap-gnome-settings-matrices.mjs --id linux-ubuntu --kind assets --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT, loadRegistryEntry, vendorFromRegistry } from './replication-chain-lib.mjs';
import { loadRecipeProfile } from './lab-recipe-resolver.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAB = path.join(ROOT, 'root/tools/lab');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false, kind: 'all' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--kind' && args[i + 1]) opts.kind = args[++i];
  }
  return opts;
};

const toCapsulePath = (capsuleRelative) => {
  const rel = capsuleRelative.replace(/^images\/vendors\//, '');
  return `usr/share/capsuleos/assets/images/vendors/${rel}`;
};

const buildAssetsFromProc = (registryId, vendor) => {
  const procPath = path.join(ROOT, 'proc', registryId, `${vendor}-manifest-playbook.json`);
  const altPath = path.join(ROOT, 'proc', registryId, 'ubuntu-manifest-playbook.json');
  const manifestPath = fs.existsSync(procPath) ? procPath : altPath;
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifeste proc absent: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const wallpapers = (manifest.items || manifest.assets || []).filter(
    (it) => it.category === 'wallpaper' && it.vmPath,
  );

  const assets = wallpapers.map((it) => {
    const base = path.basename(it.vmPath);
    const id = it.id || `wallpaper-${base.replace(/\.[^.]+$/, '')}`;
    const capsuleRel = it.capsuleRelative || `images/vendors/${vendor}/wallpaper/${base}`;
    return {
      id,
      category: 'wallpaper',
      controlId: 'wallpaper',
      label: base,
      vmPath: it.vmPath,
      capsulePath: toCapsulePath(capsuleRel),
      transcodeFromVm: /\.(jxl|png|jpg|jpeg|webp)$/i.test(it.vmPath),
    };
  });

  return {
    version: 1,
    description: `Assets ground truth Paramètres GNOME — ${registryId} (bootstrap proc).`,
    registry: registryId,
    vendor,
    pullScript: 'root/tools/lab/pull-vm-assets.sh',
    sourceTraceFile: `usr/share/capsuleos/assets/images/vendors/${vendor}/SOURCE-VM.txt`,
    gsettingsSources: [
      {
        id: 'desktop-background-uri',
        schema: 'org.gnome.desktop.background',
        key: 'picture-uri',
        note: 'Fond actif jour — adwaita-l.jxl ou catalogue Ubuntu',
      },
      {
        id: 'desktop-background-uri-dark',
        schema: 'org.gnome.desktop.background',
        key: 'picture-uri-dark',
        note: 'Fond variante nuit — adwaita-d.jxl',
      },
    ],
    assets: [
      {
        id: 'wallpaper-adwaita-light',
        category: 'wallpaper',
        controlId: 'wallpaper',
        label: 'Adwaita (jour)',
        vmPath: '/usr/share/backgrounds/gnome/adwaita-l.jxl',
        capsulePath: `usr/share/capsuleos/assets/images/vendors/${vendor}/wallpaper/wallpaper-adwaita-light.webp`,
        transcodeFromVm: true,
        note: 'Défaut GNOME Ubuntu 25.10',
      },
      {
        id: 'wallpaper-adwaita-dark',
        category: 'wallpaper',
        controlId: 'wallpaper',
        label: 'Adwaita (nuit)',
        vmPath: '/usr/share/backgrounds/gnome/adwaita-d.jxl',
        capsulePath: `usr/share/capsuleos/assets/images/vendors/${vendor}/wallpaper/wallpaper-adwaita-dark.webp`,
        transcodeFromVm: true,
      },
      ...assets.filter((a) => !a.vmPath.includes('adwaita')),
    ],
  };
};

const buildParityFromToolkit = (registryId, vendor) => {
  const templatePath = path.join(LAB, 'gnome-settings-parity-matrix-fedora.json');
  const fallback = path.join(LAB, 'gnome-settings-parity-matrix-rocky.json');
  const src = fs.existsSync(templatePath) ? templatePath : fallback;
  if (!fs.existsSync(src)) throw new Error('Template parity GNOME absent (fedora/rocky)');
  const template = JSON.parse(fs.readFileSync(src, 'utf8'));
  return {
    ...template,
    version: template.version || 1,
    description: `Matrice panneaux gnome-control-center ↔ CapsuleOS — ${registryId} (bootstrap toolkit GNOME).`,
    registry: registryId,
    vendor,
  };
};

const skinBaseFromRegistry = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const skin = entry.referencePaths?.skin || entry.skin || '';
  if (!skin) return null;
  return path.dirname(skin.replace(/^\//, ''));
};

const rewriteVisualSkinPaths = (payload, registryId, templateRegistry) => {
  const skinBase = skinBaseFromRegistry(registryId);
  if (!skinBase || !templateRegistry) return payload;
  const templateSkin = skinBaseFromRegistry(templateRegistry);
  if (!templateSkin || skinBase === templateSkin) return payload;
  const raw = JSON.stringify(payload).split(templateSkin).join(skinBase);
  return JSON.parse(raw);
};

const buildVisualFromVendor = (registryId, vendor) => {
  const fedora = path.join(LAB, 'gnome-settings-visual-investigation-matrix-fedora.json');
  const rocky = path.join(LAB, 'gnome-settings-visual-investigation-matrix-rocky.json');
  const templatePath = fs.existsSync(fedora) ? fedora : rocky;
  if (!fs.existsSync(templatePath)) {
    return {
      version: 1,
      description: `Matrice enquête visuelle — ${registryId}`,
      registry: registryId,
      vendor,
      investigations: [],
    };
  }
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  const templateRegistry = template.registry || 'linux-fedora';
  const base = {
    ...template,
    registry: registryId,
    vendor,
    description: `Matrice enquête visuelle — ${registryId} (bootstrap toolkit GNOME)`,
  };
  return rewriteVisualSkinPaths(base, registryId, templateRegistry);
};

const matrixFilename = (kind, vendor) => ({
  assets: `gnome-settings-assets-matrix-${vendor}.json`,
  parity: `gnome-settings-parity-matrix-${vendor}.json`,
  visual: `gnome-settings-visual-investigation-matrix-${vendor}.json`,
}[kind]);

const writeMatrix = (registryId, kind, payload, write) => {
  const vendor = vendorFromRegistry(registryId);
  const outPath = path.join(LAB, matrixFilename(kind, vendor));
  const rel = path.relative(ROOT, outPath);
  if (!write) {
    process.stdout.write(`[dry-run] ${rel} (${payload.assets?.length || payload.panels?.length || 0} entrées)\n`);
    return rel;
  }
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  process.stdout.write(`✓ ${rel}\n`);
  return rel;
};

const main = () => {
  const opts = parseArgs();
  const profile = loadRecipeProfile(opts.id);
  const vendor = profile.vendor;
  const kinds = opts.kind === 'all' ? ['assets', 'parity', 'visual'] : [opts.kind];

  process.stdout.write(`=== bootstrap-gnome-settings-matrices ${opts.id} [${kinds.join(',')}] ===\n`);

  for (const kind of kinds) {
    let payload;
    if (kind === 'assets') payload = buildAssetsFromProc(opts.id, vendor);
    else if (kind === 'parity') payload = buildParityFromToolkit(opts.id, vendor);
    else if (kind === 'visual') payload = buildVisualFromVendor(opts.id, vendor);
    else throw new Error(`kind inconnu: ${kind}`);
    writeMatrix(opts.id, kind, payload, opts.write);
  }

  if (!opts.write) {
    process.stdout.write('Ajouter --write pour écrire les fichiers.\n');
  }
};

main();
