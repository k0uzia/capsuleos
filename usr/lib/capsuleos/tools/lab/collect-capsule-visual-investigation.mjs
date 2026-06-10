#!/usr/bin/env node
/**
 * Captures Capsule miroir — lot P0 enquête visuelle (prédicat Vc).
 * Vendor-agnostique : --id <registryId> (ex. linux-rocky).
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/collect-capsule-visual-investigation.mjs --id linux-rocky
 */
import fs from 'fs';
import path from 'path';
import {
  ROOT,
  loadContract,
  loadRegistryEntry,
  pathsForRegistry,
  skinUrlFromRegistry,
} from './replication-chain-lib.mjs';
import { resolveCapsuleHttpBase, resolveLabMatrix } from './lab-recipe-resolver.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', filter: 'P0', only: [] };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--filter' && args[i + 1]) opts.filter = args[++i];
    else if (args[i] === '--only' && args[i + 1]) {
      opts.only = args[++i].split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return opts;
};

const resolveVisualMatrix = (registryId) => {
  try {
    return resolveLabMatrix(registryId, 'visual').absolute;
  } catch {
    /* fallback legacy */
  }
  const vendor = loadRegistryEntry(registryId).vendor || registryId.replace(/^linux-/, '');
  const vendorMatrix = path.join(ROOT, 'root/tools/lab', `gnome-settings-visual-investigation-matrix-${vendor}.json`);
  if (fs.existsSync(vendorMatrix)) return vendorMatrix;
  return path.join(ROOT, 'root/tools/lab/gnome-settings-visual-investigation-matrix.json');
};

const priorityForControl = (matrixById, controlId) =>
  matrixById[controlId]?.parityPriority || null;

const runPrepare = async (page, prepare) => {
  if (!prepare) return;
  await page.evaluate((p) => {
    const bodyId = document.body?.id || '';
    const storage = window.CapsuleThemeStorage;
    if (p === 'accent-orange' && storage?.applyAccentColor) {
      storage.applyAccentColor('orange');
    } else if (p === 'wallpaper-almalinux' && storage?.applyWallpaper) {
      storage.applyWallpaper('almalinux', 'alma');
    } else if ((p === 'wallpaper-f44' || p === 'wallpaper-abstract-2') && storage?.applyWallpaper) {
      const vendor = bodyId === 'alma' ? 'alma' : (bodyId === 'fedora' ? 'fedora' : 'rocky');
      const wpId = p === 'wallpaper-almalinux' || bodyId === 'alma'
        ? 'almalinux'
        : ((p === 'wallpaper-f44' || vendor === 'fedora') ? 'f44-01' : 'abstract-2');
      storage.applyWallpaper(wpId, vendor);
    } else if (p === 'hot-corners-off') {
      document.documentElement.dataset.hotCorners = 'off';
      if (window.CapsuleGnomeSettingsParity?.controls?.['hot-corner']?.apply) {
        window.CapsuleGnomeSettingsParity.controls['hot-corner'].apply('Désactivé');
      }
    } else if (p === 'display-scale-125' && storage?.applyDisplayScale) {
      storage.applyDisplayScale('125 %');
    } else if (p === 'font-scale-125' && storage?.applyFontScale) {
      storage.applyFontScale('125');
    } else if (p === 'contrast-high' && storage?.applyContrastMode) {
      storage.applyContrastMode('high');
    } else if (p === 'power-mode-performance') {
      const parity = window.CapsuleGnomeSettingsParity;
      if (parity?.applySelectValue) {
        parity.applySelectValue('power-mode', 'Performance');
      } else if (parity?.controls?.['power-mode']?.apply) {
        parity.controls['power-mode'].apply('Performance');
      }
    } else if (p === 'search-files-off') {
      const parity = window.CapsuleGnomeSettingsParity;
      if (parity?.applySwitchValue) {
        parity.applySwitchValue('search-files', false);
      } else if (parity?.controls?.['search-files']?.apply) {
        parity.controls['search-files'].apply(false);
      }
    } else if (p === 'notifications-banners-off') {
      const parity = window.CapsuleGnomeSettingsParity;
      if (parity?.applySwitchValue) {
        parity.applySwitchValue('notifications', false);
      } else if (parity?.controls?.notifications?.apply) {
        parity.controls.notifications.apply(false);
      }
    } else if (p === 'power-dim-short') {
      const parity = window.CapsuleGnomeSettingsParity;
      if (parity?.applySelectValue) {
        parity.applySelectValue('power-dim', '5 min');
      } else if (parity?.controls?.['power-dim']?.apply) {
        parity.controls['power-dim'].apply('5 min');
      }
    } else if (p === 'wifi-off') {
      document.documentElement.dataset.wifiEnabled = 'off';
      if (window.CapsuleGnomeSettingsParity?.controls?.wifi?.apply) {
        window.CapsuleGnomeSettingsParity.controls.wifi.apply(false);
      }
    }
  }, prepare);
};

