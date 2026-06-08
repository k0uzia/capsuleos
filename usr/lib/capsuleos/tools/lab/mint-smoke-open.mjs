/**
 * Helpers Playwright — ouverture apps Mint (menu, raccourcis bureau, API noyau).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

export const MINT_URL = process.env.CAPSULE_MINT_URL
  || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';

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
};

const DESKTOP_SHORTCUT_SLOTS = new Set(['calculator', 'text_editor', 'mintinstall', 'themes']);

export async function waitMintReady(page) {
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
