#!/usr/bin/env node
/**
 * Checkpoint captures post-clonage — screenshots Playwright des surfaces clés.
 *
 * Usage :
 *   python3 -m http.server 5500 --bind 127.0.0.1
 *   node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-mint
 *   node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --all --tier P0
 *   node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-mint --compare
 *   node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-mint --write-baseline
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listCloneTargets } from '../clone-checkpoints-lib.mjs';
import { getCaptureShots } from './clone-capture-scenarios.mjs';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';

const CAPTURE_CLOCK_ISO = '2026-06-08T14:30:00+02:00';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');

const args = process.argv.slice(2);
const idIdx = args.indexOf('--id');
const tierIdx = args.indexOf('--tier');
const runAll = args.includes('--all');
const compare = args.includes('--compare');
const writeBaseline = args.includes('--write-baseline');
const urlArgIdx = args.indexOf('--url');

const defaultChrome = [
  '/home/n0r3f/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/headless_shell',
  '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));

const chromePath = process.env.PLAYWRIGHT_CHROME || defaultChrome;

const sleep = (page, ms) => page.waitForTimeout(ms);

const resolveEntry = (registryId) => {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  const entry = registry.entries.find((e) => e.id === registryId);
  const skin = entry?.referencePaths?.skin || entry?.skin;
  if (!entry || !skin) {
    throw new Error(`entrée introuvable: ${registryId}`);
  }
  return { ...entry, skin };
};

const captureOne = async (registryId, chromium, options = {}) => {
  const entry = resolveEntry(registryId);
  const defaultUrl = `${resolveCapsuleHttpBase(registryId)}/${entry.skin}`;
  const URL = options.url || defaultUrl;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
  const outDir = path.join(ROOT, 'root/docs/inventaires/captures', registryId, stamp);
  const baselineDir = path.join(ROOT, 'root/docs/inventaires/captures', registryId, 'baseline');
  const shots = getCaptureShots(registryId);

  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.clock.install({ time: new Date(CAPTURE_CLOCK_ISO) });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate((iso) => {
    const fixed = new Date(iso);
    const clock = document.getElementById('taskbar-clock');
    const dateLabel = document.getElementById('taskbar-date');
    const shortTime = fixed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (clock) {
      clock.textContent = shortTime;
      clock.setAttribute('datetime', fixed.toISOString());
    }
    if (dateLabel) {
      dateLabel.textContent = fixed.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }, CAPTURE_CLOCK_ISO);
  await sleep(page, 400);

  const manifest = { id: registryId, url: URL, stamp, captures: [] };

  console.log(`\n── capture-clone-surfaces (${registryId}) ──`);
  for (const shot of shots) {
    await shot.action(page);
    const filePath = path.join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    manifest.captures.push({ name: shot.name, file: path.relative(ROOT, filePath) });
    console.log(`  ✓ ${shot.name}.png`);
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await browser.close();

  if (writeBaseline) {
    fs.mkdirSync(baselineDir, { recursive: true });
    manifest.captures.forEach((cap) => {
      const src = path.join(ROOT, cap.file);
      const dest = path.join(baselineDir, `${cap.name}.png`);
      fs.copyFileSync(src, dest);
    });
    fs.copyFileSync(path.join(outDir, 'manifest.json'), path.join(baselineDir, 'manifest.json'));
    console.log(`  ✓ baseline écrite → ${path.relative(ROOT, baselineDir)}/`);
  }

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
      throw new Error(`${registryId}: ${drift} capture(s) différente(s) de la baseline`);
    }
    console.log('  ✓ comparaison baseline — aucun drift');
  }

  console.log(`  → ${path.relative(ROOT, outDir)}/`);
  return outDir;
};

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

const sharedUrl = urlArgIdx >= 0 ? args[urlArgIdx + 1] : null;

try {
  if (runAll) {
    const tier = tierIdx >= 0 ? args[tierIdx + 1] : null;
    const targets = listCloneTargets(ROOT, { tier });
    if (!targets.length) {
      console.error('✗ aucune cible');
      process.exit(1);
    }
    console.log(`capture-clone-surfaces --all (${targets.length} skin(s)${tier ? `, tier ${tier}` : ''})`);
    for (const entry of targets) {
      await captureOne(entry.id, chromium, { url: sharedUrl });
    }
    console.log('\n✓ capture-clone-surfaces --all OK');
    process.exit(0);
  }

  if (idIdx < 0) {
    console.error('Usage: capture-clone-surfaces.mjs --id <registryId> | --all [--tier P0] [--compare] [--write-baseline]');
    process.exit(1);
  }

  await captureOne(args[idIdx + 1], chromium, { url: sharedUrl });
  console.log('\n✓ capture-clone-surfaces OK');
} catch (err) {
  console.error(`\n✗ capture-clone-surfaces : ${err.message || err}`);
  process.exit(1);
}
