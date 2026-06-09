#!/usr/bin/env node
/**
 * Smoke Cred* KDE Neon — exécute smokePlan d'un scénario inventaire.
 *
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-kde-fidelity-scenario.mjs --id linux-kde-neon --scenario panel-launcher-kickoff
 *   ... --write   # marque CredS + π=100 dans inventaire
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeSummary } from './app-fidelity-lib.mjs';
import {
  findChromePath,
  resolveKdeNeonUrl,
  runSmokePlan,
} from './kde-fidelity-smoke-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-kde-neon', scenario: null, dryRun: false, write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--scenario' && args[i + 1]) opts.scenario = args[++i];
    else if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const loadInventory = (registryId) => {
  const p = path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-scenarios.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`Inventaire manquant: ${p} — lancer seed-kde-neon-fidelity-inventory.mjs --write`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const saveInventory = (registryId, data) => {
  const p = path.join(ROOT, 'root/docs/inventaires', `${registryId}-app-fidelity-scenarios.json`);
  data.updatedAt = new Date().toISOString();
  data.summary = computeSummary(data);
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const markScenarioOk = (inventory, scenarioId) => {
  const scenario = (inventory.scenarios || []).find((s) => s.id === scenarioId);
  if (!scenario) return inventory;
  scenario.predicates = { ...scenario.predicates, CredS: true };
  scenario.pi_credibility = 100;

  const apps = inventory.apps || [];
  const byApp = {};
  (inventory.scenarios || []).forEach((s) => {
    if (!byApp[s.app]) byApp[s.app] = [];
    byApp[s.app].push(s);
  });
  apps.forEach((app) => {
    const list = byApp[app.id] || [];
    const allOk = list.length > 0 && list.every((s) => s.predicates?.CredS === true);
    if (allOk) app.pi_credibility = 100;
  });
  inventory.summary = computeSummary(inventory);
  return inventory;
};

const main = async () => {
  const opts = parseArgs();
  if (!opts.scenario) {
    process.stderr.write('Usage: --id linux-kde-neon --scenario <id> [--write]\n');
    process.exit(1);
  }

  const inventory = loadInventory(opts.id);
  const scenario = (inventory.scenarios || []).find((s) => s.id === opts.scenario);
  if (!scenario) {
    throw new Error(`Scénario introuvable: ${opts.scenario}`);
  }
  if (!scenario.smokePlan) {
    throw new Error(`smokePlan absent pour ${opts.scenario}`);
  }

  if (opts.dryRun) {
    process.stdout.write(`\n[dry-run] ${opts.scenario} (${scenario.app})\n`);
    process.stdout.write(`${JSON.stringify(scenario.smokePlan, null, 2)}\n`);
    return;
  }

  const chromePath = findChromePath();
  if (!chromePath) {
    process.stderr.write('Chrome/Playwright introuvable\n');
    process.exit(2);
  }

  const url = resolveKdeNeonUrl();
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1211, height: 756 } });
  const errors = [];

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, {
      timeout: 60000,
    });
    await runSmokePlan(page, scenario.smokePlan, errors);
  } catch (err) {
    errors.push(String(err.message || err));
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    errors.forEach((e) => process.stderr.write(`✗ ${e}\n`));
    process.exit(1);
  }

  if (opts.write) {
    saveInventory(opts.id, markScenarioOk(inventory, opts.scenario));
  }

  process.stdout.write(`✓ smoke-kde-fidelity-scenario ${opts.scenario} OK\n`);
};

main().catch((err) => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
