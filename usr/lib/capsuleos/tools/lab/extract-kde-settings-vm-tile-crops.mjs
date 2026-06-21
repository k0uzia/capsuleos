#!/usr/bin/env node
/**
 * Extrait tuiles preview KCM + logo about depuis captures VM (1060×808).
 *
 * Origines mesurées via calibrate-kde-settings-focus-offset.mjs / scan pixel VM↔Capsule.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/extract-kde-settings-vm-tile-crops.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
const VM_DIR = path.join(ROOT, 'root/docs/inventaires/captures/linux-kde-neon/apps-visual/themes');
const SCHEME_DIR = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/neon/systemsettings/scheme-previews');
const THEME_DIR = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/neon/systemsettings/theme-previews');
const ABOUT_DIR = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/neon/systemsettings/about');
const write = process.argv.includes('--write');

/** Gérés par source-previews/ + ingest-kde-neon-breeze-previews.py (¬crops VM). */
const PROTECTED_THEME_PREVIEWS = new Set([
  'hub-breeze-vm.png',
  'hub-dark-vm.png',
  'appearance-breeze-vm.png',
  'appearance-dark-vm.png',
]);

const readPng = (file) => PNG.sync.read(fs.readFileSync(file));

const cropWrite = (src, box, outPath) => {
  const out = new PNG({ width: box.width, height: box.height });
  PNG.bitblt(src, out, box.x, box.y, box.width, box.height, 0, 0);
  if (write) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, PNG.sync.write(out));
  }
  return { out: path.basename(outPath), box, outPath };
};

/** Grille uniforme — fallback si pas de boxes explicites. */
const kcmGridTiles = (originX, originY, colW = 216, rowH = 160, pad = 8, previewH = 120) => {
  const tiles = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      tiles.push({
        x: originX + col * colW + pad,
        y: originY + row * rowH + pad,
        width: colW - pad * 2,
        height: previewH,
      });
    }
  }
  return tiles;
};

const pullNamed = (src, names, boxes, destDir, sourceLabel) => {
  const pulled = [];
  names.forEach((out, i) => {
    const box = boxes[i];
    if (!box) return;
    const dest = path.join(destDir, out);
    cropWrite(src, box, dest);
    pulled.push({ out, box, source: sourceLabel });
    console.log(`  ${write ? '✓' : '→'} ${out} ${JSON.stringify(box)}`);
  });
  return pulled;
};

