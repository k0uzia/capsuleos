#!/usr/bin/env node
/**
 * Capture paires de scènes fidélité visuelle Φ — VM réelle (SSH) + clone Capsule (Playwright).
 * Contrat : etc/capsuleos/contracts/visual-scenes.json
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/capture-scene-pair.mjs --id linux-mint --slot mintinstall
 *   node usr/lib/capsuleos/tools/lab/capture-scene-pair.mjs --id linux-mint --slot mintinstall --scene home --vm-only
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-scene-pair.mjs --id linux-mint --slot mintinstall --clone-only
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/visual-scenes.json');
const chromePath = process.env.PLAYWRIGHT_CHROME
  || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-mint', slot: null, scene: null, vmOnly: false, cloneOnly: false };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--id' && args[i + 1]) opts.id = args[++i];
    else if (a === '--slot' && args[i + 1]) opts.slot = args[++i];
    else if (a === '--scene' && args[i + 1]) opts.scene = args[++i];
    else if (a === '--vm-only') opts.vmOnly = true;
    else if (a === '--clone-only') opts.cloneOnly = true;
  }
  return opts;
};

const opts = parseArgs();
const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
const registry = contract.registries[opts.id];
if (!registry) {
  console.error(`✗ registre ${opts.id} absent du contrat visual-scenes.json`);
  process.exit(1);
}
const slots = opts.slot ? [opts.slot] : Object.keys(registry.slots || {});
const capturesBase = path.join(
  ROOT,
  (contract.defaults.capturesDir || '').replace('<registryId>', opts.id),
);

const SSH_HOST = process.env[registry.vm.sshHostEnv] || registry.vm.sshHostDefault;
const SSH_ID = process.env.CAPSULE_SSH_IDENTITY || `${process.env.HOME}/.ssh/capsuleos-lab`;
const DISPLAY = registry.vm.display || ':0';

function ssh(cmd) {
  const r = spawnSync('ssh', [
    '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=12',
    '-i', SSH_ID,
    SSH_HOST,
    cmd,
  ], { encoding: 'utf8' });
  return { code: r.status, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}

function scpFrom(remotePath, localPath) {
  const r = spawnSync('scp', [
    '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=12',
    '-i', SSH_ID,
    `${SSH_HOST}:${remotePath}`,
    localPath,
  ], { encoding: 'utf8' });
  return r.status === 0;
}

const summary = { id: opts.id, capturedAt: new Date().toISOString(), vm: [], clone: [], skipped: [] };

function captureVmScene(slotId, slotSpec, scene) {
  if (scene.vm.mode !== 'live-window') {
    summary.skipped.push({ slot: slotId, scene: scene.id, side: 'vm', reason: `vm.mode=${scene.vm.mode}` });
    return;
  }
  const outDir = path.join(capturesBase, slotId, 'vm');
  fs.mkdirSync(outDir, { recursive: true });
  const remote = `/tmp/capsule-phi-${slotId}-${scene.id}.png`;
  const title = slotSpec.windowTitle;
  const probe = ssh(`DISPLAY=${DISPLAY} wmctrl -l 2>/dev/null | grep -iE "${slotSpec.wmctrlMatch}" | head -1`);
  if (!probe.stdout) {
    summary.skipped.push({ slot: slotId, scene: scene.id, side: 'vm', reason: `fenêtre "${title}" absente sur la VM — lancer ${scene.vm.appCommand || slotId}` });
    return;
  }
  // gnome-screenshot exige le bus de session D-Bus ; capture flaky après wmctrl -a → retries.
  const shot = ssh([
    `export DISPLAY=${DISPLAY} DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus`,
    `rm -f ${remote}`,
    `wmctrl -a "${title}"`,
    'sleep 0.8',
    `for i in 1 2 3; do gnome-screenshot -w -f ${remote} 2>/dev/null; test -s ${remote} && break; sleep 0.6; done`,
    `test -s ${remote}`,
  ].join('; '));
  if (shot.code !== 0) {
    summary.skipped.push({ slot: slotId, scene: scene.id, side: 'vm', reason: `gnome-screenshot KO : ${shot.stderr}` });
    return;
  }
  const local = path.join(outDir, `${scene.id}.png`);
  if (!scpFrom(remote, local)) {
    summary.skipped.push({ slot: slotId, scene: scene.id, side: 'vm', reason: 'scp échec' });
    return;
  }
  ssh(`rm -f ${remote}`);
  summary.vm.push({ slot: slotId, scene: scene.id, file: path.relative(ROOT, local) });
}

async function runCloneAction(page, action) {
  if (action.type === 'click') {
    await page.click(action.selector, { timeout: 10000 });
  } else if (action.type === 'waitSelector') {
    await page.waitForSelector(action.selector, { timeout: 10000 });
  } else if (action.type === 'fill') {
    await page.fill(action.selector, action.value || '');
  } else if (action.type === 'wait') {
    await page.waitForTimeout(action.ms || 200);
  }
}

async function captureCloneScenes(slotId, slotSpec, scenes) {
  const base = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501').replace(/\/$/, '');
  const url = `${base}/${registry.facadeUrl}`;
  const outDir = path.join(capturesBase, slotId, 'clone');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1 });
  try {
    for (const scene of scenes) {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => typeof window.openWindowByDataLink === 'function', null, { timeout: 60000 });
      await page.evaluate((slot) => window.openWindowByDataLink(slot), scene.clone.open || slotId);
      if (scene.clone.waitSelector) {
        await page.waitForSelector(scene.clone.waitSelector, { timeout: 20000 });
      }
      for (const action of scene.clone.actions || []) {
        await runCloneAction(page, action);
      }
      await page.waitForTimeout(scene.clone.settleMs || 400);
      const winSel = slotSpec.cloneWindowSelector || `div[data-link="${slotId}"]`;
      const el = await page.$(winSel);
      if (!el) {
        summary.skipped.push({ slot: slotId, scene: scene.id, side: 'clone', reason: `fenêtre ${winSel} introuvable` });
        continue;
      }
      const local = path.join(outDir, `${scene.id}.png`);
      await el.screenshot({ path: local });
      summary.clone.push({ slot: slotId, scene: scene.id, file: path.relative(ROOT, local) });
    }
  } finally {
    await browser.close();
  }
}

for (const slotId of slots) {
  const slotSpec = registry.slots[slotId];
  if (!slotSpec) {
    console.error(`✗ slot ${slotId} absent du contrat pour ${opts.id}`);
    process.exit(1);
  }
  const scenes = (slotSpec.scenes || []).filter((s) => !opts.scene || s.id === opts.scene);
  if (!opts.cloneOnly) {
    for (const scene of scenes) {
      captureVmScene(slotId, slotSpec, scene);
    }
  }
  if (!opts.vmOnly) {
    await captureCloneScenes(slotId, slotSpec, scenes);
  }
}

fs.mkdirSync(capturesBase, { recursive: true });
fs.writeFileSync(
  path.join(capturesBase, 'manifest.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
);
console.log(JSON.stringify(summary, null, 2));
const captured = summary.vm.length + summary.clone.length;
process.exit(captured > 0 ? 0 : 1);
