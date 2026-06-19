#!/usr/bin/env node
/**
 * Vérifie le rendu live du clone (getComputedStyle / géométrie) contre l'inventaire VM.
 * Source : root/docs/inventaires/<id>-<slot>-vm.json → champ computedChecks.
 *
 * Usage :
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/assert-computed-vs-inventory.mjs --id linux-mint --slot mintinstall
 *   ... --json   (sortie JSON pour intégration parity pass)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const FACADE_BY_REGISTRY = {
  'linux-mint': 'OS/linux/families/debian/mint/index.html',
  'linux-ubuntu': 'OS/linux/families/debian/ubuntu/index.html',
  'linux-rocky': 'OS/linux/families/redhat/rocky/index.html',
  'linux-fedora': 'OS/linux/families/redhat/fedora/index.html',
  'linux-alma': 'OS/linux/families/redhat/alma/index.html',
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', slot: null, json: false };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--slot' && args[i + 1]) opts.slot = args[++i];
    else if (a === '--json') opts.json = true;
  }
  return opts;
};

function normalizeColor(value) {
  const v = (value || '').trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return v.replace(/\s+/g, ' ').replace(/rgba\((\d+), (\d+), (\d+), 1\)/, 'rgb($1, $2, $3)');
}

const opts = parseArgs();
const slug = opts.id.replace(/[^a-z0-9-]/gi, '-');
const invPath = path.join(ROOT, 'root/docs/inventaires', `${slug}-${opts.slot}-vm.json`);
if (!opts.slot || !fs.existsSync(invPath)) {
  console.error(`✗ inventaire introuvable : ${invPath}`);
  process.exit(1);
}
const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));
const spec = inventory.computedChecks;
if (!spec || !Array.isArray(spec.checks) || !spec.checks.length) {
  console.log(`○ assert-computed-vs-inventory — pas de computedChecks dans ${path.relative(ROOT, invPath)}`);
  process.exit(0);
}

const base = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501').replace(/\/$/, '');
const facade = FACADE_BY_REGISTRY[opts.id];
if (!facade) {
  console.error(`✗ façade inconnue pour ${opts.id}`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1 });
const results = [];
try {
  await page.goto(`${base}/${facade}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });
  await page.evaluate((slot) => window.openWindowByDataLink(slot), spec.openSlot || opts.slot);
  if (spec.readySelector) {
    await page.waitForSelector(spec.readySelector, { timeout: 20000 });
  }
  await page.waitForTimeout(spec.settleMs || 400);

  for (const check of spec.checks) {
    const measured = await page.evaluate((c) => {
      const el = document.querySelector(c.selector);
      if (!el) return { found: false };
      if (c.kind === 'boundingWidth' || c.kind === 'boundingHeight') {
        const rect = el.getBoundingClientRect();
        return { found: true, value: c.kind === 'boundingWidth' ? rect.width : rect.height };
      }
      const style = window.getComputedStyle(el);
      return { found: true, value: style.getPropertyValue(c.property) };
    }, check);

    let pass = false;
    let detail = measured;
    if (!measured.found) {
      detail = { error: `sélecteur introuvable : ${check.selector}` };
    } else if (check.kind === 'boundingWidth' || check.kind === 'boundingHeight') {
      const tolerance = typeof check.tolerancePx === 'number' ? check.tolerancePx : 2;
      pass = Math.abs(measured.value - check.expected) <= tolerance;
      detail = { measured: Math.round(measured.value * 10) / 10, expected: check.expected, tolerance };
    } else {
      const got = normalizeColor(String(measured.value));
      const want = normalizeColor(String(check.expected));
      pass = got === want;
      detail = { measured: got, expected: want };
    }
    results.push({ id: check.id, pass, source: check.source || null, detail });
  }
} finally {
  await browser.close();
}

const failures = results.filter((r) => !r.pass);
if (opts.json) {
  console.log(JSON.stringify({ id: opts.id, slot: opts.slot, results }, null, 2));
} else {
  results.forEach((r) => {
    console.log(`${r.pass ? '✓' : '✗'} ${r.id} — ${JSON.stringify(r.detail)}${r.source ? ` (VM : ${r.source})` : ''}`);
  });
}
if (failures.length) {
  console.error(`✗ assert-computed-vs-inventory — ${failures.length}/${results.length} écart(s) vs inventaire VM`);
  process.exit(1);
}
console.log(`✓ assert-computed-vs-inventory OK — ${results.length} check(s) ${opts.id}/${opts.slot}`);
process.exit(0);
