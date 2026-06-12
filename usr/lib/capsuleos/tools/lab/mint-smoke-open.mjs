/**
 * Helpers Playwright — ouverture apps Mint (menu, raccourcis bureau, API noyau).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

export const MINT_URL = process.env.CAPSULE_MINT_URL
  || 'http://127.0.0.1:5501/home/Debian/Mint/index.html';

export const MINT_VIEWPORT = { width: 1280, height: 800 };

export const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const MENU_SEARCH = {
  nemo: 'Fichiers',
  firefox: 'Firefox',
  text_editor: 'Éditeur de texte',
  calculator: 'Calculatrice',
  file_roller: 'Archive',
  update_manager: 'Gestionnaire de mise à jour',
  mintinstall: 'Logithèque',
  themes: 'Paramètres',
  terminal: 'Terminal',
  baobab: 'Analyseur d’utilisation des disques',
  bulky: 'Renommeur de fichiers',
  drawing: 'Dessin',
  font_viewer: 'Polices',
  gnome_disks: 'Disques',
  gucharmap: 'Table de caractères',
  hypnotix: 'Hypnotix',
  screenshot: 'Capture d’écran',
  lecteur_multimedia: 'Celluloid',
  librecalc: 'LibreOffice Calc',
  librewriter: 'LibreOffice Writer',
  libreoffice_startcenter: 'LibreOffice',
  libreoffice_draw: 'LibreOffice Draw',
  libreoffice_impress: 'LibreOffice Impress',
  simple_scan: 'Numériseur de documents',
  transmission: 'Transmission',
  rhythmbox: 'Rhythmbox',
  sticky: 'Notes',
  timeshift: 'Timeshift',
  mintbackup: 'Outil de sauvegarde',
  thingy: 'Bibliothèque',
  warpinator: 'Warpinator',
  mintstick: 'Créateur de clé USB',
  mintstick_format: 'Formateur de clé USB',
  power_stats: 'Statistiques de l’alimentation',
  visionneur_images: 'Visionneur d’images',
  visionneur_pdf: 'Visionneur de documents',
  mintdrivers: 'Gestionnaire de pilotes',
  mintwelcome: 'Écran d\'accueil',
  system_monitor: 'Moniteur système',
  thunderbird: 'Thunderbird',
  webapp_manager: 'Applications web',
  mate_color_select: 'Sélecteur de couleur',
};

const DESKTOP_SHORTCUT_SLOTS = new Set(['calculator', 'text_editor', 'mintinstall', 'themes']);

export async function waitMintReady(page) {
  await page.setViewportSize(MINT_VIEWPORT);
  await page.goto(MINT_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(
    () => typeof window.openWindowByDataLink === 'function',
    null,
    { timeout: 60000 },
  );
}

export async function openMintSlot(page, slot) {
  const canOpenByApi = await page.evaluate(() => typeof window.openWindowByDataLink === 'function');
  if (canOpenByApi) {
    await page.evaluate((s) => window.openWindowByDataLink(s), slot);
    await page.waitForTimeout(180);
    return { via: 'openWindowByDataLink' };
  }

  if (DESKTOP_SHORTCUT_SLOTS.has(slot)) {
    const sel = `.desktop-shortcut[data-link="${slot}"]`;
    if (await page.$(sel)) {
      await page.click(sel);
      await page.waitForTimeout(180);
      return { via: 'desktop-shortcut' };
    }
  }

  const query = MENU_SEARCH[slot] || slot;
  await openMintMainMenu(page);
  await page.fill('#menu-search', query);
  await page.waitForTimeout(80);
  await page.click('#menu-app-list .menu-app-item:not(.is-unavailable)');
  await page.waitForTimeout(180);
  return { via: 'main-menu', query };
}

export async function openMintMainMenu(page) {
  const trigger = 'footer nav a[data-link="mainMenu"]';
  await page.click(trigger);
  await page.waitForTimeout(45);
}

export function loadMenuSlots() {
  const catalog = path.join(ROOT, 'root/docs/inventaires/linux-mint-apps-catalog.json');
  if (!fs.existsSync(catalog)) return [];
  const data = JSON.parse(fs.readFileSync(catalog, 'utf8'));
  return data.capsuleSlots || [];
}
