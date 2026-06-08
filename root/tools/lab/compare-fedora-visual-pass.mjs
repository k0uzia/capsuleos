#!/usr/bin/env node
/**
 * Passe comparaison VM ↔ CapsuleOS (linux-fedora) — shell GNOME 50.
 * Usage : node root/tools/lab/compare-fedora-visual-pass.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const VM_ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/fedora/inventory/fedora-vm');
const CAP_ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/fedora/inventory/fedora-capsule');
const OUT = path.join(ROOT, 'root/docs/inventaires/linux-fedora-comparaison-visuelle.md');

const PAIRS = [
  {
    label: 'Bureau sombre',
    vm: 'fedora-dark-desktop.png',
    cap: 'fedora-capsule-dark-desktop.png',
    context: 'GNOME Shell 50.2 + dock latéral Capsule ; fond F44 nuit',
  },
  {
    label: 'Aperçu bureau (workspace)',
    vm: 'audit/fedora-dark-overview.png',
    cap: 'fedora-capsule-dark-overview.png',
    context: 'Main.overview.show() VM · CapsuleGnomeOverview workspace',
  },
  {
    label: 'Aperçu avec Firefox (vignette)',
    vm: 'fedora-dark-firefox.png',
    cap: 'fedora-capsule-dark-overview-busy.png',
    context: 'VM : fenêtre Navigator · Capsule : overview + peek workspace',
  },
  {
    label: 'Fichiers sombre (Nautilus)',
    vm: 'fedora-dark-nautilus.png',
    cap: 'fedora-capsule-dark-nautilus.png',
    context: 'org.gnome.Nautilus · slot nemo, chrome CSD GNOME 50',
  },
  {
    label: 'Firefox sombre',
    vm: 'fedora-dark-firefox.png',
    cap: 'fedora-capsule-dark-firefox.png',
    context: 'Navigator.firefox · slot firefox',
  },
  {
    label: 'Éditeur de texte sombre',
    vm: 'fedora-dark-text-editor.png',
    cap: 'fedora-capsule-dark-text-editor.png',
    context: 'org.gnome.TextEditor · slot text_editor',
  },
  {
    label: 'Calculatrice sombre',
    vm: 'fedora-dark-calculator.png',
    cap: 'fedora-capsule-dark-calculator.png',
    context: 'org.gnome.Calculator · dernier favori dash VM',
  },
  {
    label: 'Bureau clair',
    vm: 'fedora-light-desktop.png',
    cap: 'fedora-capsule-light-desktop.png',
    context: 'color-scheme prefer-light ↔ data-theme=light',
  },
  {
    label: 'Aperçu clair',
    vm: 'audit/fedora-light-overview.png',
    cap: 'fedora-capsule-light-overview.png',
    context: 'Overview thème clair F44 jour',
  },
];

const exists = (base, rel) => {
  const p = path.join(base, rel);
  return fs.existsSync(p) ? { ok: true, size: fs.statSync(p).size, path: p } : { ok: false };
};

const lines = [];
lines.push('# Comparaison visuelle Fedora — VM ↔ CapsuleOS');
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
  lines.push(`> **${missing}** paire(s) incomplète(s) — relancer \`vm-fedora-capture-host.sh\` et \`capture-capsule-fedora.mjs\`.`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${lines.join('\n')}\n`);
process.stdout.write(`OK ${OUT} — ${complete}/${PAIRS.length} paires\n`);
if (missing) process.exit(1);
