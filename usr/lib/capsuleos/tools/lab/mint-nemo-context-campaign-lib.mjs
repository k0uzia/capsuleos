/**
 * Lib partagée — campagne menus contextuels Nemo Mint (recette Playwright).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');

export const SCENARIOS_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/nemo-context-scenarios.json',
);
export const MATRIX_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/context-menus.json',
);
export const CAPTURE_DIR = path.join(
  ROOT,
  'root/docs/inventaires/captures/linux-mint/context-menu-campaign',
);

export const KNOWN_ACTIONS = new Set([
  'open', 'cut', 'copy', 'rename', 'delete', 'properties', 'new-folder', 'new-document',
  'open-with', 'paste', 'trash', 'restore-trash', 'delete-forever', 'open-terminal',
  'select-all', 'empty-trash', 'compress', 'new-document-template', 'open-with-app',
  'remove-place',
  'minimize', 'toggle-maximize', 'close', 'always-on-top', 'add-applets', 'configure-panel',
]);

export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

export const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const matrixContext = (matrix, id) => (
  matrix.contexts.find((c) => c.id === id) || null
);

export const diffLabels = (actual, expected) => {
  const a = actual || [];
  const e = expected || [];
  const missing = e.filter((label) => a.indexOf(label) < 0);
  const extras = a.filter((label) => e.indexOf(label) < 0);
  const orderMismatch = missing.length === 0 && extras.length === 0
    && e.some((label, i) => a[i] !== label);
  return { missing, extras, orderMismatch, ok: missing.length === 0 && extras.length === 0 && !orderMismatch };
};

/** Capture menu Nemo dynamique dans la recette. */
export const captureNemoMenuEval = `(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const menu = win?.querySelector('.nemo-app__context-menu');
  const errors = (window.__capsuleCampaignErrors || []).slice();
  if (!win) {
    return { visible: false, labels: [], actions: [], separators: 0, submenus: {}, errors, reason: 'no-nemo-window' };
  }
  const rows = menu && !menu.hidden
    ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden])')]
    : [];
  const labels = [];
  const actions = [];
  let separators = 0;
  rows.forEach((row) => {
    const sep = row.querySelector('.nemo-app__context-sep:not([hidden])');
    if (sep) {
      separators += 1;
      return;
    }
    const btn = row.querySelector(':scope > .nemo-app__context-item');
    if (btn && !btn.hidden && !btn.disabled) {
      labels.push(btn.textContent.trim());
      actions.push(String(btn.dataset.nemoCtxAction || '').trim());
    } else if (btn && !btn.hidden && btn.disabled) {
      labels.push(btn.textContent.trim() + ' [disabled]');
      actions.push(String(btn.dataset.nemoCtxAction || '').trim());
    }
  });
  const rect = menu && !menu.hidden ? menu.getBoundingClientRect() : null;
  const zIndex = menu ? getComputedStyle(menu).zIndex : '';
  const clipped = rect
    ? rect.right > window.innerWidth || rect.bottom > window.innerHeight || rect.left < 0 || rect.top < 0
    : false;
  return {
    bound: win.dataset.nemoContextMenuInit === 'true',
    visible: !!(menu && !menu.hidden),
    labels,
    actions,
    separators,
    wired: actions.every((a) => a.length > 0 && ${JSON.stringify([...KNOWN_ACTIONS])}.indexOf(a) >= 0),
    zIndex,
    rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
    clipped,
    path: typeof window.getExplorerCurrentPath === 'function' ? window.getExplorerCurrentPath('nemo') : '',
    errors,
  };
})()`;

