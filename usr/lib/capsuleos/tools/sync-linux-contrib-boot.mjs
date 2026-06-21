#!/usr/bin/env node
/**
 * Injecte la chaîne contrib internet simulé (mnt + bridge) dans les skins Linux.
 * Usage : node usr/lib/capsuleos/tools/sync-linux-contrib-boot.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');

const MNT_GLOBALS = `<script>window.CAPSULE_MNT_BASE=window.CAPSULE_MNT_BASE||'../../../mnt';window.CAPSULE_MNT_MODULES=window.CAPSULE_MNT_MODULES||['debutant/linux-bases'];</script>
`;

const MNT_MODULES = '    <script src="../../../usr/lib/capsuleos/shells/common/capsule-mnt-modules.js"></script>\n';
const MNT_BRIDGE = '    <script src="../../../usr/lib/capsuleos/shells/linux/capsule-mnt-bridge.js"></script>\n';
const FIREFOX_IFRAME_BRIDGE = '    <script src="../../../usr/lib/capsuleos/shells/linux/firefox-iframe-bridge.js"></script>\n';
const FIREFOX_CONTRIB = '    <script src="../../../var/lib/capsuleos/generated/capsule-firefox-contrib.js"></script>\n';

function collectIndexFiles(dir, out) {
  if (!fs.existsSync(dir)) {
    return;
  }
  fs.readdirSync(dir, { withFileTypes: true }).forEach((ent) => {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      collectIndexFiles(full, out);
      return;
    }
    if (ent.name === 'index.html') {
      out.push(full);
    }
  });
}

const targets = [];
collectIndexFiles(path.join(ROOT, 'home'), targets);

let changed = 0;

targets.forEach((full) => {
  let html = fs.readFileSync(full, 'utf8');
  if (!/simulatedWebResolver\.js/i.test(html)) {
    return;
  }

  let next = html;

  if (!/CAPSULE_MNT_MODULES/i.test(next)) {
    next = next.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/var\/lib\/capsuleos\/generated\/capsule-simulated-web-index\.js[^"]*"><\/script>\n)/,
      `$1${MNT_GLOBALS}`,
    );
  }

  if (!/capsule-mnt-modules\.js/i.test(next)) {
    next = next.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/usr\/lib\/capsuleos\/shells\/linux\/simulatedWebResolver\.js[^"]*"><\/script>\n)/,
      `$1${MNT_MODULES}`,
    );
  }

  if (!/capsule-mnt-bridge\.js/i.test(next)) {
    next = next.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/usr\/lib\/capsuleos\/shells\/common\/capsule-mnt-modules\.js"><\/script>\n)/,
      `$1${MNT_BRIDGE}`,
    );
    if (!/capsule-mnt-bridge\.js/i.test(next)) {
      next = next.replace(
        /(<script src="\.\.\/\.\.\/\.\.\/usr\/lib\/capsuleos\/shells\/linux\/simulatedWebResolver\.js[^"]*"><\/script>\n)/,
        `$1${MNT_BRIDGE}`,
      );
    }
  }

  if (!/firefox-iframe-bridge\.js/i.test(next)) {
    next = next.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/usr\/lib\/capsuleos\/shells\/linux\/firefoxBrowser\.js[^"]*"><\/script>\n)/,
      `$1${FIREFOX_IFRAME_BRIDGE}`,
    );
  }

  if (!/capsule-firefox-contrib\.js/i.test(next)) {
    next = next.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/var\/lib\/capsuleos\/generated\/capsule-simulated-web-index\.js[^"]*"><\/script>\n)/,
      `$1${FIREFOX_CONTRIB}`,
    );
  }

  if (next === html) {
    return;
  }

  changed += 1;
  const rel = path.relative(ROOT, full);
  if (DRY) {
    console.log('[dry-run]', rel);
  } else {
    fs.writeFileSync(full, next, 'utf8');
    console.log('✓', rel);
  }
});

console.log(`${DRY ? '[dry-run] ' : ''}${changed} skin(s) Linux mis à jour (contrib boot)`);
