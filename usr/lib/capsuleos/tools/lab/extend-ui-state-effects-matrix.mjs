#!/usr/bin/env node
/**
 * Matrice effets d'état UI — shell (8 surfaces) + apps catalogue.
 * Étend validate-window-side-effects vers une matrice JSON vérifiable.
 *
 * Usage:
 *   node usr/lib/capsuleos/tools/lab/extend-ui-state-effects-matrix.mjs --write
 *   node usr/lib/capsuleos/tools/lab/extend-ui-state-effects-matrix.mjs --slot nemo
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SLOT_TEMPLATES, SHELL_TEMPLATES } from './app-interaction-templates.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const OUT = path.join(ROOT, 'root/docs/inventaires/linux-mint-ui-state-effects-matrix.json');

const SHELL_SURFACES = [
  { id: 'mainMenu', script: 'mainMenu.js', effect: 'menu-open-close' },
  { id: 'panel', script: 'taskbar-window-list.js', effect: 'running-link-active-link' },
  { id: 'tray', script: 'mint-tray.js', effect: 'systray-icons' },
  { id: 'clock', script: 'calendar-popover.js', effect: 'popover-open' },
  { id: 'desktop', script: 'desktop-context-menu.js', effect: 'context-menu' },
  { id: 'altTab', script: 'cinnamon-alt-tab.js', effect: 'overlay-switch' },
  { id: 'windowChrome', script: 'cinnamon-window-behaviors.js', effect: 'title-context-menu' },
  { id: 'tiling', script: 'edge-tiling.js', effect: 'edge-snap' },
];

const APP_EFFECTS = {
  nemo: [
    { effect: 'sidebar-navigation', kernel: 'fileExplorerCore.js' },
    { effect: 'path-breadcrumb-toggle', kernel: 'fileExplorerCore.js' },
    { effect: 'menubar-bind', kernel: 'fileExplorerHeader.js', note: 'masqué Mint skin' },
    { effect: 'context-menu', kernel: 'fileExplorerContextMenu.js' },
    { effect: 'search-filter', kernel: 'fileExplorerCore.js' },
  ],
  firefox: [
    { effect: 'tabs-multi', kernel: 'firefoxBrowser.js' },
    { effect: 'bookmarks-toggle', kernel: 'firefoxBrowser.js' },
    { effect: 'newtab-home', kernel: 'firefoxBrowser.js' },
  ],
  text_editor: [
    { effect: 'menus-dropdown', kernel: 'text-editor.js' },
    { effect: 'find-replace-dialogs', kernel: 'text-editor.js' },
    { effect: 'toolbar-actions', kernel: 'text-editor.js' },
    { effect: 'shortcuts', kernel: 'text-editor.js' },
  ],
  calculator: [
    { effect: 'keypad-eval', kernel: 'calculator.js' },
    { effect: 'mode-popover', kernel: 'calculator.js' },
    { effect: 'keyboard-input', kernel: 'calculator.js' },
  ],
  file_roller: [
    { effect: 'empty-open-archive', kernel: 'file-roller.js' },
    { effect: 'headerbar-chrome', kernel: 'file-roller.js' },
    { effect: 'search-kb-shortcut', kernel: 'file-roller.js' },
  ],
  update_manager: [
    { effect: 'welcome-dismiss', kernel: 'update-manager.js' },
    { effect: 'menubar-toolbar', kernel: 'update-manager.js' },
  ],
  themes: [
    { effect: 'panel-router', kernel: 'cinnamon-settings.js' },
    { effect: 'themes-app-embed', kernel: 'cinnamon-settings.js' },
    { effect: 'mint-style-popover', kernel: 'themes.js' },
    { effect: 'theme-preview', kernel: 'themes.js' },
  ],
  baobab: [
    { effect: 'place-switch', kernel: 'baobab.js' },
    { effect: 'ring-preview', kernel: 'baobab.js' },
  ],
  bulky: [
    { effect: 'prefix-preview', kernel: 'bulky.js' },
    { effect: 'rename-batch', kernel: 'bulky.js' },
  ],
  mintinstall: [
    { effect: 'category-nav', kernel: 'mintinstall.js' },
    { effect: 'search-filter', kernel: 'mintinstall.js' },
    { effect: 'install-sim', kernel: 'mintinstall.js' },
  ],
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { write: false, slot: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--write') opts.write = true;
    else if (args[i] === '--slot' && args[i + 1]) opts.slot = args[++i];
  }
  return opts;
};

const buildMatrix = () => {
  const apps = {};
  Object.keys(SLOT_TEMPLATES).forEach((slot) => {
    apps[slot] = {
      label: SLOT_TEMPLATES[slot].label,
      interactions: SLOT_TEMPLATES[slot].checks.length,
      effects: APP_EFFECTS[slot] || [{ effect: 'slot-open', kernel: 'contentLoader.js' }],
      smoke: fs.existsSync(path.join(ROOT, `usr/lib/capsuleos/tools/lab/smoke-mint-${slot.replace(/_/g, '-')}.mjs`))
        ? `smoke-mint-${slot.replace(/_/g, '-')}.mjs`
        : null,
    };
  });

  return {
    version: 1,
    registryId: 'linux-mint',
    generatedAt: new Date().toISOString(),
    shell: SHELL_SURFACES.map((s) => ({
      ...s,
      template: SHELL_TEMPLATES[s.id] || null,
    })),
    apps,
    gates: [
      'validate-window-side-effects.mjs',
      'smoke-mint-interaction.mjs',
      'run-app-parity-pass.mjs',
    ],
  };
};

const main = () => {
  const opts = parseArgs();
  const matrix = buildMatrix();

  if (opts.slot) {
    const entry = matrix.apps[opts.slot];
    console.log(JSON.stringify(entry || { error: 'slot inconnu' }, null, 2));
    process.exit(entry ? 0 : 1);
  }

  if (opts.write) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, `${JSON.stringify(matrix, null, 2)}\n`);
    console.log(`Matrice écrite : ${OUT.replace(`${ROOT}/`, '')}`);
  } else {
    console.log(JSON.stringify({
      shellCount: matrix.shell.length,
      appCount: Object.keys(matrix.apps).length,
      out: OUT.replace(`${ROOT}/`, ''),
    }, null, 2));
  }
};

main();
