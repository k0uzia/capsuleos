#!/usr/bin/env node
import { chromium } from 'playwright';

const URL = process.env.CAPSULE_MINT_URL || 'http://127.0.0.1:5500/home/Debian/Mint/index.html';
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });

await page.click('footer nav a[data-link="nemo"]');
await page.waitForSelector('div[data-link="nemo"]', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(900);

const home = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  return {
    title: win?.querySelector('#windowTitle')?.textContent,
    path: typeof window.getExplorerCurrentPath === 'function' ? window.getExplorerCurrentPath('nemo') : '',
    sidebarReady: win?.dataset.nemoSidebarDelegation === 'true',
    navReady: win?.dataset.nemoNavDelegationInit === 'true',
    chromeToolkit: win?.getAttribute('data-window-chrome-toolkit'),
    chromeProvider: win?.getAttribute('data-window-chrome-provider'),
    dragOnHeader: !!win?.querySelector('#windowHeader[data-window-drag-handle]'),
  };
});

await page.click('div[data-link="nemo"] #voletnemo a[data-link="Documents"]');
await page.waitForTimeout(500);

const docs = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  return {
    title: win?.querySelector('#windowTitle')?.textContent,
    path: window.getExplorerCurrentPath('nemo'),
    active: !!win?.querySelector('#voletnemo a[data-link="Documents"].nemo-sidebar__link--active'),
  };
});

await page.click('div[data-link="nemo"] #voletnemo a[data-nemo-bookmark="true"]');
await page.waitForTimeout(400);

const bookmark = await page.evaluate(() => ({
  title: document.querySelector('div[data-link="nemo"] #windowTitle')?.textContent,
  path: window.getExplorerCurrentPath('nemo'),
}));

await page.click('div[data-link="nemo"] #voletnemo a[data-link="Corbeille"]');
await page.waitForTimeout(400);

const trash = await page.evaluate(() => ({
  title: document.querySelector('div[data-link="nemo"] #windowTitle')?.textContent,
  empty: document.querySelector('div[data-link="nemo"] .nemo-app__empty')?.textContent,
}));

await page.click('div[data-link="nemo"] #precedent');
await page.waitForTimeout(400);

const back = await page.evaluate(() => ({
  title: document.querySelector('div[data-link="nemo"] #windowTitle')?.textContent,
  path: window.getExplorerCurrentPath('nemo'),
}));

await page.click('div[data-link="nemo"] .nemo-app__toolbar-group--view a img[src*="view-grid"]');
await page.waitForTimeout(350);

const iconsView = await page.evaluate(() => {
  const grid = document.querySelector('div[data-link="nemo"] .nemoElement');
  return {
    icons: grid?.classList.contains('nemo-app__content-grid--icons'),
    list: grid?.classList.contains('nemo-app__content-grid--list'),
  };
});

await page.click('div[data-link="nemo"] .nemo-app__toolbar-group--view a img[src*="view-list"]');
await page.waitForTimeout(350);

const listView = await page.evaluate(() => {
  const grid = document.querySelector('div[data-link="nemo"] .nemoElement');
  return {
    list: grid?.classList.contains('nemo-app__content-grid--list'),
    headerHidden: document.querySelector('div[data-link="nemo"] .nemo-app__list-header')?.hasAttribute('hidden'),
  };
});

await page.click('div[data-link="nemo"] #nemo-search');
await page.waitForTimeout(200);

const searchUi = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const wrap = win?.querySelector('#nemo-search-wrap');
  const input = win?.querySelector('#nemo-search-input');
  const pathGroup = wrap?.closest('.nemo-app__toolbar-group--path');
  return {
    wrapVisible: wrap ? !wrap.hidden : false,
    hasInput: !!input,
    inPathGroup: !!(wrap && pathGroup && pathGroup.contains(wrap)),
    expanded: win?.querySelector('#nemo-search')?.getAttribute('aria-expanded') === 'true',
  };
});

await page.click('div[data-link="nemo"] #voletnemo a[data-link="Système de fichiers"]');
await page.waitForTimeout(500);

const vfsRoot = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const links = [...(win?.querySelectorAll('.nemoElement a[data-item-name]') || [])];
  const names = links.map((a) => a.getAttribute('data-item-name'));
  const icons = links.map((a) => a.querySelector('img')?.getAttribute('src') || '');
  return {
    pathLabel: win?.querySelector('#nemo-path-label')?.textContent || '',
    path: window.getExplorerCurrentPath('nemo'),
    names,
    hasBin: names.indexOf('bin') >= 0,
    hasHome: names.indexOf('home') >= 0,
    allFolderIcons: icons.length > 0 && icons.every((src) => src.indexOf('folder') >= 0),
  };
});

