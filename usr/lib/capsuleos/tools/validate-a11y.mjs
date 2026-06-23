#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Gate WCAG 2.2 AA — scan axe-core avec couche a11y P10 opt-in activée.
 * Usage : node usr/lib/capsuleos/tools/validate-a11y.mjs
 */
import fs from 'fs';
import net from 'net';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { resolveCapsuleOsUrl } from './linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const contractPath = path.join(ROOT, 'etc/capsuleos/contracts/a11y-scan-targets.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

const portOpen = (port, host) => new Promise((resolve) => {
  const sock = net.createConnection({ port, host }, () => {
    sock.end();
    resolve(true);
  });
  sock.on('error', () => resolve(false));
  sock.setTimeout(1500, () => {
    sock.destroy();
    resolve(false);
  });
});

const waitForServer = async (base, attempts = 40) => {
  const url = new URL(base);
  const port = Number(url.port);
  const host = url.hostname;
  for (let i = 0; i < attempts; i += 1) {
    if (await portOpen(port, host)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
};

const startHttpServer = (host, port) => {
  const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', host], {
    cwd: ROOT,
    stdio: 'ignore',
  });
  return child;
};

const resolveTargetUrl = (target, base) => {
  if (target.registryId) {
    return resolveCapsuleOsUrl(target.registryId, base);
  }
  const rel = (target.path || '/index.html').replace(/^\//, '');
  return `${base}/${rel}`;
};

const main = async () => {
  const host = contract.serverHost || '127.0.0.1';
  const port = contract.serverPort || 9876;
  const base = `http://${host}:${port}`;

  let serverChild = null;
  const alreadyUp = await portOpen(port, host);
  if (!alreadyUp) {
    serverChild = startHttpServer(host, port);
    const ready = await waitForServer(base);
    if (!ready) {
      console.error(`  ✗ serveur HTTP indisponible sur ${base}`);
      serverChild.kill();
      process.exit(1);
    }
  }

  let chromium;
  let AxeBuilder;
  try {
    ({ chromium } = await import('playwright'));
    ({ default: AxeBuilder } = await import('@axe-core/playwright'));
  } catch (err) {
    if (serverChild) serverChild.kill();
    console.error('  ✗ dépendances manquantes — npm ci (@axe-core/playwright, playwright)');
    console.error(`    ${err.message}`);
    process.exit(1);
  }

  const optInEntries = contract.optInLocalStorage || {};
  const failImpact = new Set(contract.failImpact || ['serious', 'critical']);
  const warnImpact = new Set(contract.warnImpact || ['moderate', 'minor']);
  const axeTags = contract.axeTags || ['wcag2a', 'wcag2aa', 'wcag22aa'];

  const report = {
    generatedAt: new Date().toISOString(),
    contract: path.relative(ROOT, contractPath),
    p10OptIn: true,
    targets: [],
    summary: { critical: 0, serious: 0, moderate: 0, minor: 0 },
  };

  const browser = await chromium.launch({ headless: true });
  const blocking = [];

  for (const target of contract.targets || []) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const url = resolveTargetUrl(target, base);
    const targetReport = {
      id: target.id,
      label: target.label,
      url,
      violations: [],
      warnings: [],
      passes: 0,
    };

    try {
      await page.addInitScript((prefs) => {
        Object.entries(prefs).forEach(([key, value]) => {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            /* quota / mode privé */
          }
        });
      }, optInEntries);
      await page.goto(url, { waitUntil: 'networkidle', timeout: target.waitTimeoutMs || 45000 });
      if (target.waitForSelector) {
        await page.waitForSelector(target.waitForSelector, { timeout: target.waitTimeoutMs || 30000 });
      }

      await page.waitForFunction(() => typeof window.CapsuleA11y !== 'undefined', null, { timeout: 15000 });
      await page.evaluate((prefs) => {
        window.CapsuleA11y.applyState({
          contrast: prefs['mint-contrast-mode'] === 'high' ? 'high' : 'normal',
          fontScale: prefs['mint-font-scale'] || '100',
          reducedMotion: prefs['capsule-reduced-motion'] === 'on' ? 'on' : 'off',
          underlineLinks: prefs['capsule-underline-links'] === 'on' ? 'on' : 'off',
        });
      }, optInEntries);

      const axeResult = await new AxeBuilder({ page }).withTags(axeTags).analyze();
      targetReport.passes = axeResult.passes.length;

      axeResult.violations.forEach((violation) => {
        const item = {
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          nodes: violation.nodes.length,
        };
        if (failImpact.has(violation.impact)) {
          targetReport.violations.push(item);
          report.summary[violation.impact] = (report.summary[violation.impact] || 0) + 1;
          blocking.push(`${target.id} : [${violation.impact}] ${violation.id} — ${violation.help}`);
        } else if (warnImpact.has(violation.impact)) {
          targetReport.warnings.push(item);
          report.summary[violation.impact] = (report.summary[violation.impact] || 0) + 1;
        }
      });

      process.stdout.write(`  ○ ${target.id} — ${targetReport.violations.length} bloquant(s), ${targetReport.warnings.length} avertissement(s)\n`);
    } catch (err) {
      blocking.push(`${target.id} : scan impossible — ${err.message}`);
    } finally {
      await context.close();
    }

    report.targets.push(targetReport);
  }

  await browser.close();
  if (serverChild) {
    serverChild.kill();
  }

  const reportRel = contract.reportPath || 'var/lib/capsuleos/generated/a11y-report.json';
  const reportPath = path.join(ROOT, reportRel);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  if (blocking.length) {
    console.error('validate-a11y — échec (serious/critical ou erreur scan)');
    blocking.forEach((line) => console.error(`  ✗ ${line}`));
    process.exit(1);
  }

  console.log(`✓ validate-a11y OK — rapport ${reportRel} (${report.targets.length} cible(s))`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
