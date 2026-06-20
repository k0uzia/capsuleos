#!/usr/bin/env node
/**
 * Extrait les tuiles preview KCM depuis captures VM (crop focus, pas plein écran).
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
const write = process.argv.includes('--write');

const readPng = (file) => PNG.sync.read(fs.readFileSync(file));

const cropWrite = (src, box, outPath) => {
  const out = new PNG({ width: box.width, height: box.height });
  PNG.bitblt(src, out, box.x, box.y, box.width, box.height, 0, 0);
  if (write) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, PNG.sync.write(out));
  }
  return outPath;
};

/** Grille 4×2 KCM — origin mesurée sur colors-panel-vm (1060×808). */
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

const main = () => {
  const colorsVm = readPng(path.join(VM_DIR, 'colors-panel-vm.png'));
  const appearanceVm = readPng(path.join(VM_DIR, 'appearance-panel-vm.png'));
  const hubVm = readPng(path.join(VM_DIR, 'hub-sidebar-vm.png'));
  const plasmaVm = readPng(path.join(VM_DIR, 'desktop-panel-vm.png'));

  const schemeNames = [
    'scheme-breeze-light-vm.png',
    'scheme-breeze-dark-vm.png',
    'scheme-breeze-classic-vm.png',
    'scheme-oxygen-vm.png',
    'scheme-oxygen-cold-vm.png',
    'scheme-oxygen-dark-vm.png',
  ];
  const schemeTiles = kcmGridTiles(186, 290);
  const pulledSchemes = [];
  schemeNames.forEach((out, i) => {
    const dest = path.join(SCHEME_DIR, out);
    cropWrite(colorsVm, schemeTiles[i], dest);
    pulledSchemes.push({ out, box: schemeTiles[i], source: 'colors-panel-vm.png' });
    console.log(`  ${write ? '✓' : '→'} ${out} crop ${JSON.stringify(schemeTiles[i])}`);
  });

  const appearanceNames = [
    'appearance-breeze-vm.png',
    'appearance-twilight-vm.png',
    'appearance-dark-vm.png',
    'appearance-oxygen-vm.png',
  ];
  const appearanceTiles = kcmGridTiles(186, 148, 216, 160, 8, 130).slice(0, 4);
  const pulledAppearance = [];
  appearanceNames.forEach((out, i) => {
    const dest = path.join(THEME_DIR, out);
    cropWrite(appearanceVm, appearanceTiles[i], dest);
    pulledAppearance.push({ out, box: appearanceTiles[i], source: 'appearance-panel-vm.png' });
    console.log(`  ${write ? '✓' : '→'} ${out}`);
  });

  const hubNames = ['hub-breeze-vm.png', 'hub-dark-vm.png', 'hub-auto-vm.png'];
  const hubOrigin = { x: 200, y: 100, colW: 280, previewH: 140, pad: 10 };
  const pulledHub = [];
  hubNames.forEach((out, i) => {
    const box = {
      x: hubOrigin.x + i * hubOrigin.colW + hubOrigin.pad,
      y: hubOrigin.y + hubOrigin.pad,
      width: hubOrigin.colW - hubOrigin.pad * 2,
      height: hubOrigin.previewH,
    };
    const dest = path.join(THEME_DIR, out);
    cropWrite(hubVm, box, dest);
    pulledHub.push({ out, box, source: 'hub-sidebar-vm.png' });
    console.log(`  ${write ? '✓' : '→'} ${out}`);
  });

  const plasmaNames = [
    'plasma-default-vm.png',
    'plasma-breeze-light-vm.png',
    'plasma-breeze-dark-vm.png',
    'plasma-oxygen-vm.png',
    'plasma-air-vm.png',
  ];
  const plasmaTiles = kcmGridTiles(186, 318, 216, 160, 8, 120).slice(0, 5);
  const pulledPlasma = [];
  plasmaNames.forEach((out, i) => {
    if (!plasmaTiles[i]) return;
    const dest = path.join(SCHEME_DIR, out);
    cropWrite(plasmaVm, plasmaTiles[i], dest);
    pulledPlasma.push({ out, box: plasmaTiles[i], source: 'desktop-panel-vm.png' });
    console.log(`  ${write ? '✓' : '→'} ${out}`);
  });

  if (write) {
    const note = [
      `Crops tuiles KCM VM — ${new Date().toISOString()}`,
      'Source : root/docs/inventaires/captures/linux-kde-neon/apps-visual/themes/*-vm.png',
      'Procédure : node usr/lib/capsuleos/tools/lab/extract-kde-settings-vm-tile-crops.mjs --write',
      '',
      'Schemes (colors-panel):',
      ...pulledSchemes.map((p) => `- ${p.out} ← ${p.source} ${JSON.stringify(p.box)}`),
      '',
      'Appearance (appearance-panel):',
      ...pulledAppearance.map((p) => `- ${p.out} ← ${p.source}`),
      '',
      'Hub (hub-sidebar):',
      ...pulledHub.map((p) => `- ${p.out} ← ${p.source}`),
      '',
      'Plasma (desktop-panel):',
      ...pulledPlasma.map((p) => `- ${p.out} ← ${p.source}`),
    ].join('\n');
    fs.writeFileSync(path.join(path.dirname(SCHEME_DIR), 'SOURCE-VM-TILE-CROPS.txt'), `${note}\n`);
  }

  console.log(`${write ? '✓' : '→'} extract-kde-settings-vm-tile-crops — ${schemeNames.length + appearanceNames.length + hubNames.length + plasmaNames.length} tuiles`);
};

main();
