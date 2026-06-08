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
    assertions: [],
  };

  selectors.forEach((sel) => {
    plan.assertions.push({ type: 'selectorVisible', selector: sel });
  });

  if (scenario.id === 'nemo-menu-context') {
    plan.actions.push({ type: 'evaluate', desc: 'clic droit zone contenu Nemo' });
    plan.assertions.push({ type: 'selectorVisible', selector: '#menu-app-context-menu' });
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
    }
  });
  process.stdout.write('✓ dry-run OK — exécution Playwright requiert CAPSULE_HTTP_BASE\n');
};

const runPlaywright = async (plan) => {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    process.stderr.write('✗ Playwright indisponible\n');
    process.exit(1);
  }

  const chromePath = ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];

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
      }
    }
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