export const captureNemoSubmenuEval = (parentAction) => `(() => {
  const win = document.querySelector('div[data-link="nemo"]');
  const menu = win?.querySelector('.nemo-app__context-menu');
  const parentBtn = menu
    ? [...menu.querySelectorAll('.nemo-app__context-item')].find((n) => n.dataset.nemoCtxAction === ${JSON.stringify(parentAction)})
    : null;
  if (!parentBtn) {
    return { visible: false, labels: [], actions: [], reason: 'no-parent-item' };
  }
  parentBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  const sub = parentBtn.closest('.nemo-app__context-row')?.querySelector('.nemo-app__context-submenu');
  const labels = sub && !sub.hidden
    ? [...sub.querySelectorAll('.nemo-app__context-item')].map((n) => n.textContent.trim())
    : [];
  const actions = sub && !sub.hidden
    ? [...sub.querySelectorAll('.nemo-app__context-item')].map((n) => String(n.dataset.nemoCtxAction || '').trim())
    : [];
  const rect = sub && !sub.hidden ? sub.getBoundingClientRect() : null;
  return {
    visible: !!(sub && !sub.hidden),
    labels,
    actions,
    flipLeft: !!(sub && sub.classList.contains('nemo-app__context-submenu--flip-left')),
    rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
  };
})()`;

export async function dismissMenus(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(60);
}

const CAMPAIGN_WINDOW_SLOTS = [
  'themes', 'text_editor', 'visionneur_pdf', 'visionneur_images', 'lecteur_multimedia',
  'firefox', 'calculator', 'terminal',
];

export async function isolateNemoCampaignWindows(page) {
  await page.evaluate((slots) => {
    const nemo = document.querySelector('div[data-link="nemo"]');
    slots.forEach((slot) => {
      const other = document.querySelector(`div[data-link="${slot}"]`);
      if (other && other !== nemo) {
        other.style.display = 'none';
        other.classList.remove('windowElementActive');
      }
    });
    if (nemo) {
      nemo.style.display = 'block';
      nemo.classList.add('windowElementActive');
    }
  }, CAMPAIGN_WINDOW_SLOTS);
  await page.waitForTimeout(80);
}