const sidebarIcons = await page.evaluate(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const pick = (label) => {
    const link = win?.querySelector(`#voletnemo a[data-link="${label}"]`);
    const img = link?.querySelector('img');
    if (!img) {
      return { found: false, filter: '', src: '' };
    }
    return {
      found: true,
      filter: getComputedStyle(img).filter || 'none',
      src: img.getAttribute('src') || '',
    };
  };
  return {
    recent: pick('Récent'),
    filesystem: pick('Système de fichiers'),
    documents: pick('Documents'),
  };
});

await page.click('div[data-link="nemo"] #voletnemo a[data-link="Récent"]');
await page.waitForTimeout(400);

const recentView = await page.evaluate(() => {
  const grid = document.querySelector('div[data-link="nemo"] .nemoElement');
  const imgs = [...(grid?.querySelectorAll('a > img') || [])].map((img) => img.getAttribute('src') || '');
  return {
    hasItems: imgs.length > 0,
    iconSrc: imgs[0] || '',
    hasMimeIcon: imgs.some((src) => src.indexOf('mimeTypes') >= 0),
    allFolderSvg: imgs.length > 0 && imgs.every((src) => src.indexOf('folder.svg') >= 0),
  };
});

await page.click('div[data-link="nemo"] #home');
await page.waitForTimeout(400);

const homeFolders = await page.evaluate(() => {
  const grid = document.querySelector('div[data-link="nemo"] .nemoElement');
  const docs = grid?.querySelector('a[data-item-name="Documents"] > img');
  const bureau = grid?.querySelector('a[data-item-name="Bureau"] > img');
  return {
    documentsIcon: docs?.getAttribute('src') || '',
    bureauIcon: bureau?.getAttribute('src') || '',
    documentsOk: (docs?.getAttribute('src') || '').indexOf('folder-documents') >= 0,
    bureauOk: (bureau?.getAttribute('src') || '').indexOf('user-desktop') >= 0
      || (bureau?.getAttribute('src') || '').indexOf('folder') >= 0,
    noSymbolicEmblem: (docs?.getAttribute('src') || '').indexOf('symbolic') < 0,
  };
});

if (searchUi.hasInput) {
  await page.fill('div[data-link="nemo"] #nemo-search-input', 'doc');
  await page.waitForTimeout(400);
}

const searchFilter = await page.evaluate(() => ({
  query: window.fileExplorerState?.searchQuery || '',
  itemCount: document.querySelectorAll('div[data-link="nemo"] .nemoElement > a').length,
}));

await page.evaluate(() => {
  if (window.fileExplorerState) {
    window.fileExplorerState.searchQuery = '';
  }
  const input = document.querySelector('div[data-link="nemo"] #nemo-search-input');
  if (input) {
    input.value = '';
  }
  const toggle = document.querySelector('div[data-link="nemo"] .nemo-app__search-toggle');
  if (toggle && toggle.getAttribute('aria-pressed') === 'true' && typeof toggle.click === 'function') {
    toggle.click();
  }
});
await page.click('div[data-link="nemo"] #voletnemo a[data-link="Documents"]');
await page.waitForTimeout(600);
const txtSelector = 'div[data-link="nemo"] .nemoElement a[data-item-name="introduction-bash.txt"]';
if (await page.$(txtSelector)) {
  await page.click(txtSelector);
  await page.waitForTimeout(1200);
}

const xedFromNemo = await page.evaluate(() => {
  const xedWin = document.querySelector('div[data-link="text_editor"]');
  const area = document.getElementById('xed-area');
  return {
    visible: !!(xedWin && xedWin.style.display !== 'none'),
    title: xedWin?.querySelector('#windowTitle')?.textContent || '',
    hasContent: !!(area && area.value && area.value.length > 8),
    targetBlank: document.querySelector(
      'div[data-link="nemo"] .nemoElement a[data-item-name="introduction-bash.txt"]'
    )?.target === '_blank',
  };
});

