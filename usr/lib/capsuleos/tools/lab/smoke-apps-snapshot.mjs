#!/usr/bin/env node
/**
 * Smoke apps — cohérence embed + contenu DOM par slot P0 (miroir smoke-gsettings-snapshot).
 *
 * Statique : vérifie clés embed + sélecteurs attendus dans les gabarits.
 * Playwright : si CAPSULE_HTTP_BASE défini, ouvre chaque slot P0 via façade OS.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-apps-snapshot.mjs --id linux-rocky
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-apps-snapshot.mjs --id linux-rocky
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCatalog } from './apps-catalog-lib.mjs';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const errors = [];

const P0_TEMPLATE_MARKERS_BY_TOOLKIT = {
  gnome: {
    calculator: 'gnome-calc',
    text_editor: 'xed-app',
    nemo: 'nautilus-app',
    firefox: 'capsule-browser',
    update_manager: 'gnome-software__sidebar',
    themes: 'themesApp',
    terminal: 'capsule-terminal',
  },
  cinnamon: {
    nemo: 'nemo-app',
    firefox: 'capsule-browser',
    update_manager: 'update-manager__layout',
    themes: 'cs-app',
    terminal: 'capsule-terminal',
    mintinstall: 'mintInstallApp',
    calculator: 'gnome-calc',
    text_editor: 'xed-app',
    calendar: 'gnomeCalendarApp',
    screenshot: 'gnomeScreenshotApp',
    drawing: 'drawingApp',
    lecteur_multimedia: 'lecteurMultimedia',
    libreoffice_startcenter: 'libreofficeStartcenterApp',
  },
  kde: {
    nemo: 'dolphin-app',
    firefox: 'capsule-browser',
    update_manager: 'kde-updates__sidebar',
    themes: 'kde-systemsettings',
    terminal: 'capsule-terminal-shell',
    text_editor: 'xed-app',
    lecteur_multimedia: 'celluloid-app',
  },
  cosmic: {
    calculator: 'gnome-calc',
    text_editor: 'xed-app',
    nemo: 'nautilus-app',
    firefox: 'capsule-browser',
    update_manager: 'gnome-software__sidebar',
    themes: 'themesApp',
    terminal: 'capsule-terminal',
    lecteur_multimedia: 'lecteurMultimedia',
  },
};

const P0_RUNTIME_SELECTORS_BY_TOOLKIT = {
  gnome: {
    calculator: '.gnome-calc__keypad, .gnome-calc',
    text_editor: '.xed-app, #xedApp',
    nemo: '.nautilus-app__headerbar, .nemo-app main',
    firefox: '.capsule-browser, .firefox-chrome',
    update_manager: '.gnome-software, .gnome-software__sidebar, .gnome-software__grid',
    themes: '#themesApp, .themes-app, .gnome-settings',
    terminal: '.capsule-terminal-shell, #terminalContainer',
  },
  cinnamon: {
    nemo: '.nemo-app__header, .nemo-app main',
    firefox: '.capsule-browser, .firefox-chrome',
    update_manager: '.update-manager, .update-manager__layout',
    themes: '#cinnamonSettingsApp.cs-app, .cs-app',
    terminal: '.capsule-terminal-shell, #terminalContainer',
    mintinstall: '#mintInstallApp, .mi-app__sidebar',
    calculator: '.gnome-calc__keypad, .gnome-calc',
    text_editor: '.xed-app, #xedApp',
    calendar: '.gnome-calendar-app, #gnomeCalendarApp',
    screenshot: '#gnomeScreenshotApp, .gnome-shot',
    drawing: '#drawingApp, .drawing-app',
    lecteur_multimedia: '.celluloid-app, #lecteurMultimedia',
    libreoffice_startcenter: '#libreofficeStartcenterApp, .lsc-app',
  },
  kde: {
    nemo: '.dolphin-app, .nemo-app__header',
    firefox: '.capsule-browser, .firefox-chrome',
    update_manager: '.kde-updates, .kde-updates__sidebar, .update-manager--kde',
    themes: '[data-kde-settings-root], #kdeSystemSettingsShell, .kde-systemsettings',
    terminal: '.capsule-terminal-shell, #terminalContainer',
    text_editor: '.xed-app, #xedApp',
    lecteur_multimedia: '.celluloid-app, #lecteurMultimedia',
  },
  cosmic: {
    calculator: '.gnome-calc__keypad, .gnome-calc',
    text_editor: '.xed-app, #xedApp',
    nemo: '.nautilus-app__headerbar, .nemo-app main',
    firefox: '.capsule-browser, .firefox-chrome',
    update_manager: '.gnome-software, .gnome-software__sidebar, .gnome-software__grid',
    themes: '#themesApp, .themes-app, .gnome-settings',
    terminal: '.capsule-terminal-shell, #terminalContainer',
    lecteur_multimedia: '.celluloid-app, #lecteurMultimedia',
  },
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`Fichier manquant: ${rel}`);
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
};

const main = async () => {
  const opts = parseArgs();
  const catalog = buildCatalog(opts.id);
  const toolkitId = catalog.toolkit || 'gnome';
  const P0_TEMPLATE_MARKERS = P0_TEMPLATE_MARKERS_BY_TOOLKIT[toolkitId] || P0_TEMPLATE_MARKERS_BY_TOOLKIT.gnome;
  const P0_RUNTIME_SELECTORS = P0_RUNTIME_SELECTORS_BY_TOOLKIT[toolkitId] || P0_RUNTIME_SELECTORS_BY_TOOLKIT.gnome;
  const embedPath = path.join(ROOT, 'var/lib/capsuleos/generated/capsule-app-embed.js');
  const embed = fs.existsSync(embedPath) ? fs.readFileSync(embedPath, 'utf8') : '';

  if (!embed.includes('CAPSULE_APP_EMBED')) {
    errors.push('capsule-app-embed.js : CAPSULE_APP_EMBED absent');
  }

  const p0Slots = catalog.rows.filter((r) => r.priorite === 'P0' && r.statut === 'ok' && r.slotCapsule && r.onVm !== false);

  for (const row of p0Slots) {
    const slot = row.slotCapsule;
    const template = row.specs?.template;
    if (template) {
      const embedKey = template.endsWith('.html') ? template.replace('.html', '') : template;
      if (!embed.includes(`"${embedKey}"`)) {
        errors.push(`${row.labelFr} : clé embed "${embedKey}" absente`);
      }
      const tplPath = path.join(ROOT, 'usr/share/capsuleos/linux/apps', template);
      if (fs.existsSync(tplPath)) {
        const tpl = fs.readFileSync(tplPath, 'utf8');
        const marker = P0_TEMPLATE_MARKERS[slot];
        if (marker && !tpl.includes(marker)) {
          errors.push(`${row.labelFr} : gabarit sans marqueur ${marker}`);
        }
      }
    }
    if (!P0_RUNTIME_SELECTORS[slot]) {
      errors.push(`${row.labelFr} (${slot}) : sélecteur P0 non défini dans smoke-apps-snapshot`);
    }
  }

  const base = process.env.CAPSULE_HTTP_BASE || '';
  if (base) {
    let chromium;
    try {
      ({ chromium } = await import('playwright'));
    } catch {
      errors.push('Playwright indisponible');
    }

    if (chromium) {
      const chromePath = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
      const browser = await chromium.launch({
        headless: true,
        ...(chromePath ? { executablePath: chromePath } : {}),
      });
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const url = resolveCapsuleOsUrl(opts.id, base);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 30000 });

        for (const row of p0Slots) {
          const slot = row.slotCapsule;
          const selector = P0_RUNTIME_SELECTORS[slot];
          if (!selector) continue;
          await page.evaluate((slotId) => {
            if (typeof window.openWindowByDataLink === 'function') {
              window.openWindowByDataLink(slotId);
            }
          }, slot);

          await page.waitForTimeout(1500);

          const selList = selector.split(',').map((s) => s.trim());
          let hasBody = false;
          const contentTimeout = toolkitId === 'cosmic' ? 45000 : 15000;
          try {
            await page.waitForFunction(
              ({ slotId, selectors }) => {
                const win = document.querySelector(`.windowElement[data-link="${slotId}"]`);
                if (!win || getComputedStyle(win).display === 'none') return false;
                return selectors.some((sel) => !!win.querySelector(sel));
              },
              { slotId: slot, selectors: selList },
              { timeout: contentTimeout },
            );
            hasBody = true;
          } catch {
            hasBody = false;
          }

          const visible = await page.evaluate((slotId) => {
            const win = document.querySelector(`.windowElement[data-link="${slotId}"]`);
            return !!(win && getComputedStyle(win).display !== 'none');
          }, slot);

          if (!visible) errors.push(`${row.labelFr} (${slot}) : fenêtre non visible après openWindowByDataLink`);
          else if (!hasBody) errors.push(`${row.labelFr} (${slot}) : contenu ${selector} absent`);
        }
      } finally {
        await browser.close();
      }
    }
  } else {
    process.stdout.write('○ smoke-apps-snapshot Playwright ignoré — CAPSULE_HTTP_BASE non défini\n');
  }

  if (errors.length) {
    console.error(`smoke-apps-snapshot ${opts.id} — échec\n`);
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  console.log(`✓ smoke-apps-snapshot ${opts.id} OK — ${p0Slots.length} slot(s) P0`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
