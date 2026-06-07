#!/usr/bin/env node
/**
 * Passe comparaison VM ↔ CapsuleOS (linux-ubuntu) — shell GNOME + dock latéral Yaru.
 * Usage : node root/tools/lab/compare-ubuntu-visual-pass.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const VM_ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/ubuntu/inventory/ubuntu-vm');
const CAP_ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/ubuntu/inventory/ubuntu-capsule');
const OUT = path.join(ROOT, 'root/docs/inventaires/linux-ubuntu-comparaison-visuelle.md');

const PAIRS = [
  {
    label: 'Bureau sombre',
    vm: 'ubuntu-dark-desktop.png',
    cap: 'ubuntu-capsule-dark-desktop.png',
    context: 'Ubuntu 26.04 + dock latéral Yaru ; fond Resolute Raccoon Dimmed',
  },
  {
    label: 'Aperçu bureau (workspace)',
    vm: 'audit/ubuntu-dark-overview.png',
    cap: 'ubuntu-capsule-dark-overview.png',
    context: 'Main.overview.show() VM · CapsuleGnomeOverview workspace',
  },
  {
    label: 'Aperçu avec Firefox (vignette)',
    vm: 'ubuntu-dark-firefox.png',
    cap: 'ubuntu-capsule-dark-overview-busy.png',
    context: 'VM : fenêtre Navigator · Capsule : overview + peek workspace',
  },
  {
    label: 'Fichiers sombre (Nautilus)',
    vm: 'ubuntu-dark-nautilus.png',
    cap: 'ubuntu-capsule-dark-nautilus.png',
    context: 'org.gnome.Nautilus · slot nemo, icônes Yaru',
  },
  {
    label: 'Firefox sombre',
    vm: 'ubuntu-dark-firefox.png',
    cap: 'ubuntu-capsule-dark-firefox.png',
    context: 'Navigator.firefox · slot firefox',
  },
  {
    label: 'Éditeur de texte sombre',
    vm: 'ubuntu-dark-text-editor.png',
    cap: 'ubuntu-capsule-dark-text-editor.png',
    context: 'org.gnome.TextEditor · slot text_editor',
  },
  {
    label: 'Calculatrice sombre',
    vm: 'ubuntu-dark-calculator.png',
    cap: 'ubuntu-capsule-dark-calculator.png',
    context: 'org.gnome.Calculator · favori dash VM',
  },
  {
    label: 'Bureau clair',
    vm: 'ubuntu-light-desktop.png',
    cap: 'ubuntu-capsule-light-desktop.png',
    context: 'color-scheme prefer-light ↔ data-theme=light',
  },
  {
    label: 'Aperçu clair',
    vm: 'audit/ubuntu-light-overview.png',
    cap: 'ubuntu-capsule-light-overview.png',
    context: 'Overview thème clair Resolute Raccoon Light',
  },
];

const exists = (base, rel) => {
  const p = path.join(base, rel);
  return fs.existsSync(p) ? { ok: true, size: fs.statSync(p).size, path: p } : { ok: false };
};

const lines = [];
lines.push('# Comparaison visuelle Ubuntu — VM ↔ CapsuleOS');
lines.push('');
lines.push(`> Généré : ${new Date().toISOString()}`);
lines.push(`> VM : \`${VM_ASSETS}\` · Capsule : \`${CAP_ASSETS}\``);
lines.push('');

let complete = 0;
let missing = 0;

lines.push('| Scène | VM | Capsule | Contexte |');
lines.push('|-------|-----|---------|----------|');

for (const pair of PAIRS) {
  const vm = exists(VM_ASSETS, pair.vm);
  const cap = exists(CAP_ASSETS, pair.cap);
  const vmCell = vm.ok ? `✓ ${pair.vm} (${vm.size} o)` : `✗ ${pair.vm}`;
  const capCell = cap.ok ? `✓ ${pair.cap} (${cap.size} o)` : `✗ ${pair.cap}`;
  if (vm.ok && cap.ok) complete += 1;
  else missing += 1;
  lines.push(`| ${pair.label} | ${vmCell} | ${capCell} | ${pair.context} |`);
}

lines.push('');
lines.push(`**${complete}/${PAIRS.length}** paire(s) complète(s).`);
if (missing) {
  lines.push('');
  lines.push(`> **${missing}** paire(s) incomplète(s) — relancer \`vm-ubuntu-capture-host.sh\` et \`capture-capsule-ubuntu.mjs\`.`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${lines.join('\n')}\n`);
process.stdout.write(`OK ${OUT} — ${complete}/${PAIRS.length} paires\n`);
if (missing) process.exit(1);