const pathNavigationMode = await page.evaluate(() => {
  const toggleBtn = document.getElementById('nemo-toggle-path-mode');
  const pathLabel = document.getElementById('nemo-path-label');
  if (!toggleBtn || !pathLabel) {
    return { ok: false, reason: 'missing-path-controls' };
  }
  const labelMode = !pathLabel.classList.contains('nemo-app__path-breadcrumb');
  toggleBtn.click();
  const breadcrumbOn = pathLabel.classList.contains('nemo-app__path-breadcrumb')
    && pathLabel.querySelectorAll('.nemo-app__path-crumb').length > 0
    && toggleBtn.getAttribute('aria-pressed') === 'true';
  toggleBtn.click();
  const labelRestored = !pathLabel.classList.contains('nemo-app__path-breadcrumb')
    && toggleBtn.getAttribute('aria-pressed') === 'false';
  return {
    ok: labelMode && breadcrumbOn && labelRestored,
    labelMode,
    breadcrumbOn,
    labelRestored,
  };
});

const footerSidebar = await page.evaluate(() => {
  const root = document.querySelector('div[data-link="nemo"]');
  const sidebar = document.querySelector('#voletnemo');
  const placesBtn = document.querySelector('[data-nemo-sidebar-mode="places"]');
  const treeBtn = document.querySelector('[data-nemo-sidebar-mode="tree"]');
  const toggleBtn = document.getElementById('nemo-toggle-sidebar');
  if (!placesBtn || !treeBtn || !toggleBtn || !sidebar) {
    return { ok: false, reason: 'missing-controls' };
  }
  placesBtn.click();
  const placesView = sidebar.getAttribute('data-sidebar-view');
  const placesVisible = !sidebar.classList.contains('is-sidebar-hidden');
  treeBtn.click();
  const treeView = sidebar.getAttribute('data-sidebar-view');
  const treePanel = document.getElementById('nemo-sidebar-tree');
  const treeVisible = treePanel && !treePanel.hidden;
  const sectionsHiddenInTree = Array.from(sidebar.querySelectorAll('.nemo-sidebar__section'))
    .every((s) => getComputedStyle(s).display === 'none');
  const treeFirst = sidebar.firstElementChild?.id === 'nemo-sidebar-tree';
  toggleBtn.click();
  const hiddenAfterF9 = sidebar.classList.contains('is-sidebar-hidden');
  toggleBtn.click();
  const visibleAgain = !sidebar.classList.contains('is-sidebar-hidden');
  placesBtn.click();
  return {
    ok: placesView === 'places' && placesVisible
      && treeView === 'tree' && treeVisible && sectionsHiddenInTree && treeFirst
      && hiddenAfterF9 && visibleAgain,
    sectionsHiddenInTree,
    treeFirst,
    placesView,
    treeView,
    hiddenAfterF9,
    visibleAgain,
    footerBound: root?.dataset?.nemoFooterControlsBound === 'true',
  };
});

const ok = home.sidebarReady && home.navReady
  && home.chromeToolkit === 'cinnamon'
  && home.chromeProvider === 'nemo'
  && home.dragOnHeader
  && home.title && home.title.indexOf('Nemo') >= 0
  && docs.path && docs.path.indexOf('Documents') >= 0
  && docs.title && docs.title.indexOf('Documents') >= 0
  && bookmark.path && bookmark.path.indexOf('Bureau') >= 0
  && trash.title && trash.title.indexOf('Corbeille') >= 0
  && trash.empty && trash.empty.indexOf('vide') >= 0
  && back.path && back.path.indexOf('Bureau') >= 0
  && iconsView.icons && !iconsView.list
  && listView.list && !listView.headerHidden
  && searchUi.wrapVisible && searchUi.hasInput && searchUi.inPathGroup && searchUi.expanded
  && searchFilter.query === 'doc'
  && (recentView.hasItems === false || (recentView.hasMimeIcon && !recentView.allFolderSvg))
  && homeFolders.documentsOk && homeFolders.noSymbolicEmblem && homeFolders.bureauOk
  && sidebarIcons.recent.found && sidebarIcons.filesystem.found
  && sidebarIcons.recent.filter.indexOf('invert') >= 0
  && sidebarIcons.filesystem.filter.indexOf('invert') >= 0
  && sidebarIcons.documents.filter === sidebarIcons.recent.filter
  && vfsRoot.hasBin && vfsRoot.hasHome && vfsRoot.pathLabel === '/' && vfsRoot.allFolderIcons
  && xedFromNemo.visible && xedFromNemo.hasContent
  && xedFromNemo.title.indexOf('introduction-bash') >= 0
  && !xedFromNemo.targetBlank
  && pathNavigationMode.ok
  && footerSidebar.ok && footerSidebar.footerBound;

console.log(JSON.stringify({
  home, docs, bookmark, trash, back, vfsRoot, sidebarIcons, iconsView, listView, searchUi, searchFilter, recentView, homeFolders, xedFromNemo, pathNavigationMode, footerSidebar, ok,
}, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
