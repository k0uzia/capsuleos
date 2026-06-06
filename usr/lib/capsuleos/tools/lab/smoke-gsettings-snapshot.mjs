#!/usr/bin/env node
/**
 * Smoke gsettings — cohérence exportSnapshot() après toggles UI Paramètres GNOME.
 *
 * Statique : vérifie API + bindings.
 * Playwright : si CAPSULE_HTTP_BASE défini (serveur HTTP à la racine du dépôt).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-gsettings-snapshot.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-gsettings-snapshot.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

function read(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`Fichier manquant: ${rel}`);
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
}

const storeJs = read('usr/lib/capsuleos/shells/linux/gnome-gsettings-store.js');
const bindingsJs = read('usr/lib/capsuleos/shells/linux/gnome-gsettings-bindings.js');
const bindingsJson = JSON.parse(read('usr/share/capsuleos/linux/gnome-gsettings-bindings.json') || '{}');

if (!storeJs.includes('exportSnapshot')) {
  errors.push('gnome-gsettings-store.js : exportSnapshot absent');
}
if (!bindingsJs.includes('CAPSULE_GSETTINGS_BINDINGS')) {
  errors.push('gnome-gsettings-bindings.js : CAPSULE_GSETTINGS_BINDINGS absent');
}
if ((bindingsJson.bindingCount || 0) < 25) {
  errors.push(`gnome-gsettings-bindings.json : bindingCount trop faible (${bindingsJson.bindingCount})`);
}

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(k) { return data.has(k) ? data.get(k) : null; },
    setItem(k, v) { data.set(k, String(v)); },
    removeItem(k) { data.delete(k); },
    key(i) { return [...data.keys()][i] ?? null; },
    get length() { return data.size; },
  };
}

function loadGsettingsRuntime() {
  const sandbox = {
    window: {},
    localStorage: createMemoryStorage(),
    document: null,
    CustomEvent: null,
  };
  sandbox.window = sandbox;
  vm.runInNewContext(read('usr/lib/capsuleos/shells/linux/gnome-gsettings-bindings.js'), sandbox);
  vm.runInNewContext(read('usr/lib/capsuleos/shells/linux/gnome-gsettings-store.js'), sandbox);
  return sandbox.CapsuleGnomeGSettings;
}

const gs = loadGsettingsRuntime();
if (!gs) {
  errors.push('Runtime gsettings : CapsuleGnomeGSettings indisponible');
} else {
  gs.setCapsule('gnome-notifications-enabled', 'on');
  const snap = gs.exportSnapshot();
  const pair = 'org.gnome.desktop.notifications::show-banners';
  if (snap[pair] !== 'true') {
    errors.push(`exportSnapshot statique : ${pair} attendu true, reçu ${snap[pair]}`);
  }
  gs.setCapsule('gnome-notifications-enabled', 'off');
  if (gs.exportSnapshot()[pair] !== 'false') {
    errors.push('exportSnapshot statique : toggle notifications → false échoué');
  }
  gs.setCapsule('gnome-search-files', 'off');
  const disabled = gs.getRaw('org.gnome.desktop.search-providers', 'disabled');
  if (!String(disabled).includes('org.gnome.Nautilus')) {
    errors.push('exportSnapshot statique : search-files off n’ajoute pas org.gnome.Nautilus dans disabled');
  }
  gs.setCapsule('gnome-dnd-enabled', 'on');
  if (gs.exportSnapshot()['org.capsuleos.gnome.shell::dnd-enabled'] !== 'true') {
    errors.push('exportSnapshot statique : DND simulé non persisté');
  }
  gs.setCapsule('gnome-power-mode', 'Performance');
  if (gs.getCapsule('gnome-power-mode', '') !== 'Performance') {
    errors.push('exportSnapshot statique : power-mode Performance échoué');
  }
}

async function runPlaywright() {
  const base = (process.env.CAPSULE_HTTP_BASE || '').replace(/\/$/, '');
  if (!base) {
    return;
  }
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    errors.push('Playwright indisponible pour smoke-gsettings-snapshot');
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(`${base}/home/RedHat/Rocky/index.html`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForFunction(
      () => typeof window.CapsuleGnomeGSettings === 'object'
        && typeof window.CapsuleGnomeGSettings.exportSnapshot === 'function',
      null,
      { timeout: 30000 },
    );

    await page.evaluate(() => {
      if (typeof window.openWindowByDataLink === 'function') {
        window.openWindowByDataLink('themes');
      }
    });
    await page.waitForTimeout(1200);

    const result = await page.evaluate(() => {
      const gs = window.CapsuleGnomeGSettings;
      const root = document.querySelector('#themes #themesApp');
      const checks = [];
      const pair = (schema, key) => `${schema}::${key}`;

      function navTo(panelId) {
        const nav = root.querySelector(`[data-gnome-settings-panel="${panelId}"]`);
        if (nav) {
          nav.click();
        }
      }

      if (!root || !gs) {
        return { error: 'themesApp ou CapsuleGnomeGSettings absent' };
      }

      navTo('notifications');
      const notifSw = root.querySelector('[data-settings-switch="notifications"]');
      if (!notifSw) {
        return { error: 'switch notifications absent' };
      }
      const notifBefore = notifSw.getAttribute('aria-checked');
      const rawNotifBefore = gs.getRaw('org.gnome.desktop.notifications', 'show-banners');
      notifSw.click();
      const notifAfter = notifSw.getAttribute('aria-checked');
      const rawNotifAfter = gs.getRaw('org.gnome.desktop.notifications', 'show-banners');
      const snapNotif = gs.exportSnapshot();
      const expectedRaw = notifAfter === 'true' ? 'true' : 'false';
      checks.push({
        id: 'notifications-raw',
        ok: notifBefore !== notifAfter && rawNotifAfter === expectedRaw,
      });
      checks.push({
        id: 'notifications-snapshot',
        ok: snapNotif[pair('org.gnome.desktop.notifications', 'show-banners')] === rawNotifAfter,
      });
      checks.push({
        id: 'notifications-storage-key',
        ok: localStorage.getItem('gsettings::org.gnome.desktop.notifications::show-banners') === rawNotifAfter,
      });

      navTo('multitasking');
      const dynRow = root.querySelector('[data-settings-apply="dynamic-workspaces"]');
      if (!dynRow) {
        return { error: 'select dynamic-workspaces absent' };
      }
      const dynLabelBefore = dynRow.querySelector('.adw-row__value')?.textContent.trim();
      dynRow.click();
      const dynLabelAfter = dynRow.querySelector('.adw-row__value')?.textContent.trim();
      const rawDyn = gs.getRaw('org.gnome.mutter', 'dynamic-workspaces');
      const expectedDyn = dynLabelAfter === 'Activé' ? 'true' : 'false';
      checks.push({
        id: 'dynamic-workspaces',
        ok: dynLabelBefore !== dynLabelAfter && rawDyn === expectedDyn
          && gs.exportSnapshot()[pair('org.gnome.mutter', 'dynamic-workspaces')] === rawDyn,
      });

      navTo('search');
      const filesSw = root.querySelector('[data-settings-switch="search-files"]');
      if (!filesSw) {
        return { error: 'switch search-files absent' };
      }
      const filesBefore = filesSw.getAttribute('aria-checked');
      filesSw.click();
      const filesAfter = filesSw.getAttribute('aria-checked');
      const disabledRaw = gs.getRaw('org.gnome.desktop.search-providers', 'disabled') || '@as []';
      const nautilusDisabled = disabledRaw.includes('org.gnome.Nautilus');
      checks.push({
        id: 'search-files-disabled',
        ok: filesBefore !== filesAfter
          && (filesAfter === 'true' ? !nautilusDisabled : nautilusDisabled),
      });
      checks.push({
        id: 'search-files-snapshot',
        ok: gs.exportSnapshot()[pair('org.gnome.desktop.search-providers', 'disabled')] === disabledRaw,
      });

      navTo('displays');
      const nightSw = root.querySelector('[data-settings-switch="night-light"]');
      if (!nightSw) {
        return { error: 'switch night-light absent' };
      }
      nightSw.click();
      const nightAria = nightSw.getAttribute('aria-checked');
      const nightRaw = gs.getRaw('org.gnome.settings-daemon.plugins.color', 'night-light-enabled');
      checks.push({
        id: 'night-light',
        ok: nightRaw === (nightAria === 'true' ? 'true' : 'false'),
      });

      const snap = gs.exportSnapshot();
      checks.push({
        id: 'snapshot-min-keys',
        ok: Object.keys(snap).length >= 6,
      });

      const dndIcon = document.querySelector('.quick-settings__tile-icon--dnd');
      const dndBtn = dndIcon ? dndIcon.closest('.quick-settings__tile') : null;
      if (dndBtn) {
        const dndBefore = gs.getRaw('org.capsuleos.gnome.shell', 'dnd-enabled');
        dndBtn.click();
        const dndAfter = gs.getRaw('org.capsuleos.gnome.shell', 'dnd-enabled');
        checks.push({
          id: 'dnd-simulated-gsettings',
          ok: dndBefore !== dndAfter
            && gs.exportSnapshot()[pair('org.capsuleos.gnome.shell', 'dnd-enabled')] === dndAfter,
        });
      }

      const perfIcon = document.querySelector('.quick-settings__tile-icon--performance');
      const perfBtn = perfIcon ? perfIcon.closest('.quick-settings__tile') : null;
      if (perfBtn) {
        const powerBefore = gs.getCapsule('gnome-power-mode', 'Équilibré');
        perfBtn.click();
        const powerAfter = gs.getCapsule('gnome-power-mode', 'Équilibré');
        const powerRaw = gs.getRaw('org.capsuleos.gnome.power', 'active-profile');
        checks.push({
          id: 'power-mode-simulated',
          ok: powerBefore !== powerAfter && String(powerRaw).includes("'"),
        });
      }

      return {
        checks,
        failed: checks.filter((c) => !c.ok).map((c) => c.id),
        snapshotKeys: Object.keys(snap).length,
      };
    });

    if (result.error) {
      errors.push(`Playwright gsettings : ${result.error}`);
    } else if (result.failed.length) {
      errors.push(`Playwright gsettings snapshot : ${result.failed.join(', ')}`);
    } else {
      process.stdout.write(`  Playwright : ${result.snapshotKeys} clés dans exportSnapshot après toggles\n`);
    }
  } catch (error) {
    errors.push(`Playwright gsettings : ${error.message}`);
  } finally {
    await browser.close();
  }
}

await runPlaywright();

if (errors.length) {
  console.error('smoke-gsettings-snapshot — échec\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

const mode = process.env.CAPSULE_HTTP_BASE ? 'statique + Playwright' : 'statique';
console.log(`✓ smoke-gsettings-snapshot OK (${mode})`);
