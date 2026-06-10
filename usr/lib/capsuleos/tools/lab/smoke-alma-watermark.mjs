#!/usr/bin/env node
/**
 * Smoke filigrane bureau AlmaLinux — assets VM, tokens CSS, rendu Playwright.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/smoke-alma-watermark.mjs
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-alma-watermark.mjs --playwright
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = 'linux-alma';
const errors = [];

const parseArgs = () => {
  const args = process.argv.slice(2);
  return { playwright: args.includes('--playwright') };
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
};

const VM_SHA = {
  'usr/share/capsuleos/assets/images/vendors/alma/watermark/fedora_logo_darkbackground.svg':
    '85ab08c1fb4709a4a2df6d05a062f238cb93b4c743e2a5f09bce7c1b2955a7a4',
  'usr/share/capsuleos/assets/images/vendors/alma/watermark/fedora_logo_lightbackground.svg':
    'dadf34516e65ff9d6f2062fd24b6d6c6e6d8468f8cf7ee18d74bd4cd02791335',
};

for (const [asset, expectedSha] of Object.entries(VM_SHA)) {
  const abs = path.join(ROOT, asset);
  if (!fs.existsSync(abs)) {
    errors.push(`Asset watermark manquant: ${asset}`);
    continue;
  }
  const hash = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  if (hash !== expectedSha) {
    errors.push(`SHA256 watermark divergent: ${asset}`);
  }
}

const tokensCss = read('home/RedHat/Alma/style/gnome-shell/tokens.css');
const workstationCss = read('home/RedHat/Alma/style/gnome-workstation.css');
const overviewCss = read('home/RedHat/Alma/style/gnome-shell/overview.css');

if (!tokensCss.includes('--alma-watermark')) {
  errors.push('tokens.css : --alma-watermark absent');
}
if (tokensCss.includes('--rocky-watermark')) {
  errors.push('tokens.css : --rocky-watermark résiduel (cloisonnement Alma)');
}
if (!tokensCss.includes('12.5%')) {
  errors.push('tokens.css : --alma-watermark-width 12.5 % attendu (gsettings VM logo-size)');
}
if (!workstationCss.includes('left: var(--alma-watermark-inset)')) {
  errors.push('gnome-workstation.css : filigrane doit être bottom-left (VM logo-position)');
}
if (!workstationCss.includes('no-repeat left bottom')) {
  errors.push('gnome-workstation.css : background-position left bottom attendu');
}
if (!overviewCss.includes('var(--alma-watermark)')) {
  errors.push('overview.css : carte Aperçu sans --alma-watermark');
}

async function runPlaywright() {
  const url = resolveCapsuleOsUrl(REGISTRY);
  const { chromium } = await import('playwright');
  const chromePath = process.env.PLAYWRIGHT_CHROME
    || '/home/n0r3f/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';
  const fallbacks = ['/usr/bin/google-chrome', '/usr/bin/chromium'];
  const executablePath = fs.existsSync(chromePath)
    ? chromePath
    : fallbacks.find((p) => fs.existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  const dark = await page.evaluate(() => {
    const body = document.body;
    const style = getComputedStyle(body, '::after');
    const root = getComputedStyle(document.documentElement);
    const inset = parseFloat(root.getPropertyValue('--alma-watermark-inset')) || 0;
    const widthPct = parseFloat(root.getPropertyValue('--alma-watermark-width')) || 0;
    return {
      content: style.content,
      bg: style.backgroundImage,
      left: style.left,
      bottom: style.bottom,
      widthPct,
      insetPx: inset,
    };
  });

  if (!dark.bg || dark.bg === 'none') {
    errors.push('Playwright : ::after bureau sans background-image (mode sombre)');
  }
  if (!dark.bg.includes('fedora_logo_darkbackground')) {
    errors.push('Playwright : watermark sombre ≠ fedora_logo_darkbackground.svg');
  }
  if (parseFloat(dark.left) < 10) {
    errors.push(`Playwright : filigrane pas ancré à gauche (left=${dark.left})`);
  }

  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(300);

  const light = await page.evaluate(() => {
    const style = getComputedStyle(document.body, '::after');
    return { bg: style.backgroundImage };
  });
  if (!light.bg.includes('fedora_logo_lightbackground')) {
    errors.push('Playwright : watermark clair ≠ fedora_logo_lightbackground.svg');
  }

  const captureDir = path.join(ROOT, 'root/docs/inventaires/captures/linux-alma');
  fs.mkdirSync(captureDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  await page.screenshot({
    path: path.join(captureDir, `${stamp}-watermark-light.png`),
    fullPage: false,
  });
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-theme');
    delete document.documentElement.dataset.theme;
  });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(captureDir, `${stamp}-watermark-dark.png`),
    fullPage: false,
  });

  await browser.close();
}

const main = async () => {
  const opts = parseArgs();
  if (opts.playwright) {
    await runPlaywright();
  }

  if (errors.length) {
    console.error('smoke-alma-watermark — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
  }

  const outPath = path.join(ROOT, 'root/docs/inventaires/linux-alma-watermark-smoke.json');
  fs.writeFileSync(outPath, `${JSON.stringify({
    registryId: REGISTRY,
    domain: 'shell-watermark',
    status: 'done',
    vmExtension: 'background-logo@fedorahosted.org',
    vmGsettings: {
      logoPosition: 'bottom-left',
      logoSize: 12.5,
      logoBorder: 50,
      logoFile: '/usr/share/almalinux-logos/fedora_logo_darkbackground.svg',
    },
    capsuleTokens: ['--alma-watermark', '--alma-watermark-width', '--alma-watermark-inset'],
    smoke: 'smoke-alma-watermark.mjs',
    polishedAt: new Date().toISOString(),
  }, null, 2)}\n`);
  console.log('✓ smoke-alma-watermark OK — linux-alma');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
