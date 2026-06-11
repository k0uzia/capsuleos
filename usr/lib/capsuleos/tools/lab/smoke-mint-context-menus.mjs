#!/usr/bin/env node
/**
 * Smoke Playwright — menus contextuels Cinnamon Mint (tous contextes P0/P1).
 *
 * Usage :
 *   CAPSULE_MINT_URL=http://127.0.0.1:5501/OS/linux/families/debian/mint/index.html \
 *     node usr/lib/capsuleos/tools/lab/smoke-mint-context-menus.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import {
  chromePath,
  MINT_VIEWPORT,
  openMintSlot,
  waitMintReady,
} from './mint-smoke-open.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const MATRIX_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/context-menus.json',
);

const KNOWN_ACTIONS = new Set([
  'open',
  'cut',
  'copy',
  'rename',
  'delete',
  'properties',
  'new-folder',
  'new-document',
  'open-with',
  'paste',
  'trash',
  'restore-trash',
  'delete-forever',
  'open-terminal',
  'select-all',
  'empty-trash',
  'compress',
  'new-document-template',
  'open-with-app',
  'remove-place',
  'minimize',
  'toggle-maximize',
  'close',
  'always-on-top',
  'add-applets',
  'configure-panel',
]);

const readMatrix = () => JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));

const matchExpected = (labels, expected) => {
  const missing = expected.filter((label) => labels.indexOf(label) < 0);
  return { ok: missing.length === 0, missing, labels };
};

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: MINT_VIEWPORT });
await waitMintReady(page);

const matrix = readMatrix();
const results = {};

await page.keyboard.press('Escape');
await page.evaluate(() => {
  const menu = document.getElementById('desktop-context-menu');
  if (menu) {
    menu.hidden = true;
  }
});

await page.mouse.click(640, 400, { button: 'right' });
await page.waitForTimeout(120);
results['desktop.background'] = await page.evaluate(() => {
  const menu = document.getElementById('desktop-context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.desktop-context-menu__item')].map((b) => b.textContent.trim())
    : [];
  return {
    visible: !!(menu && !menu.hidden),
    labels,
    hitId: document.elementFromPoint(640, 400)?.id || '',
  };
});

const desktopCtx = matrix.contexts.find((c) => c.id === 'desktop.background');
const desktopCheck = matchExpected(results['desktop.background'].labels, desktopCtx.expectedLabels);
results['desktop.background'].ok = results['desktop.background'].visible && desktopCheck.ok;
results['desktop.background'].missing = desktopCheck.missing;

results['desktop.icon'] = await page.evaluate((knownActions) => {
  const shortcut = document.querySelector('.desktop-shortcuts .desktop-shortcut[data-desktop-icon="home"]');
  if (!shortcut) {
    return { visible: false, labels: [], noIcon: true };
  }
  const rect = shortcut.getBoundingClientRect();
  shortcut.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  }));
  const menu = document.getElementById('desktop-icon-context-menu');
  const items = menu && !menu.hidden
    ? [...menu.querySelectorAll('[data-desktop-icon-action]')].filter((n) => !n.hidden)
    : [];
  const labels = items.map((n) => n.textContent.trim());
  const actions = items.map((n) => String(n.dataset.desktopIconAction || '').trim()).filter(Boolean);
  const wired = items.every((n) => {
    const action = String(n.dataset.desktopIconAction || '').trim();
    return action.length > 0 && knownActions.indexOf(action) >= 0;
  });
  return {
    visible: !!(menu && !menu.hidden),
    labels,
    actions,
    wired,
  };
}, [...KNOWN_ACTIONS]);

const desktopIconCtx = matrix.contexts.find((c) => c.id === 'desktop.icon');
if (!results['desktop.icon'].noIcon) {
  const desktopIconCheck = matchExpected(results['desktop.icon'].labels, desktopIconCtx.expectedLabels);
  results['desktop.icon'].ok = results['desktop.icon'].visible
    && results['desktop.icon'].wired
    && desktopIconCheck.ok;
  results['desktop.icon'].missing = desktopIconCheck.missing;
} else {
  results['desktop.icon'].ok = false;
  results['desktop.icon'].missing = ['no desktop icon shortcut'];
}

await page.keyboard.press('Escape');
await openMintSlot(page, 'nemo');
await page.waitForSelector('div[data-link="nemo"]', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(220);

results['nemo.list.background'] = await page.evaluate((knownActions) => {
  const win = document.querySelector('div[data-link="nemo"]');
  const content = win?.querySelector('.nemoElement');
  content?.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 420,
    clientY: 300,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const items = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden]) > .nemo-app__context-item')]
    : [];
  const labels = items.map((n) => n.textContent.trim());
  const actions = items.map((n) => String(n.dataset.nemoCtxAction || '').trim()).filter(Boolean);
  const wired = items.every((n) => {
    const action = String(n.dataset.nemoCtxAction || '').trim();
    return action.length > 0 && knownActions.indexOf(action) >= 0;
  });
  return {
    bound: win?.dataset?.nemoContextMenuInit === 'true',
    visible: !!(menu && !menu.hidden),
    labels,
    actions,
    wired,
  };
}, [...KNOWN_ACTIONS]);

const nemoBgCtx = matrix.contexts.find((c) => c.id === 'nemo.list.background');
const nemoBgCheck = matchExpected(results['nemo.list.background'].labels, nemoBgCtx.expectedLabels);
results['nemo.list.background'].ok = results['nemo.list.background'].visible
  && results['nemo.list.background'].bound
  && results['nemo.list.background'].wired
  && nemoBgCheck.ok;
results['nemo.list.background'].missing = nemoBgCheck.missing;

const nemoDocSubCtx = nemoBgCtx.submenus && nemoBgCtx.submenus['new-document'];
if (nemoDocSubCtx) {
  results['nemo.list.background.submenu'] = await page.evaluate((expectedLabels) => {
    const win = document.querySelector('div[data-link="nemo"]');
    const content = win?.querySelector('.nemoElement');
    content?.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 420,
      clientY: 300,
    }));
    const menu = win?.querySelector('.nemo-app__context-menu');
    const docBtn = menu
      ? [...menu.querySelectorAll('.nemo-app__context-item')].find((node) => (
        node.dataset.nemoCtxAction === 'new-document'
      ))
      : null;
    if (!docBtn) {
      return { visible: false, labels: [], reason: 'no-new-document-item' };
    }
    docBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const sub = docBtn.closest('.nemo-app__context-row')?.querySelector('.nemo-app__context-submenu');
    const labels = sub && !sub.hidden
      ? [...sub.querySelectorAll('.nemo-app__context-item')].map((node) => node.textContent.trim())
      : [];
    const missing = expectedLabels.filter((label) => labels.indexOf(label) < 0);
    return {
      visible: !!(sub && !sub.hidden),
      labels,
      missing,
      flipLeft: !!(sub && sub.classList.contains('nemo-app__context-submenu--flip-left')),
    };
  }, nemoDocSubCtx);
  const docSubCheck = matchExpected(
    results['nemo.list.background.submenu'].labels || [],
    nemoDocSubCtx,
  );
  results['nemo.list.background.submenu'].ok = results['nemo.list.background.submenu'].visible
    && docSubCheck.ok;
  results['nemo.list.background.submenu'].missing = docSubCheck.missing;

  const beforeDocCount = await page.evaluate(() => {
    const win = document.querySelector('div[data-link="nemo"]');
    return win ? win.querySelectorAll('.nemoElement a[data-item-name]').length : 0;
  });
  await page.evaluate(() => {
    const win = document.querySelector('div[data-link="nemo"]');
    const menu = win?.querySelector('.nemo-app__context-menu');
    const docBtn = menu
      ? [...menu.querySelectorAll('.nemo-app__context-item')].find((node) => (
        node.dataset.nemoCtxAction === 'new-document'
      ))
      : null;
    const subBtn = docBtn?.closest('.nemo-app__context-row')
      ?.querySelector('.nemo-app__context-submenu [data-nemo-ctx-action="new-document-template"]');
    subBtn?.click();
  });
  await page.waitForTimeout(160);
  results['nemo.list.background.submenu'].createsFile = await page.evaluate((beforeCount) => {
    const win = document.querySelector('div[data-link="nemo"]');
    const afterCount = win ? win.querySelectorAll('.nemoElement a[data-item-name]').length : 0;
    const created = [...(win?.querySelectorAll('.nemoElement a[data-item-name]') || [])]
      .some((node) => /^Nouveau document/.test(node.dataset.itemName || ''));
    return { beforeCount, afterCount, created, grew: afterCount > beforeCount };
  }, beforeDocCount);
  results['nemo.list.background.submenu'].ok = results['nemo.list.background.submenu'].ok
    && results['nemo.list.background.submenu'].createsFile.created;
}

await page.keyboard.press('Escape');
await page.waitForTimeout(80);

await page.click('div[data-link="nemo"] #voletnemo a[data-link="Documents"]');
await page.waitForTimeout(160);

results['nemo.list.file'] = await page.evaluate((knownActions) => {
  const win = document.querySelector('div[data-link="nemo"]');
  const links = win ? [...win.querySelectorAll('.nemoElement a[data-item-name]')] : [];
  const link = links.find((node) => node.dataset.itemName === 'introduction-bash.txt')
    || links.find((node) => node.dataset.itemType !== 'folder')
    || links[0];
  if (!link) {
    return { visible: false, labels: [], noItem: true };
  }
  link.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 300,
    clientY: 250,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const items = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden]) > .nemo-app__context-item')]
    : [];
  const labels = items.map((n) => n.textContent.trim());
  const actions = items.map((n) => String(n.dataset.nemoCtxAction || '').trim()).filter(Boolean);
  const wired = items.every((n) => {
    const action = String(n.dataset.nemoCtxAction || '').trim();
    return action.length > 0 && knownActions.indexOf(action) >= 0;
  });
  return {
    item: link.dataset.itemName,
    itemType: link.dataset.itemType,
    visible: !!(menu && !menu.hidden),
    labels,
    actions,
    wired,
  };
}, [...KNOWN_ACTIONS]);

const nemoFileCtx = matrix.contexts.find((c) => c.id === 'nemo.list.file');
if (!results['nemo.list.file'].noItem) {
  const nemoFileCheck = matchExpected(results['nemo.list.file'].labels, nemoFileCtx.expectedLabels);
  results['nemo.list.file'].ok = results['nemo.list.file'].visible
    && results['nemo.list.file'].wired
    && nemoFileCheck.ok;
  results['nemo.list.file'].missing = nemoFileCheck.missing;
  if (nemoFileCtx.vmExtraLabels) {
    const extraCheck = matchExpected(results['nemo.list.file'].labels, nemoFileCtx.vmExtraLabels);
    results['nemo.list.file'].p2Missing = extraCheck.missing;
  }
} else {
  results['nemo.list.file'].ok = false;
  results['nemo.list.file'].missing = ['no file item in Documents'];
}

const nemoOpenWithSubCtx = nemoFileCtx.submenus && nemoFileCtx.submenus['open-with'];
if (!results['nemo.list.file'].noItem && nemoOpenWithSubCtx) {
  results['nemo.list.file.submenu'] = await page.evaluate((expectedLabels) => {
    const win = document.querySelector('div[data-link="nemo"]');
    const links = win ? [...win.querySelectorAll('.nemoElement a[data-item-name]')] : [];
    const link = links.find((node) => node.dataset.itemName === 'introduction-bash.txt')
      || links.find((node) => node.dataset.itemType !== 'folder')
      || links[0];
    link?.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 300,
      clientY: 250,
    }));
    const menu = win?.querySelector('.nemo-app__context-menu');
    const openWithBtn = menu
      ? [...menu.querySelectorAll('.nemo-app__context-item')].find((node) => (
        node.dataset.nemoCtxAction === 'open-with'
      ))
      : null;
    if (!openWithBtn) {
      return { visible: false, labels: [], reason: 'no-open-with-item' };
    }
    openWithBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const sub = openWithBtn.closest('.nemo-app__context-row')?.querySelector('.nemo-app__context-submenu');
    const labels = sub && !sub.hidden
      ? [...sub.querySelectorAll('.nemo-app__context-item')].map((node) => node.textContent.trim())
      : [];
    const actions = sub && !sub.hidden
      ? [...sub.querySelectorAll('.nemo-app__context-item')].map((node) => (
        String(node.dataset.nemoCtxAction || '').trim()
      ))
      : [];
    return {
      visible: !!(sub && !sub.hidden),
      labels,
      actions,
      missing: expectedLabels.filter((label) => labels.indexOf(label) < 0),
      flipLeft: !!(sub && sub.classList.contains('nemo-app__context-submenu--flip-left')),
    };
  }, nemoOpenWithSubCtx);
  const openWithSubCheck = matchExpected(
    results['nemo.list.file.submenu'].labels || [],
    nemoOpenWithSubCtx,
  );
  results['nemo.list.file.submenu'].ok = results['nemo.list.file.submenu'].visible
    && openWithSubCheck.ok
    && (results['nemo.list.file.submenu'].actions || []).every((action) => (
      action === 'open-with-app'
    ));
  results['nemo.list.file.submenu'].missing = openWithSubCheck.missing;

  await page.evaluate(() => {
    const win = document.querySelector('div[data-link="nemo"]');
    const menu = win?.querySelector('.nemo-app__context-menu');
    const openWithBtn = menu
      ? [...menu.querySelectorAll('.nemo-app__context-item')].find((node) => (
        node.dataset.nemoCtxAction === 'open-with'
      ))
      : null;
    const subBtn = openWithBtn?.closest('.nemo-app__context-row')
      ?.querySelector('.nemo-app__context-submenu [data-nemo-ctx-app-id="text_editor"]');
    subBtn?.click();
  });
  await page.waitForTimeout(180);
  results['nemo.list.file.submenu'].opensEditor = await page.evaluate(() => {
    const editor = document.querySelector('div[data-link="text_editor"]');
    return {
      visible: !!(editor && editor.style.display !== 'none'),
      init: document.getElementById('textEditorApp')?.dataset?.textEditorInit === 'true',
    };
  });
  results['nemo.list.file.submenu'].ok = results['nemo.list.file.submenu'].ok
    && results['nemo.list.file.submenu'].opensEditor.visible;
}

await page.evaluate(() => {
  ['text_editor', 'visionneur_pdf', 'visionneur_images', 'lecteur_multimedia'].forEach((slot) => {
    const win = document.querySelector(`div[data-link="${slot}"]`);
    if (win) {
      win.style.display = 'none';
      win.classList.remove('windowElementActive');
    }
  });
  const nemo = document.querySelector('div[data-link="nemo"]');
  if (nemo) {
    nemo.classList.add('windowElementActive');
    nemo.style.display = 'block';
  }
});
await page.keyboard.press('Escape');
await page.waitForTimeout(80);

results['nemo.sidebar.place'] = await page.evaluate((knownActions) => {
  const win = document.querySelector('div[data-link="nemo"]');
  const link = win?.querySelector('#voletnemo a.places-item[data-link="Documents"]');
  if (!link) {
    return { visible: false, labels: [], noPlace: true };
  }
  const rect = link.getBoundingClientRect();
  link.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const items = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden]) > .nemo-app__context-item')]
    : [];
  const labels = items.map((n) => n.textContent.trim());
  const actions = items.map((n) => String(n.dataset.nemoCtxAction || '').trim()).filter(Boolean);
  const wired = items.every((n) => {
    const action = String(n.dataset.nemoCtxAction || '').trim();
    return action.length > 0 && knownActions.indexOf(action) >= 0;
  });
  return { visible: !!(menu && !menu.hidden), labels, actions, wired };
}, [...KNOWN_ACTIONS]);

const sidebarPlaceCtx = matrix.contexts.find((c) => c.id === 'nemo.sidebar.place');
if (!results['nemo.sidebar.place'].noPlace) {
  const sidebarPlaceCheck = matchExpected(results['nemo.sidebar.place'].labels, sidebarPlaceCtx.expectedLabels);
  results['nemo.sidebar.place'].ok = results['nemo.sidebar.place'].visible
    && results['nemo.sidebar.place'].wired
    && sidebarPlaceCheck.ok;
  results['nemo.sidebar.place'].missing = sidebarPlaceCheck.missing;
} else {
  results['nemo.sidebar.place'].ok = true;
  results['nemo.sidebar.place'].skipped = true;
}

await page.keyboard.press('Escape');
await page.waitForTimeout(80);

results['nemo.list.folder'] = await page.evaluate((knownActions) => {
  const win = document.querySelector('div[data-link="nemo"]');
  const link = win?.querySelector('.nemoElement a[data-item-type="folder"]');
  if (!link) {
    return { visible: false, labels: [], noFolder: true };
  }
  link.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 320,
    clientY: 260,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const items = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden]) > .nemo-app__context-item')]
    : [];
  const labels = items.map((n) => n.textContent.trim());
  const actions = items.map((n) => String(n.dataset.nemoCtxAction || '').trim()).filter(Boolean);
  const wired = items.every((n) => {
    const action = String(n.dataset.nemoCtxAction || '').trim();
    return action.length > 0 && knownActions.indexOf(action) >= 0;
  });
  return {
    item: link.dataset.itemName,
    visible: !!(menu && !menu.hidden),
    labels,
    actions,
    wired,
  };
}, [...KNOWN_ACTIONS]);

const nemoFolderCtx = matrix.contexts.find((c) => c.id === 'nemo.list.folder');
if (!results['nemo.list.folder'].noFolder) {
  const nemoFolderCheck = matchExpected(results['nemo.list.folder'].labels, nemoFolderCtx.expectedLabels);
  results['nemo.list.folder'].ok = results['nemo.list.folder'].visible
    && results['nemo.list.folder'].wired
    && nemoFolderCheck.ok;
  results['nemo.list.folder'].missing = nemoFolderCheck.missing;
} else {
  results['nemo.list.folder'].ok = true;
  results['nemo.list.folder'].skipped = true;
}

await page.keyboard.press('Escape');
await page.waitForTimeout(80);

results['nemo.sidebar.trash'] = await page.evaluate((knownActions) => {
  const win = document.querySelector('div[data-link="nemo"]');
  const link = win?.querySelector('#voletnemo a[data-link="Corbeille"]');
  link?.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 60,
    clientY: 210,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const items = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden]) > .nemo-app__context-item')]
    : [];
  const labels = items.map((n) => n.textContent.trim());
  const wired = items.every((n) => {
    const action = String(n.dataset.nemoCtxAction || '').trim();
    return action.length > 0 && knownActions.indexOf(action) >= 0;
  });
  return {
    visible: !!(menu && !menu.hidden),
    labels,
    wired,
  };
}, [...KNOWN_ACTIONS]);

const sidebarTrashCtx = matrix.contexts.find((c) => c.id === 'nemo.sidebar.trash');
const sidebarTrashCheck = matchExpected(
  results['nemo.sidebar.trash'].labels,
  sidebarTrashCtx.expectedLabels,
);
results['nemo.sidebar.trash'].ok = results['nemo.sidebar.trash'].visible
  && results['nemo.sidebar.trash'].wired
  && sidebarTrashCheck.ok;
results['nemo.sidebar.trash'].missing = sidebarTrashCheck.missing;

await page.click('div[data-link="nemo"] #voletnemo a[data-link="Corbeille"]');
await page.waitForTimeout(200);

results['nemo.trash.background'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const content = win?.querySelector('.nemoElement');
  content?.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 400,
    clientY: 280,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden]) > .nemo-app__context-item')].map((n) => n.textContent.trim())
    : [];
  return {
    path: typeof window.getExplorerCurrentPath === 'function'
      ? window.getExplorerCurrentPath('nemo')
      : '',
    visible: !!(menu && !menu.hidden),
    labels,
  };
});

const trashBgCtx = matrix.contexts.find((c) => c.id === 'nemo.trash.background');
const trashBgCheck = matchExpected(results['nemo.trash.background'].labels, trashBgCtx.expectedLabels);
results['nemo.trash.background'].ok = results['nemo.trash.background'].visible && trashBgCheck.ok;
results['nemo.trash.background'].missing = trashBgCheck.missing;

results['nemo.trash.item'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const link = win?.querySelector('.nemoElement a[data-item-name]');
  if (!link) {
    return { visible: false, labels: [], emptyTrash: true };
  }
  link.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 280,
    clientY: 240,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden]) > .nemo-app__context-item')].map((n) => n.textContent.trim())
    : [];
  return {
    item: link.dataset.itemName,
    visible: !!(menu && !menu.hidden),
    labels,
    emptyTrash: false,
  };
});

const trashItemCtx = matrix.contexts.find((c) => c.id === 'nemo.trash.item');
if (!results['nemo.trash.item'].emptyTrash) {
  const trashItemCheck = matchExpected(results['nemo.trash.item'].labels, trashItemCtx.expectedLabels);
  results['nemo.trash.item'].ok = results['nemo.trash.item'].visible && trashItemCheck.ok;
  results['nemo.trash.item'].missing = trashItemCheck.missing;
} else {
  results['nemo.trash.item'].ok = true;
  results['nemo.trash.item'].skipped = true;
}

await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  if (win && win.style.display === 'none') {
    const btn = document.querySelector(
      '#taskbar-window-list .taskbar-window-list__btn[data-window-link="nemo"]',
    );
    if (btn) {
      btn.click();
    } else if (typeof window.openWindowByDataLink === 'function') {
      window.openWindowByDataLink('nemo');
    }
  }
});
await page.waitForFunction(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  return win && win.style.display !== 'none' && !!win.querySelector(':scope > #windowHeader');
}, null, { timeout: 8000 });
await page.waitForTimeout(120);

const headerBox = await page.locator('div[data-link="nemo"] > #windowHeader').boundingBox();
if (headerBox) {
  await page.mouse.click(
    headerBox.x + Math.min(120, headerBox.width * 0.35),
    headerBox.y + headerBox.height / 2,
    { button: 'right' },
  );
}
await page.waitForTimeout(120);

results['window.title'] = await page.evaluate((knownActions) => {
  const win = document.querySelector('div[data-link="nemo"]');
  const menu = document.getElementById('muffin-window-context-menu');
  const menuOpen = !!(menu && !menu.hasAttribute('hidden'));
  const items = menuOpen
    ? [...menu.querySelectorAll('[data-muffin-ctx-action]')].filter((n) => !n.hidden)
    : [];
  const labels = items.map((n) => n.textContent.trim());
  const actions = items.map((n) => String(n.dataset.muffinCtxAction || '').trim()).filter(Boolean);
  const wired = items.length > 0 && items.every((n) => {
    const action = String(n.dataset.muffinCtxAction || '').trim();
    return action.length > 0 && knownActions.indexOf(action) >= 0;
  });
  return {
    init: document.body.dataset.capsuleMuffinWindowCtxInit === 'true',
    toolkit: win?.dataset?.windowChromeToolkit || '',
    visible: menuOpen,
    labels,
    actions,
    wired,
    hasHeader: !!win?.querySelector(':scope > #windowHeader'),
    visibleBefore: !!(win && win.style.display !== 'none'),
  };
}, [...KNOWN_ACTIONS]);

await page.click('#muffin-window-context-menu [data-muffin-ctx-action="minimize"]', { force: true }).catch(() => {});
await page.waitForFunction(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  return win && win.style.display === 'none';
}, null, { timeout: 3000 }).catch(() => {});
results['window.title'].minimizeWorks = results['window.title'].visibleBefore
  && (await page.evaluate(() => {
    const win = document.querySelector('div[data-link="nemo"]');
    return !!(win && win.style.display === 'none');
  }));

const windowTitleCtx = matrix.contexts.find((c) => c.id === 'window.title');
const windowTitleCheck = matchExpected(results['window.title'].labels, windowTitleCtx.expectedLabels);
results['window.title'].ok = results['window.title'].visible
  && results['window.title'].init
  && results['window.title'].wired
  && results['window.title'].toolkit === 'cinnamon'
  && windowTitleCheck.ok
  && results['window.title'].minimizeWorks;
results['window.title'].missing = windowTitleCheck.missing;

await page.keyboard.press('Escape');
await page.waitForTimeout(80);

const panelHit = await page.evaluate(() => {
  const el = document.elementFromPoint(520, 785);
  return {
    hitTag: el?.tagName || '',
    hitPanel: !!el?.closest('#tableau.mint-panel'),
  };
});

await page.mouse.click(520, 785, { button: 'right' });
await page.waitForTimeout(120);

results['panel.background'] = await page.evaluate((knownActions) => {
  const menu = document.getElementById('mint-panel-context-menu');
  const menuOpen = !!(menu && !menu.hidden);
  const items = menuOpen
    ? [...menu.querySelectorAll('[data-mint-panel-action]')].filter((n) => !n.hidden)
    : [];
  const labels = items.map((n) => n.textContent.trim());
  const actions = items.map((n) => String(n.dataset.mintPanelAction || '').trim()).filter(Boolean);
  const wired = items.length > 0 && items.every((n) => {
    const action = String(n.dataset.mintPanelAction || '').trim();
    return action.length > 0 && knownActions.indexOf(action) >= 0;
  });
  return {
    init: document.body.dataset.capsuleMintPanelCtxInit === 'true',
    visible: menuOpen,
    labels,
    actions,
    wired,
  };
}, [...KNOWN_ACTIONS]);
results['panel.background'].hitTag = panelHit.hitTag;
results['panel.background'].hitPanel = panelHit.hitPanel;

const panelBgCtx = matrix.contexts.find((c) => c.id === 'panel.background');
const panelBgCheck = matchExpected(results['panel.background'].labels, panelBgCtx.expectedLabels);
results['panel.background'].ok = results['panel.background'].visible
  && results['panel.background'].init
  && results['panel.background'].wired
  && results['panel.background'].hitPanel
  && panelBgCheck.ok;
results['panel.background'].missing = panelBgCheck.missing;

await page.click('#mint-panel-context-menu [data-mint-panel-action="configure-panel"]', { force: true }).catch(() => {});
await page.waitForTimeout(200);
results['panel.background'].configureOpensThemes = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="themes"]');
  const app = document.getElementById('cinnamonSettingsApp');
  return {
    themesVisible: !!(win && win.style.display !== 'none'),
    panelActive: app?.dataset?.csActivePanel === 'panel',
  };
});
results['panel.background'].ok = results['panel.background'].ok
  && results['panel.background'].configureOpensThemes.themesVisible
  && results['panel.background'].configureOpensThemes.panelActive;

await page.keyboard.press('Escape');
await page.waitForTimeout(80);

await page.evaluate(() => {
  const nemo = document.querySelector('div[data-link="nemo"]');
  if (nemo && nemo.style.display === 'none' && typeof window.openWindowByDataLink === 'function') {
    window.openWindowByDataLink('nemo');
  }
  ['themes'].forEach((slot) => {
    const win = document.querySelector(`div[data-link="${slot}"]`);
    if (win) win.style.display = 'none';
  });
});
await page.waitForTimeout(120);

results['nemo.pathbar'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const bar = win?.querySelector('.nemo-pathbar, #nemo-path-label');
  if (!bar) return { visible: false, labels: [], noPathbar: true };
  const rect = bar.getBoundingClientRect();
  bar.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden]) > .nemo-app__context-item')].map((n) => n.textContent.trim())
    : [];
  return { visible: !!(menu && !menu.hidden), labels };
});
const pathbarCtx = { expectedLabels: ['Créer un nouveau dossier', 'Créer un nouveau document', 'Coller', 'Ouvrir dans un terminal', 'Tout sélectionner', 'Propriétés'] };
const pathbarCheck = matchExpected(results['nemo.pathbar'].labels, pathbarCtx.expectedLabels);
results['nemo.pathbar'].ok = results['nemo.pathbar'].visible && pathbarCheck.ok;
results['nemo.pathbar'].missing = pathbarCheck.missing;

await page.keyboard.press('Escape');
await page.click('div[data-link="nemo"] #voletnemo a[data-link="Documents"]');
await page.waitForTimeout(140);
await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const grid = win?.querySelector('.nemoElement');
  const names = ['introduction-bash.txt', 'Bash.pdf'];
  grid?.querySelectorAll('.nemo-app__item--selected').forEach((el) => el.classList.remove('nemo-app__item--selected'));
  names.forEach((name) => {
    grid?.querySelector(`a[data-item-name="${name}"]`)?.classList.add('nemo-app__item--selected');
  });
});
await page.waitForTimeout(80);

results['nemo.list.multi'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const content = win?.querySelector('.nemoElement');
  content?.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, clientX: 300, clientY: 250,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const labels = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden]) > .nemo-app__context-item')].map((n) => n.textContent.trim())
    : [];
  const hasOpenWith = labels.indexOf('Ouvrir avec…') >= 0;
  return { visible: !!(menu && !menu.hidden), labels, hasOpenWith };
});
const multiCtx = matrix.contexts.find((c) => c.id === 'nemo.list.multi');
const multiCheck = matchExpected(results['nemo.list.multi'].labels, multiCtx?.expectedLabels || []);
results['nemo.list.multi'].ok = results['nemo.list.multi'].visible
  && !results['nemo.list.multi'].hasOpenWith
  && multiCheck.ok;
results['nemo.list.multi'].missing = multiCheck.missing;

await page.keyboard.press('Escape');
await page.click('div[data-link="nemo"] #voletnemo a[data-link="Corbeille"]');
await page.waitForTimeout(200);
await page.evaluate(async () => {
  if (typeof window.emptyNautilusTrash === 'function') {
    await window.emptyNautilusTrash();
  }
});
await page.waitForTimeout(120);

results['nemo.empty-trash-disabled'] = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const link = win?.querySelector('#voletnemo a[data-link="Corbeille"]');
  const rect = link?.getBoundingClientRect();
  link?.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true,
    clientX: rect ? rect.left + rect.width / 2 : 60,
    clientY: rect ? rect.top + rect.height / 2 : 210,
  }));
  const menu = win?.querySelector('.nemo-app__context-menu');
  const btn = menu ? [...menu.querySelectorAll('.nemo-app__context-item')].find((n) => n.dataset.nemoCtxAction === 'empty-trash') : null;
  return {
    visible: !!(menu && !menu.hidden),
    labels: btn ? [btn.textContent.trim()] : [],
    emptyTrashDisabled: !!(btn && btn.disabled),
  };
});
results['nemo.empty-trash-disabled'].ok = results['nemo.empty-trash-disabled'].visible
  && results['nemo.empty-trash-disabled'].emptyTrashDisabled;

await page.keyboard.press('Escape');
await page.waitForTimeout(80);

const smokeIds = [
  'desktop.background',
  'desktop.icon',
  'nemo.list.background',
  'nemo.list.background.submenu',
  'nemo.list.file',
  'nemo.list.file.submenu',
  'nemo.list.folder',
  'nemo.sidebar.place',
  'nemo.sidebar.trash',
  'nemo.trash.background',
  'nemo.trash.item',
  'nemo.pathbar',
  'nemo.list.multi',
  'nemo.empty-trash-disabled',
  'window.title',
  'panel.background',
];
const ok = smokeIds.every((id) => results[id] && results[id].ok !== false);

console.log(JSON.stringify({ matrix: MATRIX_PATH.replace(`${ROOT}/`, ''), results, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