const sleep = (page, ms) => page.waitForTimeout(ms);

const setTheme = async (page, theme) => {
  await page.evaluate((t) => {
    const resolved = t === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem('gnome-theme', resolved);
  }, theme);
};

const resetShell = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll('.windowElement[data-link]').forEach((win) => {
      const slot = win.dataset ? win.dataset.link : '';
      if (!slot || slot === 'mainMenu') return;
      win.style.display = 'none';
      win.classList.remove('windowElementActive', 'active');
    });
    if (window.CapsuleGnomeOverview?.setOverview) {
      window.CapsuleGnomeOverview.setOverview(false, 'workspace');
    }
    const popover = document.getElementById('volume-popover');
    const btn = document.getElementById('tray-quick-settings-btn');
    if (popover) popover.setAttribute('hidden', '');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
};

const openSlot = async (page, slot) => {
  const opened = await page.evaluate((s) => {
    const ok = typeof window.openWindowByDataLink === 'function'
      ? window.openWindowByDataLink(s)
      : false;
    const el = document.querySelector('.windowElement[data-link="' + s + '"]');
    const display = el ? getComputedStyle(el).display : 'missing';
    return { ok, display };
  }, slot);
  if (!opened.ok || opened.display === 'none') {
    throw new Error(`Impossible d'ouvrir ${slot}`);
  }
  await sleep(page, 600);
};

const relCapture = (registryId, controlId, file) =>
  path.join('root/docs/inventaires/captures', registryId, 'gnome-settings-visual-capsule', controlId, file);

const buildScenes = (registryId, contract, filter, matrixById, onlyIds = []) => {
  const { capturePrefix } = pathsForRegistry(registryId);
  const scenes = contract.capsuleControlScenes || {};
  const out = [];
  for (const [controlId, spec] of Object.entries(scenes)) {
    if (onlyIds.length && !onlyIds.includes(controlId)) continue;
    const priority = priorityForControl(matrixById, controlId);
    if (filter !== 'all' && priority !== filter) continue;
    for (const ref of spec.referenceFiles || []) {
      const srcName = ref.replace('{prefix}', capturePrefix);
      out.push({ controlId, srcName, destFile: srcName.replace(`${capturePrefix}-`, '') });
    }
    for (const panel of spec.panels || []) {
      const panelSpec = typeof panel === 'string' ? { panel } : panel;
      const panelId = panelSpec.panel;
      const prepare = panelSpec.prepare || null;
      const shot = panelSpec.shot || 'settings';
      const suffix = prepare ? `-${prepare.replace(/-/g, '')}` : '';
      out.push({
        controlId,
        playwright: {
          settingsPanel: panelId,
          theme: 'dark',
          prepare,
          shot,
        },
        destFile: shot === 'desktop'
          ? `desktop${suffix || `-${panelId}`}.png`
          : `panel-${panelId}${suffix}.png`,
      });
    }
  }
  return out;
};

const copyFromInventory = (registryId, scenes, capsuleDir, destBase) => {
  const copies = [];
  for (const scene of scenes) {
    if (!scene.srcName) continue;
    const src = path.join(capsuleDir, scene.srcName);
    if (!fs.existsSync(src)) continue;
    const rel = relCapture(registryId, scene.controlId, scene.destFile);
    const abs = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.copyFileSync(src, abs);
    copies.push({ controlId: scene.controlId, path: rel, source: scene.srcName });
  }
  return copies;
};

