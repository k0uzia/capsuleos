/**
 * Génère un aperçu PNG style KCM Couleurs à partir d'un fichier .colors KDE.
 */
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const DEFAULT_SIZE = { width: 200, height: 120 };

const parseColorsFile = (text) => {
  const sections = {};
  let current = null;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      current = sectionMatch[1];
      sections[current] = sections[current] || {};
      continue;
    }
    const kv = trimmed.match(/^([^=]+)=(.+)$/);
    if (kv && current) {
      sections[current][kv[1]] = kv[2];
    }
  }
  return sections;
};

const rgb = (value, fallback = [239, 240, 241]) => {
  if (!value) return fallback;
  const parts = value.split(',').map((n) => parseInt(n.trim(), 10));
  if (parts.length < 3 || parts.some(Number.isNaN)) return fallback;
  return parts.slice(0, 3);
};

const setPx = (png, x, y, color) => {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = (png.width * y + x) << 2;
  png.data[i] = color[0];
  png.data[i + 1] = color[1];
  png.data[i + 2] = color[2];
  png.data[i + 3] = 255;
};

const fillRect = (png, x, y, w, h, color) => {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      setPx(png, px, py, color);
    }
  }
};

/**
 * Mini-bureau KDE : barre titre, client, panneau, bouton accent.
 */
export const renderSchemePreview = (sections, size = DEFAULT_SIZE) => {
  const png = new PNG({ width: size.width, height: size.height });
  const windowBg = rgb(sections['Colors:Window']?.BackgroundNormal, [239, 240, 241]);
  const titleBg = rgb(sections['Colors:Header']?.BackgroundNormal, windowBg);
  const titleFg = rgb(sections['Colors:Header']?.ForegroundNormal, [35, 38, 41]);
  const viewBg = rgb(sections['Colors:View']?.BackgroundNormal, [252, 252, 252]);
  const buttonBg = rgb(sections['Colors:Button']?.BackgroundNormal, [247, 247, 247]);
  const buttonFg = rgb(sections['Colors:Button']?.ForegroundNormal, [35, 38, 41]);
  const selectionBg = rgb(sections['Colors:Selection']?.BackgroundNormal, [61, 174, 233]);
  const panelBg = rgb(sections['Colors:Complementary']?.BackgroundNormal, [42, 46, 50]);
  const panelFg = rgb(sections['Colors:Complementary']?.ForegroundNormal, [252, 252, 252]);

  fillRect(png, 0, 0, size.width, size.height, windowBg);

  const titleH = Math.max(14, Math.round(size.height * 0.14));
  fillRect(png, 0, 0, size.width, titleH, titleBg);
  fillRect(png, 8, Math.round(titleH * 0.35), Math.round(size.width * 0.35), 3, titleFg);

  const panelH = Math.max(16, Math.round(size.height * 0.18));
  fillRect(png, 0, size.height - panelH, size.width, panelH, panelBg);
  fillRect(png, 10, size.height - panelH + Math.round(panelH * 0.35), 18, 3, panelFg);

  const clientX = Math.round(size.width * 0.08);
  const clientY = titleH + Math.round(size.height * 0.08);
  const clientW = Math.round(size.width * 0.84);
  const clientH = size.height - panelH - clientY - Math.round(size.height * 0.06);
  fillRect(png, clientX, clientY, clientW, clientH, viewBg);

  const btnW = Math.round(clientW * 0.28);
  const btnH = Math.max(10, Math.round(clientH * 0.22));
  fillRect(png, clientX + 8, clientY + 8, btnW, btnH, buttonBg);
  fillRect(png, clientX + 12, clientY + Math.round(btnH * 0.45), Math.round(btnW * 0.55), 2, buttonFg);

  fillRect(png, clientX + 8, clientY + btnH + 10, Math.round(clientW * 0.55), 4, selectionBg);

  return png;
};

export const renderSchemePreviewFromFile = (colorsPath, size = DEFAULT_SIZE) => {
  const text = fs.readFileSync(colorsPath, 'utf8');
  return renderSchemePreview(parseColorsFile(text), size);
};

export const writeSchemePreview = (colorsPath, outPath, size = DEFAULT_SIZE) => {
  const png = renderSchemePreviewFromFile(colorsPath, size);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, PNG.sync.write(png));
  return outPath;
};

export { parseColorsFile, DEFAULT_SIZE };