const main = () => {
  const colorsVm = readPng(path.join(VM_DIR, 'colors-panel-vm.png'));
  const appearanceVm = readPng(path.join(VM_DIR, 'appearance-panel-vm.png'));
  const hubVm = readPng(path.join(VM_DIR, 'hub-sidebar-vm.png'));
  const plasmaVm = readPng(path.join(VM_DIR, 'desktop-panel-vm.png'));
  const aboutVm = readPng(path.join(VM_DIR, 'about-panel-vm.png'));

  const tileW = 200;
  const appearanceH = 130;
  const schemeH = 120;

  const schemeNames = [
    'scheme-breeze-light-vm.png',
    'scheme-breeze-dark-vm.png',
    'scheme-breeze-classic-vm.png',
    'scheme-oxygen-vm.png',
    'scheme-oxygen-cold-vm.png',
    'scheme-oxygen-dark-vm.png',
  ];
  const schemeBoxes = kcmGridTiles(166, 259, 216, 160, 8, schemeH).slice(0, 6);
  const pulledSchemes = pullNamed(colorsVm, schemeNames, schemeBoxes, SCHEME_DIR, 'colors-panel-vm.png');

  const appearanceAll = [
    'appearance-breeze-vm.png',
    'appearance-twilight-vm.png',
    'appearance-dark-vm.png',
    'appearance-oxygen-vm.png',
  ];
  const appearanceOriginY = 228;
  const appearanceColW = 216;
  const appearanceEntries = appearanceAll
    .map((name, col) => ({
      name,
      box: {
        x: 163 + col * appearanceColW + 8,
        y: appearanceOriginY,
        width: tileW,
        height: appearanceH,
      },
    }))
    .filter((entry) => !PROTECTED_THEME_PREVIEWS.has(entry.name));
  const appearanceNames = appearanceEntries.map((e) => e.name);
  const appearanceBoxes = appearanceEntries.map((e) => e.box);
  const pulledAppearance = pullNamed(
    appearanceVm,
    appearanceNames,
    appearanceBoxes,
    THEME_DIR,
    'appearance-panel-vm.png',
  );

  const hubAll = ['hub-breeze-vm.png', 'hub-dark-vm.png', 'hub-auto-vm.png'];
  const hubNames = hubAll.filter((name) => !PROTECTED_THEME_PREVIEWS.has(name));
  const hubColW = 280;
  const hubPreviewH = 140;
  const hubPad = 10;
  const hubOrigin = { x: 200, y: 100 };
  const hubBoxes = hubAll
    .map((name, i) => ({ name, box: {
      x: hubOrigin.x + i * hubColW + hubPad,
      y: hubOrigin.y + hubPad,
      width: hubColW - hubPad * 2,
      height: hubPreviewH,
    } }))
    .filter((entry) => hubNames.includes(entry.name))
    .map((entry) => entry.box);
  const pulledHub = pullNamed(hubVm, hubNames, hubBoxes, THEME_DIR, 'hub-sidebar-vm.png');

  const plasmaNames = [
    'plasma-default-vm.png',
    'plasma-breeze-light-vm.png',
    'plasma-breeze-dark-vm.png',
    'plasma-oxygen-vm.png',
    'plasma-air-vm.png',
  ];
  const plasmaBoxes = kcmGridTiles(186, 318, 216, 160, 8, schemeH).slice(0, 5);
  const pulledPlasma = pullNamed(plasmaVm, plasmaNames, plasmaBoxes, SCHEME_DIR, 'desktop-panel-vm.png');

  const aboutLogoBox = { x: 468, y: 108, width: 96, height: 96 };
  const pulledAbout = pullNamed(
    aboutVm,
    ['about-distro-logo-vm.png'],
    [aboutLogoBox],
    ABOUT_DIR,
    'about-panel-vm.png',
  );

  if (write) {
    const note = [
      `Crops tuiles KCM VM — ${new Date().toISOString()}`,
      'Source : root/docs/inventaires/captures/linux-kde-neon/apps-visual/themes/*-vm.png',
      'Calibration : calibrate-kde-settings-focus-offset.mjs + scan per-tile',
      'Procédure : node usr/lib/capsuleos/tools/lab/extract-kde-settings-vm-tile-crops.mjs --write',
      '',
      'Schemes (colors-panel, origin 166×259):',
      ...pulledSchemes.map((p) => `- ${p.out} ← ${p.source} ${JSON.stringify(p.box)}`),
      '',
      'Appearance (appearance-panel, row y=228):',
      ...pulledAppearance.map((p) => `- ${p.out} ← ${p.source} ${JSON.stringify(p.box)}`),
      '',
      'Hub (hub-sidebar, origin 180×140):',
      ...pulledHub.map((p) => `- ${p.out} ← ${p.source} ${JSON.stringify(p.box)}`),
      ...(PROTECTED_THEME_PREVIEWS.size
        ? ['', 'Protégés (source-previews Capsule, ¬crops) :', ...[...PROTECTED_THEME_PREVIEWS].sort().map((n) => `- ${n}`)]
        : []),
      '',
      'Plasma (desktop-panel):',
      ...pulledPlasma.map((p) => `- ${p.out} ← ${p.source}`),
      '',
      'About logo:',
      ...pulledAbout.map((p) => `- ${p.out} ← ${p.source} ${JSON.stringify(p.box)}`),
    ].join('\n');
    fs.writeFileSync(path.join(path.dirname(SCHEME_DIR), 'SOURCE-VM-TILE-CROPS.txt'), `${note}\n`);
  }

  const total = schemeNames.length + appearanceNames.length + hubNames.length
    + plasmaNames.length + 1;
  console.log(`${write ? '✓' : '→'} extract-kde-settings-vm-tile-crops — ${total} assets`);
};

main();