export async function ensureNemoWindowVisible(page) {
  await page.evaluate(() => {
    const win = document.querySelector('div[data-link="nemo"]');
    if (!win) return;
    if (win.style.display === 'none') {
      const btn = document.querySelector(
        '#taskbar-window-list .taskbar-window-list__btn[data-window-link="nemo"]',
      );
      if (btn) {
        btn.click();
      } else if (typeof window.openWindowByDataLink === 'function') {
        window.openWindowByDataLink('nemo');
      } else {
        win.style.display = 'block';
        win.classList.add('windowElementActive');
      }
    }
    ['themes', 'text_editor', 'visionneur_pdf', 'visionneur_images', 'lecteur_multimedia'].forEach((slot) => {
      const other = document.querySelector(`div[data-link="${slot}"]`);
      if (other && other !== win) {
        other.classList.remove('windowElementActive');
      }
    });
  });
  await page.waitForFunction(() => {
    const win = document.querySelector('div[data-link="nemo"]');
    return win && win.style.display !== 'none';
  }, null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(100);
}

/** Alias campagne — garantir Nemo visible avant chaque scénario navigable. */
export const ensureNemoOpen = ensureNemoWindowVisible;

export async function navigateNemo(page, place) {
  const link = place === 'home' ? '#home' : `a[data-link="${place}"]`;
  const sel = place === 'home'
    ? 'div[data-link="nemo"] #home'
    : `div[data-link="nemo"] #voletnemo ${link}`;
  await page.click(sel).catch(() => {});
  await page.waitForTimeout(place === 'Corbeille' ? 200 : 140);
}

export async function setNemoViewMode(page, mode) {
  const iconSel = 'div[data-link="nemo"] .nemo-app__toolbar-group--view a img[src*="view-grid"]';
  const listSel = 'div[data-link="nemo"] .nemo-app__toolbar-group--view a img[src*="view-list"]';
  if (mode === 'icons') {
    await page.click(iconSel).catch(() => {});
  } else if (mode === 'list') {
    await page.click(listSel).catch(() => {});
  }
  await page.waitForTimeout(100);
}

export async function ensureTrashItem(page) {
  const hasItem = await page.evaluate(() => {
    const win = document.querySelector('div[data-link="nemo"]');
    return !!(win?.querySelector('.nemoElement a[data-item-name]'));
  });
  if (hasItem) return true;
  await navigateNemo(page, 'Documents');
  await page.evaluate(() => {
    const win = document.querySelector('div[data-link="nemo"]');
    const link = win?.querySelector('.nemoElement a[data-item-name="introduction-bash.txt"]')
      || win?.querySelector('.nemoElement a[data-item-type="file"]');
    if (link && typeof window.trashExplorerSelection === 'function') {
      link.classList.add('nemo-app__item--selected');
      window.trashExplorerSelection(link);
    }
  });
  await page.waitForTimeout(200);
  await navigateNemo(page, 'Corbeille');
  await page.waitForTimeout(200);
  return page.evaluate(() => !!document.querySelector('div[data-link="nemo"] .nemoElement a[data-item-name]'));
}

export async function emptyTrashIfNeeded(page) {
  await navigateNemo(page, 'Corbeille');
  const empty = await page.evaluate(async () => {
    const win = document.querySelector('div[data-link="nemo"]');
    const has = win?.querySelector('.nemoElement a[data-item-name]');
    if (has && typeof window.emptyNautilusTrash === 'function') {
      await window.emptyNautilusTrash();
    }
    return !win?.querySelector('.nemoElement a[data-item-name]');
  });
  await page.waitForTimeout(180);
  return empty;
}

export async function setupScenario(page, scenario, openMintSlot) {
  const { setup } = scenario;
  if (!setup) return;

  if (setup.slot === 'nemo') {
    await dismissMenus(page);
    await ensureNemoOpen(page);
    await isolateNemoCampaignWindows(page);
    await ensureNemoOpen(page);
    await openMintSlot(page, 'nemo');
    await ensureNemoWindowVisible(page);
    await page.waitForFunction(() => {
      const win = document.querySelector('div[data-link="nemo"]');
      return win && win.style.display !== 'none';
    }, null, { timeout: 15000 }).catch(async () => {
      await page.evaluate(() => {
        if (typeof window.openWindowByDataLink === 'function') {
          window.openWindowByDataLink('nemo');
        }
      });
    });
    await page.waitForTimeout(160);
    if (setup.navigate) {
      await navigateNemo(page, setup.navigate);
    }
    if (setup.viewMode) {
      await setNemoViewMode(page, setup.viewMode);
    }
    if (setup.emptyTrash) {
      await emptyTrashIfNeeded(page);
    }
    if (setup.ensureTrashItem) {
      await ensureTrashItem(page);
    }
    if (setup.select && setup.select.length) {
      await page.evaluate((names) => {
        const win = document.querySelector('div[data-link="nemo"]');
        const grid = win?.querySelector('.nemoElement');
        if (!grid) return;
        grid.querySelectorAll('.nemo-app__item--selected').forEach((el) => {
          el.classList.remove('nemo-app__item--selected');
        });
        names.forEach((name) => {
          const link = grid.querySelector(`a[data-item-name="${name}"]`);
          if (link) link.classList.add('nemo-app__item--selected');
        });
      }, setup.select);
      await page.waitForTimeout(80);
    }
  }
}

export async function triggerScenario(page, scenario) {
  const { trigger } = scenario;
  if (!trigger) return { visible: false, reason: 'no-trigger' };

  await page.evaluate(() => {
    window.__capsuleCampaignErrors = [];
    const orig = console.error;
    if (!window.__capsuleCampaignConsolePatched) {
      console.error = (...args) => {
        window.__capsuleCampaignErrors.push(args.map(String).join(' '));
        orig.apply(console, args);
      };
      window.__capsuleCampaignConsolePatched = true;
    }
  });

  if (trigger.type === 'right-click' && trigger.coords) {
    await page.mouse.click(trigger.coords[0], trigger.coords[1], { button: 'right' });
    await page.waitForTimeout(120);
    if (scenario.group === 'shell') {
      return page.evaluate((sid) => {
        const errors = (window.__capsuleCampaignErrors || []).slice();
        if (sid === 'desktop.background') {
          const menu = document.getElementById('desktop-context-menu');
          const labels = menu && !menu.hidden
            ? [...menu.querySelectorAll('.desktop-context-menu__item')].map((b) => b.textContent.trim())
            : [];
          return { visible: !!(menu && !menu.hidden), labels, errors };
        }
        if (sid === 'panel.background') {
          const menu = document.getElementById('mint-panel-context-menu');
          const items = menu && !menu.hidden
            ? [...menu.querySelectorAll('[data-mint-panel-action]')].filter((n) => !n.hidden)
            : [];
          return {
            visible: !!(menu && !menu.hidden),
            labels: items.map((n) => n.textContent.trim()),
            actions: items.map((n) => String(n.dataset.mintPanelAction || '').trim()),
            errors,
          };
        }
        return { visible: false, labels: [], errors };
      }, scenario.id);
    }
  }

  if (trigger.type === 'contextmenu' && trigger.selector) {
    if (scenario.id === 'window.title') {
      const box = await page.locator(trigger.selector).boundingBox();
      if (box) {
        await page.mouse.click(box.x + Math.min(120, box.width * 0.35), box.y + box.height / 2, { button: 'right' });
      }
      await page.waitForTimeout(120);
      return page.evaluate(() => {
        const menu = document.getElementById('muffin-window-context-menu');
        const items = menu && !menu.hasAttribute('hidden')
          ? [...menu.querySelectorAll('[data-muffin-ctx-action]')].filter((n) => !n.hidden)
          : [];
        return {
          visible: !!(menu && !menu.hasAttribute('hidden')),
          labels: items.map((n) => n.textContent.trim()),
          actions: items.map((n) => String(n.dataset.muffinCtxAction || '').trim()),
          errors: (window.__capsuleCampaignErrors || []).slice(),
        };
      });
    }
    return page.evaluate((sel) => {
      const node = document.querySelector(sel);
      if (!node) return { visible: false, labels: [], reason: 'no-selector' };
      const rect = node.getBoundingClientRect();
      node.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true, cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      }));
      if (sel.includes('desktop-shortcut')) {
        const menu = document.getElementById('desktop-icon-context-menu');
        const items = menu && !menu.hidden
          ? [...menu.querySelectorAll('[data-desktop-icon-action]')].filter((n) => !n.hidden)
          : [];
        return {
          visible: !!(menu && !menu.hidden),
          labels: items.map((n) => n.textContent.trim()),
          actions: items.map((n) => String(n.dataset.desktopIconAction || '').trim()),
          errors: (window.__capsuleCampaignErrors || []).slice(),
        };
      }
      return { visible: false, labels: [], reason: 'unhandled-selector' };
    }, trigger.selector);
  }

  if (trigger.type === 'contextmenu' && trigger.target) {
    const result = await page.evaluate(({ trig, sid }) => {
      const win = document.querySelector('div[data-link="nemo"]');
      if (!win) return { visible: false, labels: [], reason: 'no-nemo' };

      const fire = (el, x, y) => {
        el.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true, clientX: x, clientY: y,
        }));
      };

      if (trig.target === 'content') {
        const content = win.querySelector('.nemoElement');
        const coords = trig.coords || [420, 300];
        fire(content, coords[0], coords[1]);
      } else if (trig.target === 'item') {
        const links = [...win.querySelectorAll('.nemoElement a[data-item-name]')];
        let link = null;
        if (trig.itemName) {
          link = links.find((n) => n.dataset.itemName === trig.itemName);
        } else if (trig.itemType === 'folder') {
          link = links.find((n) => n.dataset.itemType === 'folder' && (!trig.itemName || n.dataset.itemName === trig.itemName));
        } else if (trig.itemType === 'any') {
          link = links[0];
        } else if (trig.itemExtension) {
          link = links.find((n) => (n.dataset.itemName || '').endsWith(`.${trig.itemExtension}`));
        }
        if (!link) {
          return { visible: false, labels: [], reason: 'no-item', optional: !!trig.optional };
        }
        const rect = link.getBoundingClientRect();
        fire(link, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else if (trig.target === 'multi') {
        const content = win.querySelector('.nemoElement');
        const coords = trig.coords || [300, 250];
        fire(content, coords[0], coords[1]);
      } else if (trig.target === 'sidebar-place') {
        const place = trig.place || 'Corbeille';
        const placeAliases = {
          'Dossier personnel': ['Dossier personnel', 'Dossier Personnel'],
        };
        const candidates = placeAliases[place] || [place];
        let link = null;
        for (let i = 0; i < candidates.length; i += 1) {
          link = win.querySelector(`#voletnemo a[data-link="${candidates[i]}"]`);
          if (link) break;
        }
        if (!link) return { visible: false, labels: [], reason: 'no-sidebar-link' };
        const rect = link.getBoundingClientRect();
        fire(link, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else if (trig.target === 'pathbar') {
        const bar = win.querySelector('.nemo-pathbar, .nemo-app__path-current, #nemo-path-label');
        if (!bar) return { visible: false, labels: [], reason: 'no-pathbar' };
        const rect = bar.getBoundingClientRect();
        fire(bar, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else if (trig.target === 'toolbar') {
        const tb = win.querySelector('.nemo-app__toolbar');
        if (!tb) return { visible: false, labels: [], reason: 'no-toolbar' };
        const rect = tb.getBoundingClientRect();
        fire(tb, rect.left + rect.width * 0.85, rect.top + rect.height / 2);
      } else if (trig.target === 'sidebar-tree') {
        const tree = win.querySelector('#voletnemo .nemo-sidebar__tree a, #voletnemo [data-nemo-tree-node]');
        if (!tree) return { visible: false, labels: [], reason: 'no-tree-node', optional: true };
        const rect = tree.getBoundingClientRect();
        fire(tree, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }

      const menu = win.querySelector('.nemo-app__context-menu');
      const rows = menu && !menu.hidden
        ? [...menu.querySelectorAll('.nemo-app__context-row:not([hidden])')]
        : [];
      const labels = [];
      const actions = [];
      let separators = 0;
      rows.forEach((row) => {
        const sep = row.querySelector('.nemo-app__context-sep:not([hidden])');
        if (sep) { separators += 1; return; }
        const btn = row.querySelector(':scope > .nemo-app__context-item');
        if (btn && !btn.hidden) {
          const text = btn.textContent.trim() + (btn.disabled ? ' [disabled]' : '');
          labels.push(text);
          actions.push(String(btn.dataset.nemoCtxAction || '').trim());
        }
      });
      const rect = menu && !menu.hidden ? menu.getBoundingClientRect() : null;
      return {
        bound: win.dataset.nemoContextMenuInit === 'true',
        visible: !!(menu && !menu.hidden),
        labels,
        actions,
        separators,
        wired: actions.filter(Boolean).every((a) => a.length > 0),
        zIndex: menu ? getComputedStyle(menu).zIndex : '',
        rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
        clipped: rect ? rect.right > window.innerWidth || rect.bottom > window.innerHeight : false,
        item: trig.itemName || null,
        errors: (window.__capsuleCampaignErrors || []).slice(),
      };
    }, { trig: trigger, sid: scenario.id });
    return result;
  }

  if (trigger.type === 'submenu') {
    await page.evaluate(({ trig }) => {
      const win = document.querySelector('div[data-link="nemo"]');
      if (!win) return;
      const content = win.querySelector('.nemoElement');
      if (trig.target === 'content') {
        const coords = trig.coords || [420, 300];
        content?.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true, clientX: coords[0], clientY: coords[1],
        }));
      } else if (trig.target === 'item') {
        const link = win.querySelector(`.nemoElement a[data-item-name="${trig.itemName}"]`)
          || win.querySelector('.nemoElement a[data-item-type="file"]');
        if (link) {
          const rect = link.getBoundingClientRect();
          link.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true, cancelable: true,
            clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2,
          }));
        }
      }
    }, { trig: trigger });
    await page.waitForTimeout(80);
    return page.evaluate((parentAction) => {
      const win = document.querySelector('div[data-link="nemo"]');
      const menu = win?.querySelector('.nemo-app__context-menu');
      const parentBtn = menu
        ? [...menu.querySelectorAll('.nemo-app__context-item')].find((n) => n.dataset.nemoCtxAction === parentAction)
        : null;
      if (!parentBtn) return { visible: false, labels: [], reason: 'no-parent' };
      parentBtn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      const sub = parentBtn.closest('.nemo-app__context-row')?.querySelector('.nemo-app__context-submenu');
      const labels = sub && !sub.hidden
        ? [...sub.querySelectorAll('.nemo-app__context-item')].map((n) => n.textContent.trim())
        : [];
      const actions = sub && !sub.hidden
        ? [...sub.querySelectorAll('.nemo-app__context-item')].map((n) => String(n.dataset.nemoCtxAction || '').trim())
        : [];
      return {
        visible: !!(sub && !sub.hidden),
        labels,
        actions,
        flipLeft: !!(sub && sub.classList.contains('nemo-app__context-submenu--flip-left')),
        errors: (window.__capsuleCampaignErrors || []).slice(),
      };
    }, trigger.parentAction);
  }

  return { visible: false, labels: [], reason: 'unhandled-trigger' };
}

