#!/usr/bin/env node
/**
 * Passe comparaison VM ↔ CapsuleOS (linux-rocky) : contexte apps + assets + checklist.
 * Usage : node root/tools/lab/compare-rocky-visual-pass.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const HTTP_BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:8765').replace(/\/$/, '');
const VM_ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/rocky/inventory/rocky-vm');
const CAP_ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors/rocky/inventory/rocky-capsule');
const SLOTS_DOC = path.join(ROOT, 'root/docs/inventaires/linux-gnome-capsule-slots.md');

const PAIRS = [
  {
    label: 'Bureau sombre',
    vm: 'rocky-dark-desktop.png',
    cap: 'rocky-capsule-dark-desktop.png',
    context: 'GNOME Shell + dock ; thème VM default → Capsule sombre',
  },
  {
    label: 'Bureau sombre (Firefox ouvert)',
    vm: 'rocky-dark-firefox.png',
    cap: 'rocky-capsule-dark-desktop-firefox.png',
    context: 'Parité contexte : fenêtre Navigator ouverte sur le bureau',
  },
  {
    label: 'Fichiers sombre (Nautilus VM / slot nemo Capsule)',
    vm: 'rocky-dark-nautilus.png',
    cap: 'rocky-capsule-dark-nautilus.png',
    context: 'VM : org.gnome.Nautilus · Capsule : gabarit nemo, titre « Fichiers »',
  },
  {
    label: 'Firefox sombre',
    vm: 'rocky-dark-firefox.png',
    cap: 'rocky-capsule-dark-firefox.png',
    context: 'Navigator.firefox · slot firefox',
  },
  {
    label: 'Terminal sombre (Ptyxis VM / slot terminal Capsule)',
    vm: 'rocky-dark-ptyxis.png',
    cap: 'rocky-capsule-dark-terminal.png',
    context: 'VM : Ptyxis · Capsule : chrome terminal profil linux:redhat',
  },
  {
    label: 'Bureau clair',
    vm: 'rocky-light-desktop.png',
    cap: 'rocky-capsule-light-desktop.png',
    context: 'color-scheme prefer-light ↔ data-theme=light',
  },
  {
    label: 'Fichiers clair',
    vm: 'rocky-light-nautilus.png',
    cap: 'rocky-capsule-light-nautilus.png',
    context: 'Nautilus VM · nemo Capsule, thème clair',
  },
  {
    label: 'Firefox clair',
    vm: 'rocky-light-firefox.png',
    cap: 'rocky-capsule-light-firefox.png',
    context: 'Firefox · firefox',
  },
  {
    label: 'Aperçu bureau (workspace)',
    vm: 'audit/anim-overview-03.png',
    cap: 'rocky-capsule-dark-overview.png',
    context: 'GNOME Shell Overview · dash + carte bureau',
  },
  {
    label: 'Aperçu bureau (vignettes + peek)',
    vm: 'audit/anim-overview-03.png',
    cap: 'rocky-capsule-dark-overview-busy.png',
    context: 'Capsule : Firefox + vignette + peek workspace-next · VM : overview structurel (audit sans fenêtres)',
  },
  {
    label: 'Grille applications Aperçu',
    vm: 'audit/anim-overview-02.png',
    cap: 'rocky-capsule-dark-overview-apps.png',
    context: 'Overview mode apps · grille RL10 alignée',
  },
  {
    label: 'Quick Settings',
    vm: 'audit/07-quick-settings.png',
    cap: 'rocky-capsule-dark-quick-settings.png',
    context: 'Tray cluster · volume-popover',
  },
  {
    label: 'Loupe (Papers VM = Papers RL10)',
    vm: 'audit/03-nautilus-open.png',
    cap: 'rocky-capsule-dark-loupe.png',
    context: 'VM : référence fenêtre ouverte · Capsule : slot visionneur_images',
  },
  {
    label: 'Papers (PDF RL10)',
    vm: 'audit/03-nautilus-open.png',
    cap: 'rocky-capsule-dark-papers.png',
    context: 'VM : pas de capture Papers dédiée · Capsule : slot visionneur_pdf',
  },
];

/** Scènes Capsule seules — pas encore de capture VM Paramètres dans l’audit lab. */
const CAPSULE_ONLY = [
  {
    label: 'Paramètres — Apparence (sombre)',
    cap: 'rocky-capsule-dark-settings-appearance.png',
    context: 'Slot `themes` · panneau `appearance` · schéma clair/sombre fonctionnel',
  },
  {
    label: 'Paramètres — Écrans (sombre)',
    cap: 'rocky-capsule-dark-settings-displays.png',
    context: 'Slot `themes` · panneau `displays` · doc SUSE §3.9',
  },
  {
    label: 'Paramètres — Apparence (clair)',
    cap: 'rocky-capsule-light-settings-appearance.png',
    context: 'Slot `themes` · thème clair Capsule · tokens `--gnome-settings-*`',
  },
];

const fileInfo = (dir, name) => {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) {
    return { ok: false, path: p, bytes: 0 };
  }
  return { ok: true, path: p, bytes: fs.statSync(p).size };
};

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, {
  encoding: 'utf8',
  cwd: ROOT,
  timeout: opts.timeout || 120000,
  ...opts,
});

const lines = [];
lines.push('# Passe comparaison visuelle — Rocky Linux (VM ↔ CapsuleOS)');
lines.push('');
lines.push(`Généré : ${new Date().toISOString()}`);
lines.push('');
lines.push('Référence slots : [`linux-gnome-capsule-slots.md`](linux-gnome-capsule-slots.md) (Nautilus ≠ Nemo).');
lines.push('');

lines.push('## Assets PNG');
lines.push('');
lines.push('| Scène | VM | octets | Capsule | octets | Contexte |');
lines.push('|-------|-----|--------|---------|--------|----------|');

