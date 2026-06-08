#!/usr/bin/env node
/**
 * Checkpoint captures post-clonage — screenshots Playwright des surfaces clés.
 *
 * Usage :
 *   python3 -m http.server 5500 --bind 127.0.0.1   # autre terminal
 *   node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-mint --compare
 *
 * Sortie : root/docs/inventaires/captures/<id>/YYYYMMDD-HHMMSS/*.png
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');

const args = process.argv.slice(2);
const idIdx = args.indexOf('--id');
const compare = args.includes('--compare');
const urlArgIdx = args.indexOf('--url');

if (idIdx < 0) {
  console.error('Usage: capture-clone-surfaces.mjs --id <registryId> [--url <http-url>] [--compare]');
  process.exit(1);
}

const registryId = args[idIdx + 1];
const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
const entry = registry.entries.find((e) => e.id === registryId);
if (!entry || !entry.skin) {
  console.error(`✗ entrée introuvable: ${registryId}`);
  process.exit(1);
}

const defaultUrl = `http://127.0.0.1:5500/${entry.skin}`;
const URL = urlArgIdx >= 0 ? args[urlArgIdx + 1] : defaultUrl;
const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
const outDir = path.join(ROOT, 'root/docs/inventaires/captures', registryId, stamp);
const baselineDir = path.join(ROOT, 'root/docs/inventaires/captures', registryId, 'baseline');

const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));

const chromePath = process.env.PLAYWRIGHT_CHROME || defaultChrome;
if (!chromePath) {
  console.error('✗ Chrome/Playwright introuvable — définir PLAYWRIGHT_CHROME');
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error('✗ playwright-core requis (npm install playwright-core)');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const sleep = (page, ms) => page.waitForTimeout(ms);

const openSlot = async (page, slot) => {
  await page.evaluate((s) => {
    if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink(s);
    }
  }, slot);
  await page.waitForSelector(`.windowElement[data-link="${slot}"]`, { state: 'visible', timeout: 15000 }).catch(() => {});
  await sleep(page, 200);
};

const shots = [
  { name: '01-desktop-panel', action: async (page) => {} },
  {
    name: '02-menu',
    action: async (page) => {
      await page.click('footer nav a[target="windowElement"][data-link="mainMenu"]');
      await page.waitForSelector('#mainMenu', { state: 'visible', timeout: 8000 });
      await sleep(page, 300);
    },
  },
  {
    name: '03-nemo',
    action: async (page) => {
      await openSlot(page, 'nemo');
    },
  },
  {
    name: '04-firefox',
    action: async (page) => {
      await openSlot(page, 'firefox');
    },
  },
  {
    name: '05-terminal',
    action: async (page) => {
      await openSlot(page, 'terminal');
    },
  },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await sleep(page, 500);

const manifest = { id: registryId, url: URL, stamp, captures: [] };

for (const shot of shots) {
  await shot.action(page);
  const filePath = path.join(outDir, `${shot.name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  manifest.captures.push({ name: shot.name, file: path.relative(ROOT, filePath) });
  console.log(`  ✓ ${shot.name}.png`);
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
await browser.close();

if (compare && fs.existsSync(baselineDir)) {
  let drift = 0;
  manifest.captures.forEach((cap) => {
    const baseFile = path.join(baselineDir, `${cap.name}.png`);
    const newFile = path.join(ROOT, cap.file);
    if (!fs.existsSync(baseFile)) {
      console.warn(`  ⚠ baseline manquante: ${cap.name}.png`);
      drift += 1;
      return;
    }
    const a = fs.readFileSync(baseFile);
    const b = fs.readFileSync(newFile);
    if (!a.equals(b)) {
      console.warn(`  ⚠ drift visuel: ${cap.name}.png`);
      drift += 1;
    }
  });
  if (drift) {
    console.error(`\n✗ capture-clone-surfaces — ${drift} capture(s) différente(s) de la baseline`);
    process.exit(1);
  }
  console.log('✓ Comparaison baseline — aucun drift');
}

console.log(`\n✓ capture-clone-surfaces OK → ${path.relative(ROOT, outDir)}/`);