export function filterPedagogicalLabels(labels, matrix) {
  const core = new Set();
  (matrix.contexts || []).forEach((ctx) => {
    (ctx.expectedLabels || []).forEach((l) => core.add(l));
    if (ctx.submenus) {
      Object.values(ctx.submenus).forEach((subs) => subs.forEach((l) => core.add(l)));
    }
  });
  const extras = [
    'Créer un nouveau dossier', 'Créer un nouveau document', 'Coller', 'Ouvrir dans un terminal',
    'Tout sélectionner', 'Propriétés', 'Ouvrir', 'Ouvrir avec…', 'Couper', 'Copier', 'Renommer',
    'Compresser…', 'Déplacer vers la corbeille', 'Vider la corbeille', 'Restaurer',
    'Supprimer définitivement', 'Document vide', 'Feuille de calcul', 'Présentation',
    'Éditeur de texte', 'Visionneur d\'images', 'Visionneur de documents', 'Lecteur multimédia',
  ];
  extras.forEach((l) => core.add(l));
  return (labels || []).filter((l) => core.has(l.replace(' [disabled]', '')));
}

export function classifyGap(scenario, capsuleResult, vmResult, matrix) {
  const ctx = scenario.matrixContextId ? matrixContext(matrix, scenario.matrixContextId) : null;
  const priority = scenario.priority || ctx?.priority || 'P2';
  let expected = ctx?.expectedLabels || [];
  if (scenario.submenuKey && ctx?.submenus?.[scenario.submenuKey]) {
    expected = ctx.submenus[scenario.submenuKey];
  }
  const capsuleLabels = (capsuleResult?.labels || []).map((l) => l.replace(' [disabled]', ''));
  const vmRaw = vmResult?.labels || [];
  const vmLabels = filterPedagogicalLabels(vmRaw, matrix);
  const capDiff = diffLabels(capsuleLabels, expected);
  const vmDiff = diffLabels(vmLabels, expected);
  const crossDiff = vmLabels.length > 0 ? diffLabels(capsuleLabels, vmLabels) : { missing: [], extras: [], orderMismatch: false, ok: true };
  const capsuleBroken = !capsuleResult?.visible && !capsuleResult?.skipped && !scenario.optional;
  const p0 = priority === 'P0' && (capsuleBroken || capDiff.missing.length > 0);
  const p1 = (priority === 'P1' || priority === 'P0') && (
    capsuleBroken
    || capDiff.missing.length > 0
    || (vmLabels.length > 0 && crossDiff.missing.length > 0 && capDiff.missing.length > 0)
  );
  return {
    priority,
    expected,
    capsuleDiff: capDiff,
    vmDiff: vmDiff,
    crossDiff,
    vmPedagogical: vmLabels,
    p0: !!p0,
    p1: !!p1 && !p0,
  };
}
