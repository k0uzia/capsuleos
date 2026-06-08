#!/usr/bin/env node
/**
 * Smoke crédibilité pédagogique — exécution steps scénario sur façade OS (squelette Playwright).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-app-fidelity-scenario.mjs --id linux-mint --scenario nemo-menu-context --dry-run
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node ... --id linux-mint --scenario mintinstall-search
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', scenario: null, dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--scenario' && args[i + 1]) opts.scenario = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
};

const loadInventory = (registryId) => {
  const p = path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-scenarios.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const findScenario = (inventory, scenarioId) => {
  const scenarios = inventory.scenarios || [];
  for (let i = 0; i < scenarios.length; i += 1) {
    if (scenarios[i].id === scenarioId) return scenarios[i];
  }
  return null;
};

const buildPlaywrightPlan = (registryId, scenario, httpBase) => {
  const url = resolveCapsuleOsUrl(registryId, httpBase);
  const selectors = (scenario.selectors && scenario.selectors.capsule) || [];
  const plan = {
    url,
    app: scenario.app,
    scenarioId: scenario.id,
    steps: scenario.steps || [],
    actions: [
      { type: 'goto', url },
      { type: 'waitFor', fn: 'openWindowByDataLink' },
      { type: 'openSlot', slot: scenario.app },
      { type: 'wait', ms: 800 },
    ],
    baseAssertions: [],
    executionBlocks: [],
    assertions: [],
  };

  selectors.forEach((sel) => {
    plan.baseAssertions.push({ type: 'selectorVisible', selector: sel });
  });

  if (scenario.id === 'nemo-open-documents') {
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="nemo"] #voletnemo a[data-link="Documents"]',
      desc: 'sidebar Documents',
    });
    plan.actions.push({ type: 'wait', ms: 250 });
    plan.assertions.push({ type: 'textContains', selector: '.nemo-pathbar, #nemo-path-label', text: 'Documents' });
    plan.assertions.push({
      type: 'hasClass',
      selector: 'div[data-link="nemo"] #voletnemo a[data-link="Documents"]',
      className: 'nemo-sidebar__link--active',
    });
    plan.assertions.push({
      type: 'childCountMin',
      selector: 'div[data-link="nemo"] .nemo-file-list',
      min: 1,
    });
  }
  if (scenario.id === 'nemo-menu-context') {
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="nemo"] #voletnemo a[data-link="Bureau"]',
      desc: 'sidebar Bureau',
    });
    plan.actions.push({ type: 'wait', ms: 200 });
    plan.actions.push({
      type: 'contextMenu',
      selector: 'div[data-link="nemo"] .nemoElement',
      x: 420,
      y: 320,
      desc: 'clic droit zone vide',
    });
    plan.actions.push({ type: 'wait', ms: 120 });
    plan.assertions.push({ type: 'selectorVisible', selector: 'div[data-link="nemo"] .nemo-app__context-menu:not([hidden])' });
    plan.assertions.push({
      type: 'childCountMin',
      selector: 'div[data-link="nemo"] .nemo-app__context-menu',
      min: 3,
    });
  }
  if (scenario.id === 'nemo-sidebar-favorites') {
    const nav = [
      { link: 'Téléchargements', label: 'Téléchargements' },
      { link: 'Bureau', label: 'Bureau' },
      { link: 'Dossier Personnel', label: 'Dossier personnel' },
    ];
    nav.forEach((step) => {
      plan.executionBlocks.push({
        actions: [
          {
            type: 'click',
            selector: `div[data-link="nemo"] #voletnemo a[data-link="${step.link}"]`,
            desc: `sidebar ${step.label}`,
          },
          { type: 'wait', ms: 280 },
        ],
        assertions: [{
          type: 'hasClass',
          selector: `div[data-link="nemo"] #voletnemo a[data-link="${step.link}"]`,
          className: 'nemo-sidebar__link--active',
        }],
      });
    });
  }
  if (scenario.id === 'nemo-file-new-folder') {
    plan.dialogHandler = { accept: 'Projet' };
    plan.actions.push({
      type: 'click',
      selector: 'div[data-link="nemo"] #voletnemo a[data-link="Documents"]',
      desc: 'sidebar Documents',
    });
    plan.actions.push({ type: 'wait', ms: 200 });
    plan.actions.push({ type: 'nemoMenu', menu: 'Fichier', item: 'Créer un nouveau dossier' });
    plan.actions.push({ type: 'wait', ms: 400 });
    plan.assertions.push({
      type: 'selectorPresent',
      selector: 'div[data-link="nemo"] .nemo-file-list a[data-item-name="Projet"]',
    });
  }
  if (scenario.id === 'mintinstall-search') {
    plan.actions.push({ type: 'fill', selector: '.mintinstall-search input, #search-entry', value: 'firefox' });
    plan.assertions.push({ type: 'textContains', selector: '.mintinstall-results, .app-list', text: 'Firefox' });
  }

  return plan;
};

const printDryRun = (plan) => {
  process.stdout.write(`\n=== smoke-app-fidelity-scenario [dry-run] ===\n`);
  process.stdout.write(`URL: ${plan.url}\n`);
  process.stdout.write(`App: ${plan.app} · scénario: ${plan.scenarioId}\n`);
  process.stdout.write('Steps documentés:\n');
  plan.steps.forEach((st, idx) => {
    process.stdout.write(`  ${idx + 1}. ${st}\n`);
  });
  process.stdout.write('Plan Playwright:\n');
  plan.actions.forEach((a, idx) => {
    const detail = a.selector ? ` ${a.selector}` : '';
    const val = a.value ? ` "${a.value}"` : '';
    process.stdout.write(`  ${idx + 1}. ${a.type}${detail}${val}${a.desc ? ` — ${a.desc}` : ''}\n`);
  });
  process.stdout.write('Assertions:\n');
  plan.assertions.forEach((a, idx) => {
    if (a.type === 'selectorVisible') {
      process.stdout.write(`  ${idx + 1}. visible: ${a.selector}\n`);
    } else if (a.type === 'textContains') {
      process.stdout.write(`  ${idx + 1}. contains "${a.text}": ${a.selector}\n`);
    } else if (a.type === 'hasClass') {
      process.stdout.write(`  ${idx + 1}. class "${a.className}": ${a.selector}\n`);
    } else if (a.type === 'childCountMin') {
      process.stdout.write(`  ${idx + 1}. min ${a.min} children: ${a.selector}\n`);
    } else if (a.type === 'selectorPresent') {
      process.stdout.write(`  ${idx + 1}. present: ${a.selector}\n`);
    }
  });
  process.stdout.write('✓ dry-run OK — exécution Playwright requiert CAPSULE_HTTP_BASE\n');
};

const runScenarioActions = async (page, plan) => {
  for (let i = 0; i < plan.actions.length; i += 1) {
    const action = plan.actions[i];
    if (action.type === 'goto' || action.type === 'waitFor' || action.type === 'openSlot') {
      continue;
    }
    if (action.type === 'wait') {
      await page.waitForTimeout(action.ms || 200);
    } else if (action.type === 'click') {
      await page.click(action.selector);
    } else if (action.type === 'fill') {
      await page.fill(action.selector, action.value || '');
    } else if (action.type === 'contextMenu') {
      await page.evaluate(({ selector, x, y }) => {
        const el = document.querySelector(selector);
        if (el) {
          el.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
          }));
        }
      }, {
        selector: action.selector,
        x: action.x || 320,
        y: action.y || 280,
      });
    } else if (action.type === 'nemoMenu') {
      await page.evaluate(({ menu, item }) => {
        const scope = document.querySelector('div[data-link="nemo"]');
        if (!scope) {
          return;
        }
        if (typeof window.resolveFileExplorerMenuAction === 'function') {
          const handled = window.resolveFileExplorerMenuAction(item, { type: 'item', menu: menu }, scope);
          if (handled) {
            return;
          }
        }
        const triggers = scope.querySelectorAll('.nemo-menubar .menuHeader > li > a');
        for (let i = 0; i < triggers.length; i += 1) {
          if (triggers[i].textContent.indexOf(menu) >= 0) {
            triggers[i].click();
            break;
          }
        }
        const links = scope.querySelectorAll('.listeSousMenu a');
        for (let j = 0; j < links.length; j += 1) {
          const label = links[j].textContent.replace(/\s+/g, ' ').trim();
          if (label.indexOf(item) >= 0) {
            links[j].click();
            break;
          }
        }
      }, { menu: action.menu, item: action.item });
    } else if (action.type === 'evaluate') {
      await page.evaluate(() => {});
    }
  }
};

const runScenarioAssertions = async (page, plan, errors) => {
  for (let i = 0; i < plan.assertions.length; i += 1) {
    const a = plan.assertions[i];
    if (a.type === 'selectorVisible') {
      const el = await page.$(a.selector);
      if (!el) errors.push(`Sélecteur absent: ${a.selector}`);
    } else if (a.type === 'textContains') {
      const el = await page.$(a.selector);
      const text = el ? await el.textContent() : '';
      if (!text || text.indexOf(a.text) < 0) {
        errors.push(`Texte "${a.text}" absent dans ${a.selector}`);
      }
    } else if (a.type === 'hasClass') {
      const hasClass = await page.evaluate(({ selector, className }) => {
        const node = document.querySelector(selector);
        return !!(node && node.classList && node.classList.contains(className));
      }, { selector: a.selector, className: a.className });
      if (!hasClass) {
        errors.push(`Classe "${a.className}" absente sur ${a.selector}`);
      }
    } else if (a.type === 'childCountMin') {
      const count = await page.evaluate((selector) => {
        const node = document.querySelector(selector);
        if (!node) {
          return 0;
        }
        if (node.hidden) {
          return 0;
        }
        return node.querySelectorAll('a, .nemo-app__list-row, .nemo-app__context-item').length;
      }, a.selector);
      if (count < (a.min || 1)) {
        errors.push(`Enfants insuffisants (${count} < ${a.min}) dans ${a.selector}`);
      }
    } else if (a.type === 'selectorPresent') {
      const el = await page.$(a.selector);
      if (!el) {
        errors.push(`Élément absent: ${a.selector}`);
      }
    }
  }
};

const runPlaywright = async (plan) => {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    process.stderr.write('✗ Playwright indisponible\n');
    process.exit(1);
  }

  const chromePath = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];

  if (plan.dialogHandler && plan.dialogHandler.accept) {
    page.on('dialog', async (dialog) => {
      await dialog.accept(plan.dialogHandler.accept);
    });
  }

  try {
    await page.goto(plan.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, {
      timeout: 30000,
    });
    await page.evaluate((slot) => {
      if (typeof window.openWindowByDataLink === 'function') {
        window.openWindowByDataLink(slot);
      }
    }, plan.app);
    await page.waitForTimeout(800);

    await runScenarioAssertions(page, { assertions: plan.baseAssertions }, errors);

    if (plan.executionBlocks.length > 0) {
      for (let bi = 0; bi < plan.executionBlocks.length; bi += 1) {
        await runScenarioActions(page, plan.executionBlocks[bi]);
        await runScenarioAssertions(page, plan.executionBlocks[bi], errors);
      }
    }

    await runScenarioActions(page, plan);
    await runScenarioAssertions(page, plan, errors);
  } catch (err) {
    errors.push(String(err.message || err));
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    errors.forEach((e) => process.stderr.write(`✗ ${e}\n`));
    process.exit(1);
  }
  process.stdout.write(`✓ smoke-app-fidelity-scenario ${plan.scenarioId} OK\n`);
};

const main = async () => {
  const opts = parseArgs();
  if (!opts.scenario) {
    process.stderr.write('Usage: --id <registryId> --scenario <id> [--dry-run]\n');
    process.exit(1);
  }

  const inventory = loadInventory(opts.id);
  const scenario = findScenario(inventory, opts.scenario);
  if (!scenario) {
    process.stderr.write(`Scénario inconnu: ${opts.scenario}\n`);
    process.exit(1);
  }

  const httpBase = process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501';
  const plan = buildPlaywrightPlan(opts.id, scenario, httpBase);

  if (opts.dryRun) {
    printDryRun(plan);
    return;
  }

  if (!process.env.CAPSULE_HTTP_BASE) {
    process.stdout.write('○ CAPSULE_HTTP_BASE non défini — dry-run implicite\n');
    printDryRun(plan);
    return;
  }

  await runPlaywright(plan);
};

main().catch((err) => {
  process.stderr.write(`${err.message || err}\n`);
  process.exit(1);
});
