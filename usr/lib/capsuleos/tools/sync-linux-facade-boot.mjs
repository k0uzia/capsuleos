#!/usr/bin/env node
/**
 * Injecte la chaîne boot assets (manifest → profiles → resource → skin-boot) dans les façades Linux.
 * Usage : node usr/lib/capsuleos/tools/sync-linux-facade-boot.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const DRY = process.argv.includes('--dry-run');

const BOOT_BLOCK = `    <script src="../../../var/lib/capsuleos/generated/capsule-assets-manifest.js"></script>
    <script src="../../../var/lib/capsuleos/generated/capsule-skin-profiles.js"></script>
    <script src="../../../usr/lib/capsuleos/common/capsule-resource.js"></script>
    <script src="../../../usr/lib/capsuleos/common/capsule-skin-boot.js"></script>
`;

const USER_HOME = '    <script src="../../../usr/lib/capsuleos/common/user-home.js"></script>\n';

const FACADES = [
  'OS/linux/families/debian/mint/index.html',
  'OS/linux/families/debian/ubuntu/index.html',
  'OS/linux/families/debian/popos/index.html',
  'OS/linux/families/debian/anduinos/index.html',
  'OS/linux/families/debian/mx-kde/index.html',
  'OS/linux/families/debian/debian-kde/index.html',
  'OS/linux/families/redhat/fedora/index.html',
  'OS/linux/families/suse/opensuse/index.html',
];

let changed = 0;

for (const rel of FACADES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    console.warn(`Ignoré (absent): ${rel}`);
    continue;
  }
  let html = fs.readFileSync(full, 'utf8');
  if (/capsule-skin-boot\.js/i.test(html) && /capsule-resource\.js/i.test(html)) {
    continue;
  }

  if (/user-home\.js/i.test(html) && !/capsule-assets-manifest\.js/i.test(html)) {
    html = html.replace(
      /(<script src="\.\.\/\.\.\/\.\.\/usr\/lib\/capsuleos\/common\/user-home\.js"><\/script>\n)/,
      `$1${BOOT_BLOCK}`,
    );
  } else if (!/user-home\.js/i.test(html)) {
    html = html.replace(
      /(<meta name="viewport"[^>]*>\n)/i,
      `$1${USER_HOME}${BOOT_BLOCK}`,
    );
  }

  if (!/capsule-skin-boot\.js/i.test(html)) {
    console.warn(`Échec injection: ${rel}`);
    continue;
  }

  changed += 1;
  if (DRY) console.log('[dry-run]', rel);
  else fs.writeFileSync(full, html, 'utf8');
}

console.log(`${DRY ? '[dry-run] ' : ''}${changed} façade(s) Linux mises à jour`);
