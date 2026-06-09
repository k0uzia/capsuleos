#!/usr/bin/env node
/**
 * Campagne menus contextuels Nemo — recette Playwright (Capsule).
 *
 * Usage :
 *   CAPSULE_MINT_URL=http://127.0.0.1:5501/OS/linux/families/debian/mint/index.html \
 *     node usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign.mjs
 *
 * Options : --screenshot-failures  --id <scenarioId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import {
  CAPTURE_DIR,
  ROOT,
  SCENARIOS_PATH,
  MATRIX_PATH,
  classifyGap,
  dismissMenus,
  ensureDir,
  ensureNemoOpen,
  isolateNemoCampaignWindows,
  readJson,
  setupScenario,
  triggerScenario,
} from './mint-nemo-context-campaign-lib.mjs';
import {
  chromePath,
  MINT_URL,
  MINT_VIEWPORT,
  openMintSlot,
  waitMintReady,
} from './mint-smoke-open.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(
  ROOT,
  'root/docs/inventaires/interactions/linux-mint/nemo-context-campaign-capsule.json',
);

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { screenshotFailures: false, id: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--screenshot-failures') opts.screenshotFailures = true;
    else if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const opts = parseArgs();
const scenariosDoc = readJson(SCENARIOS_PATH);
const matrix = readJson(MATRIX_PATH);
let scenarios = scenariosDoc.scenarios || [];
if (opts.id) {
  scenarios = scenarios.filter((s) => s.id === opts.id);
}

ensureDir(CAPTURE_DIR);

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: MINT_VIEWPORT });
await waitMintReady(page);

const results = {};
const consoleErrors = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
});

for (const scenario of scenarios) {
  try {
    if (scenario.group === 'nemo' || scenario.setup?.slot === 'nemo') {
      await dismissMenus(page);
      await ensureNemoOpen(page);
      await isolateNemoCampaignWindows(page);
    }
    await setupScenario(page, scenario, openMintSlot);
    const capture = await triggerScenario(page, scenario);
    const ctx = scenario.matrixContextId
      ? matrix.contexts.find((c) => c.id === scenario.matrixContextId)
      : null;
    const gap = classifyGap(scenario, capture, null, matrix);
    const entry = {
      scenarioId: scenario.id,
      label: scenario.label,
      priority: scenario.priority,
      group: scenario.group,
      setup: scenario.setup,
      trigger: scenario.trigger,
      ...capture,
      expectedLabels: ctx?.expectedLabels || [],
      gap,
      skipped: capture.optional && capture.reason && !capture.visible,
    };

    if (opts.screenshotFailures && gap.p0 && capture.visible === false) {
      const shotPath = path.join(CAPTURE_DIR, `capsule-fail-${scenario.id}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      entry.screenshot = shotPath.replace(`${ROOT}/`, '');
    }

    results[scenario.id] = entry;
  } catch (err) {
    results[scenario.id] = {
      scenarioId: scenario.id,
      visible: false,
      labels: [],
      error: String(err.message || err),
      gap: { p0: scenario.priority === 'P0', p1: scenario.priority === 'P1' },
    };
  }
  await dismissMenus(page);
}

const p0 = Object.values(results).filter((r) => r.gap?.p0).length;
const p1 = Object.values(results).filter((r) => r.gap?.p1).length;
const payload = {
  collectedAt: new Date().toISOString(),
  source: 'capsule-playwright',
  url: process.env.CAPSULE_MINT_URL || MINT_URL,
  scenariosPath: SCENARIOS_PATH.replace(`${ROOT}/`, ''),
  matrixPath: MATRIX_PATH.replace(`${ROOT}/`, ''),
  scenarioCount: scenarios.length,
  p0Gaps: p0,
  p1Gaps: p1,
  consoleErrors: [...new Set(consoleErrors)].slice(0, 20),
  results,
};

fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  out: OUT_PATH.replace(`${ROOT}/`, ''),
  scenarioCount: scenarios.length,
  p0Gaps: p0,
  p1Gaps: p1,
  ok: p0 === 0,
}, null, 2));

await browser.close();
process.exit(p0 === 0 ? 0 : 1);