const capturePlaywright = async (registryId, scenes, url) => {
  const { chromium } = await import('playwright');
  const chromePath = [
    process.env.PLAYWRIGHT_CHROME,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((p) => p && fs.existsSync(p));

  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

  const copies = [];
  for (const scene of scenes.filter((s) => s.playwright)) {
    await setTheme(page, scene.playwright.theme || 'dark');
    await resetShell(page);
    await runPrepare(page, scene.playwright.prepare);
    if (scene.playwright.shot !== 'desktop') {
      await openSlot(page, 'themes');
      await page.evaluate((panel) => {
        if (typeof window.setCapsuleSettingsPanel === 'function') {
          window.setCapsuleSettingsPanel(panel);
        }
      }, scene.playwright.settingsPanel);
      await sleep(page, 500);
    } else {
      await sleep(page, 400);
    }
    const rel = relCapture(registryId, scene.controlId, scene.destFile);
    const abs = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    await page.screenshot({ path: abs });
    copies.push({ controlId: scene.controlId, path: rel, source: 'playwright' });
  }
  await browser.close();
  return copies;
};

const mergeIntoInventory = (registryId, allCopies, filter) => {
  const invPath = pathsForRegistry(registryId).visualInvestigation;
  if (!fs.existsSync(invPath)) throw new Error(`Inventaire visuel manquant: ${invPath}`);
  const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const byControl = {};
  for (const c of allCopies) {
    if (!byControl[c.controlId]) byControl[c.controlId] = [];
    byControl[c.controlId].push({ phase: 'capsule-reference', path: c.path, source: c.source });
  }
  for (const item of inv.investigations || []) {
    const priority = item.capsuleParity?.parityPriority;
    if (item.status !== 'documented' || priority !== filter) continue;
    if (byControl[item.controlId]) {
      item.capsuleCaptures = [
        ...(item.capsuleCaptures || []).filter((c) => !byControl[item.controlId].some((n) => n.path === c.path)),
        ...byControl[item.controlId],
      ];
    }
  }
  const documented = (inv.investigations || []).filter(
    (i) => i.status === 'documented' && i.capsuleParity?.parityPriority === filter,
  );
  const withCaptures = documented.filter((i) => (i.capsuleCaptures || []).length > 0).length;
  inv.summary = {
    ...(inv.summary || {}),
    ...(filter === 'P0' ? { capsuleCapturesP0: withCaptures } : {}),
    ...(filter === 'P1' ? { capsuleCapturesP1: withCaptures } : {}),
    ...(filter === 'P2' ? { capsuleCapturesP2: withCaptures } : {}),
  };
  inv.capsuleVisualCollect = {
    generatedAt: new Date().toISOString(),
    investigator: 'collect-capsule-visual-investigation.mjs',
    filter,
    files: allCopies.length,
  };
  fs.writeFileSync(invPath, `${JSON.stringify(inv, null, 2)}\n`);
  return invPath;
};

const main = async () => {
  const opts = parseArgs();
  const contract = loadContract();
  const paths = pathsForRegistry(opts.id);
  const base = resolveCapsuleHttpBase(opts.id);
  process.stderr.write(`Capsule HTTP : ${base}\n`);
  const skin = loadRegistryEntry(opts.id).referencePaths?.skin || '';
  const url = `${base}/${skin.replace(/^\//, '')}`;

  const matrixPath = resolveVisualMatrix(opts.id);
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  process.stderr.write(`Matrice : ${path.relative(ROOT, matrixPath)}\n`);
  const matrixById = Object.fromEntries((matrix.investigations || []).map((i) => [i.controlId, i]));
  let scenes = buildScenes(opts.id, contract, opts.filter, matrixById, opts.only);
  if (opts.id === 'linux-fedora') {
    scenes = scenes.map((scene) => {
      if (!scene.playwright?.prepare) return scene;
      const prepare = scene.playwright.prepare === 'wallpaper-abstract-2'
        ? 'wallpaper-f44'
        : scene.playwright.prepare;
      return { ...scene, playwright: { ...scene.playwright, prepare } };
    });
  }
  if (opts.id === 'linux-alma') {
    scenes = scenes.map((scene) => {
      if (!scene.playwright?.prepare) return scene;
      const prepare = scene.playwright.prepare === 'wallpaper-abstract-2'
        ? 'wallpaper-almalinux'
        : scene.playwright.prepare;
      return { ...scene, playwright: { ...scene.playwright, prepare } };
    });
  }
  let copies = copyFromInventory(opts.id, scenes, paths.capsuleInventoryDir, paths.capsuleCapturesDir);

  const needPlaywright = scenes.some((s) => s.playwright)
    && scenes.filter((s) => s.playwright).some((s) => !copies.find((c) => c.controlId === s.controlId && c.path.includes(s.destFile)));

  if (needPlaywright) {
    const pw = await capturePlaywright(opts.id, scenes, url);
    copies = [...copies, ...pw];
  }

  if (!copies.length) {
    process.stderr.write(
      `⚠ Aucune capture Capsule — lancer capture vendor ou CAPSULE_HTTP_BASE :\n`
      + `  node root/tools/lab/capture-capsule-${paths.vendor}.mjs\n`
      + `  ou définir CAPSULE_HTTP_BASE pour Playwright\n`,
    );
    process.exit(1);
  }

  const invPath = mergeIntoInventory(opts.id, copies, opts.filter);
  process.stdout.write(`OK ${invPath} — ${copies.length} captures Capsule filter=${opts.filter}\n`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