let missing = 0;
for (const pair of PAIRS) {
  const vm = fileInfo(VM_ASSETS, pair.vm);
  const cap = fileInfo(CAP_ASSETS, pair.cap);
  if (!vm.ok || !cap.ok) missing += 1;
  lines.push(
    `| ${pair.label} | ${vm.ok ? '✓' : '**manquant**'} | ${vm.bytes || '—'} | ${cap.ok ? '✓' : '**manquant**'} | ${cap.bytes || '—'} | ${pair.context} |`,
  );
}

lines.push('');
if (missing) {
  lines.push(`> **${missing}** paire(s) incomplète(s) — relancer \`vm-rocky-capture-host.sh\` et \`capture-capsule-rocky.mjs\`.`);
  lines.push('');
}

lines.push('## Assets PNG — Capsule seul (Paramètres GNOME)');
lines.push('');
lines.push('| Scène | Capsule | octets | Contexte |');
lines.push('|-------|---------|--------|----------|');

let capOnlyMissing = 0;
for (const row of CAPSULE_ONLY) {
  const cap = fileInfo(CAP_ASSETS, row.cap);
  if (!cap.ok) capOnlyMissing += 1;
  lines.push(
    `| ${row.label} | ${cap.ok ? '✓' : '**manquant**'} | ${cap.bytes || '—'} | ${row.context} |`,
  );
}

lines.push('');
if (capOnlyMissing) {
  lines.push(`> **${capOnlyMissing}** capture(s) Paramètres manquante(s) — \`node root/tools/lab/capture-capsule-rocky.mjs\`.`);
  lines.push('');
}

lines.push('## Checklist panel (état logique)');
lines.push('');

const panelOut = '/tmp/capsule-rocky-panel.json';
const panelRun = run('node', [
  'usr/lib/capsuleos/tools/lab/run-capsule-panel-browser.mjs',
], {
  env: {
    ...process.env,
    CAPSULE_PANEL_URL: `${HTTP_BASE}/OS/linux/families/redhat/rocky/index.html`,
    CAPSULE_PANEL_OUT: panelOut,
  },
  timeout: 180000,
});

if (panelRun.status === 0 && fs.existsSync(panelOut)) {
  lines.push('Export Capsule : `run-capsule-panel-browser.mjs` OK.');
} else {
  lines.push(`Export Capsule : échec ou absent (${HTTP_BASE} / Playwright).`);
}

const checklistRun = run('node', [
  'usr/lib/capsuleos/tools/lab/run-panel-checklist.mjs',
  '--id', 'linux-rocky',
  '--capsule-states', panelOut,
], { timeout: 300000 });

if (checklistRun.stdout) {
  lines.push('');
  lines.push('```');
  lines.push(checklistRun.stdout.trim());
  lines.push('```');
}

let checklistExit = checklistRun.status || 0;
const checklistErr = `${checklistRun.stderr || ''}${checklistRun.stdout || ''}`;
if (checklistExit !== 0 && /No route to host|Connection refused|ssh:/i.test(checklistErr)) {
  lines.push('');
  lines.push('> Checklist VM ignorée — lab Rocky injoignable (SSH). Relancer quand la VM est up.');
  checklistExit = 0;
}

lines.push('');
lines.push('## Rappels fidélité visuelle (GNOME)');
lines.push('');
lines.push('- **Fichiers** : ne pas appeler l’app VM « Nemo » — c’est **Nautilus** ; le slot **`nemo`** est l’identifiant gabarit CapsuleOS partagé.');
lines.push('- **Terminal** : VM **Ptyxis** ; Capsule **`terminal`** (invite `capsule@rocky` / profil Red Hat).');
lines.push('- **Dock** : favoris VM (8 icônes GNOME) vs dock Capsule (6 + accueil, modèle Fedora) — écart P1 documenté.');
lines.push('- **Thèmes** : `gsettings color-scheme` `default`/`prefer-light` ↔ `data-theme` dark/light + `gnome-theme` localStorage.');
lines.push('');
lines.push('## Lecture visuelle (passe manuelle)');
lines.push('');
lines.push('| Zone | VM (ground truth) | CapsuleOS | Verdict / action |');
lines.push('|------|-------------------|-----------|----------------|');
lines.push('| Barre supérieure + horloge | GNOME 47, `6 juin 00:33` (ligne) | `fedora-top-bar__center` absolu + `date.js` | Comparer `rocky-*-desktop.png` |');
lines.push('| Dock | 8 favoris GNOME natifs | 6 apps + accueil (modèle Fedora) | P1 — ne pas dupliquer Software/Calculator sans spec |');
lines.push('| **Fichiers** | **Nautilus** Adwaita, sidebar Places | Gabarit **`nemo`**, titre **Fichiers** | Tokens `nautilus.skin.css` / largeur fenêtre |');
lines.push('| Firefox | Navigator + barre RMZ | Slot `firefox` embed | Barre d’adresse / onglets |');
lines.push('| Terminal | **Ptyxis** | Slot **`terminal`**, profil `linux:redhat` | Prompt `capsule@rocky`, couleurs Ptyxis |');
lines.push('| Thème clair | `prefer-light` | `data-theme=light` + `html:has(#rocky)` | `tokens.css` section clair |');
lines.push('');
lines.push('Tailles PNG distinctes sur cette passe VM = fenêtres réellement différentes (écran réveillé).');

const outPath = path.join(ROOT, 'root/docs/inventaires/linux-rocky-comparaison-visuelle.md');
fs.writeFileSync(outPath, `${lines.join('\n')}\n`);
process.stdout.write(`OK ${outPath}\n`);
process.exit(missing ? 1 : checklistExit);
