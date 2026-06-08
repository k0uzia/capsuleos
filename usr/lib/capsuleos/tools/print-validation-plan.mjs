#!/usr/bin/env node
/**
 * Plan de validation discriminé depuis fichiers modifiés (git).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/print-validation-plan.mjs
 *   node usr/lib/capsuleos/tools/print-validation-plan.mjs --staged
 *   node usr/lib/capsuleos/tools/print-validation-plan.mjs home/Debian/Mint/style/apps/nemo.skin.css
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const staged = process.argv.includes('--staged');

let files = args;
if (!files.length) {
  const gitArgs = staged
    ? ['diff', '--cached', '--name-only']
    : ['diff', '--name-only', 'HEAD'];
  const r = spawnSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8' });
  if (r.status === 0 && r.stdout.trim()) {
    files = r.stdout.trim().split('\n').filter(Boolean);
  } else {
    const s = spawnSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
    if (s.status === 0) {
      files = s.stdout
        .split('\n')
        .map((line) => line.replace(/^\s*[MADRCU?]+\s+/, '').trim())
        .filter(Boolean);
    }
  }
}

const gates = new Set();
const notes = [];

const add = (gate, note) => {
  gates.add(gate);
  if (note) {
    notes.push(note);
  }
};

const isMint = (f) => /home\/Debian\/Mint|linux-mint|mainMenu-data-cinnamon|cinnamon/.test(f);
const isGnomeSkin = (f) => /home\/(Debian\/(Ubuntu|AnduinOS)|RedHat\/(Fedora|Rocky))|linux-(ubuntu|fedora|rocky|anduinos)/.test(f);

files.forEach((f) => {
  if (/usr\/share\/capsuleos\/assets|home\/public\/Images/.test(f)) {
    add('node usr/lib/capsuleos/tools/validate-asset-zones.mjs', 'Zone assets touchée');
  }
  if (isMint(f)) {
    add('node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-mint', 'Paradigme Cinnamon/Mint');
    add('node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint', 'Checkpoints clone Mint');
    add('node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs', 'Façades pick-os Mint');
    if (/toolkits\/gnome/.test(f) && !/dash|overview/.test(f)) {
      notes.push(`⚠ ${f} — fuite toolkit GNOME sur périmètre Mint ? Voir paradigme-toolkit-cinnamon.md`);
    }
  }
  if (isGnomeSkin(f) && !isMint(f)) {
    add('node usr/lib/capsuleos/tools/validate-window-chrome-contexts.mjs', 'Chrome GNOME (Ubuntu/Rocky/Fedora)');
  }
  if (/home\/.*\/(index\.html|style\/)/.test(f)) {
    add('node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs', 'Skin Linux modifié');
  }
  if (/usr\/share\/capsuleos\/linux\/(apps|explorers)/.test(f)) {
    add('node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs', 'Gabarits apps Linux');
  }
  if (/usr\/lib\/capsuleos/.test(f)) {
    add('node usr/lib/capsuleos/tools/validate-quality-all.mjs', 'JS noyau');
  }
  if (/etc\/capsuleos|os-registry/.test(f)) {
    add('node usr/lib/capsuleos/tools/validate-capsule.mjs', 'Registre / profils');
  }
  if (/\.cursor\/rules|root\/skills|root\/docs/.test(f)) {
    add('node usr/lib/capsuleos/tools/validate-agent-skills.mjs', 'Catalogue skills (si skills modifiés)');
  }
});

add('node usr/lib/capsuleos/tools/validate-all.mjs', 'Clôture merge / push (H₆)');

console.log('Plan de validation CapsuleOS');
console.log('Fichiers analysés:', files.length ? files.join(', ') : '(aucun — working tree propre)');

if (notes.length) {
  console.log('\nAlertes paradigme :');
  notes.forEach((n) => console.log(' ', n));
}

console.log('\nGates recommandées (ordre indicatif) :');
[...gates].forEach((g, i) => console.log(`${i + 1}. ${g}`));

if (files.some(isMint)) {
  console.log('\nSmokes Mint P0 (optionnel) :');
  console.log('  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 node usr/lib/capsuleos/tools/lab/run-capsule-panel-browser.mjs');
}
