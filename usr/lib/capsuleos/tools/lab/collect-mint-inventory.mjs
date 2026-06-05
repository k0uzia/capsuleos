#!/usr/bin/env node
/**
 * Collecte l'inventaire VM Mint (SSH) et compare avec CapsuleOS linux-mint.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs
 *   node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs --write-doc
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');
const VM_SCRIPT = path.join(ROOT, 'root/tools/lab/vm-mint-inventory.sh');
const OUT_JSON = path.join(ROOT, 'root/docs/inventaires/linux-mint-vm.json');
const OUT_MD = path.join(ROOT, 'root/docs/inventaire-parite-mint-vm.md');
const CAPSULE_INDEX = path.join(ROOT, 'home/Debian/Mint/index.html');
const CAPSULE_PROFILE = path.join(ROOT, 'home/Debian/Mint/content/profile-data.js');

const CAPSULE_PANEL_SLOTS = [
  { slot: 'mainMenu', label: 'Menu Mint', vmMatch: 'menu' },
  { slot: 'nemo', label: 'Nemo / Fichiers', vmDesktop: 'nemo.desktop', vmIcon: 'system-file-manager' },
  { slot: 'firefox', label: 'Firefox', vmDesktop: 'firefox.desktop', vmIcon: 'firefox' },
  { slot: 'terminal', label: 'Terminal', vmDesktop: 'org.gnome.Terminal.desktop', vmIcon: 'org.gnome.Terminal' },
  { slot: 'themes', label: 'Thèmes / Paramètres', vmDesktop: null, p2Pedagogy: true },
  { slot: 'librewriter', label: 'LibreOffice Writer (panel)', vmDesktop: null, capsuleOnly: true },
  { slot: 'checklist', label: 'Missions (pédagogie)', vmDesktop: null, capsuleOnly: true },
];

const CAPSULE_TRAY = [
  { id: 'updates', label: 'Mises à jour', vmCandidates: ['notifications'] },
  { id: 'xapp-status', label: 'Statut XApp', vmCandidates: ['xapp-status'] },
  { id: 'printers', label: 'Imprimantes', vmCandidates: ['printers'] },
  { id: 'removable', label: 'Supports amovibles', vmCandidates: ['removable-drives'] },
  { id: 'keyboard', label: 'Clavier', vmCandidates: ['keyboard'] },
  { id: 'network', label: 'Réseau', vmCandidates: ['network'] },
  { id: 'volume', label: 'Volume', vmCandidates: ['sound'] },
  { id: 'power', label: 'Alimentation', vmCandidates: ['power'] },
  { id: 'cornerbar', label: 'Coin bureau', vmCandidates: ['cornerbar'] },
  { id: 'clock', label: 'Horloge / calendrier', vmCandidates: ['calendar'] },
];

const expandHome = (p) => {
  if (!p || p[0] !== '~') return p;
  return path.join(process.env.HOME || '', p.slice(2));
};

const loadHost = () => {
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const host = (inv.hosts || []).find((h) => h.registryId === 'linux-mint');
  if (!host) throw new Error('linux-mint absent de lab-inventory.json');
  return host;
};

const runVmInventory = (host) => {
  const at = host.ssh.indexOf('@');
  const target = host.ssh;
  const identity = expandHome(host.sshIdentity || '~/.ssh/capsuleos-lab');
  const script = fs.readFileSync(VM_SCRIPT, 'utf8');
  const res = spawnSync(
    'ssh',
    [
      '-o', 'BatchMode=yes',
      '-o', 'IdentitiesOnly=yes',
      '-i', identity,
      target,
      'DISPLAY=:0 bash -s',
    ],
    { input: script, encoding: 'utf8', timeout: 120000 },
  );
  if (res.status !== 0) {
    throw new Error((res.stderr || res.stdout || '').trim());
  }
  const line = (res.stdout || '').trim().split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{')).pop();
  return JSON.parse(line || '{}');
};

const capsuleSkinPresent = () =>
  fs.existsSync(CAPSULE_INDEX) && fs.existsSync(CAPSULE_PROFILE);

const readCapsuleProfile = () => {
  if (!fs.existsSync(CAPSULE_PROFILE)) {
    return { version: '', name: '', absent: true };
  }
  const raw = fs.readFileSync(CAPSULE_PROFILE, 'utf8');
  const ver = raw.match(/version:\s*'([^']+)'/);
  const name = raw.match(/name:\s*'([^']+)'/);
  return { version: ver ? ver[1] : '', name: name ? name[1] : '' };
};

const readCapsuleLaunchers = () => {
  if (!fs.existsSync(CAPSULE_INDEX)) {
    return [];
  }
  const html = fs.readFileSync(CAPSULE_INDEX, 'utf8');
  const re = /data-link="([^"]+)"[^>]*title="([^"]*)"/g;
  const launchers = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1] !== 'mainMenu' || launchers.every((l) => l.slot !== m[1])) {
      const inFooter = html.indexOf('footer', m.index) < m.index && m.index < html.indexOf('</footer>');
      if (inFooter) launchers.push({ slot: m[1], title: m[2] });
    }
  }
  const seen = {};
  return launchers.filter((l) => {
    if (seen[l.slot]) return false;
    seen[l.slot] = true;
    return l.slot !== undefined;
  });
};

const compareVersions = (vm, capsule) => {
  const vmRel = vm.os && vm.os.release ? vm.os.release : '';
  const capVer = capsule.version || '';
  const match = vmRel && capVer.includes(vmRel);
  return { vm: vmRel, capsule: capVer, status: match ? 'aligné' : 'à aligner' };
};

const buildReport = (vm) => {
  const capsuleProfile = readCapsuleProfile();
  const capsuleLaunchers = readCapsuleLaunchers();
  const lines = [];

  lines.push('# Inventaire parité — Linux Mint VM → CapsuleOS');
  lines.push('');
  lines.push('Procédure : [`procedure-clonage-os-depuis-vm.md`](procedure-clonage-os-depuis-vm.md) · Statut clone : [`inventaires/linux-mint-clone-status.md`](inventaires/linux-mint-clone-status.md)');
  lines.push('');
  lines.push(`Collecte : \`${vm.collectedAt || '?'}\` · Registre : \`linux-mint\` · JSON : [\`inventaires/linux-mint-vm.json\`](inventaires/linux-mint-vm.json)`);
  lines.push('');
  if (!capsuleSkinPresent()) {
    lines.push('> **CapsuleOS** : skin `home/Debian/Mint/` absent — recréer via [`procedure-clonage-os-depuis-vm.md`](procedure-clonage-os-depuis-vm.md) (phases 2–7).');
    lines.push('');
  }
  lines.push('## Versions');
  lines.push('');
  lines.push('| Composant | VM réelle | CapsuleOS | Action |');
  lines.push('|-----------|-----------|-----------|--------|');
  const verCmp = compareVersions(vm, capsuleProfile);
  const verAction = capsuleProfile.absent
    ? 'recréer skin (phase 2)'
    : verCmp.status === 'aligné'
      ? 'OK'
      : 'mettre à jour `profile-data.js`';
  const capVerCell = capsuleProfile.absent ? '— (skin absent)' : capsuleProfile.version;
  const verStatus = capsuleProfile.absent ? 'à recréer' : verCmp.status;
  lines.push(`| Distribution | Mint ${vm.os && vm.os.release} ${vm.os && vm.os.codename} | ${capVerCell} | **${verStatus}** — ${verAction} |`);
  const cin = (vm.versions && vm.versions.cinnamon) || '—';
  const nem = (vm.versions && vm.versions.nemo) || '—';
  const ff = (vm.versions && vm.versions.firefox) || '—';
  lines.push(`| Cinnamon | ${cin} | profil + brief | **P2** — \`${cin}\` dans brief / À propos |`);
  lines.push(`| Nemo | ${nem} | template nemo | OK |`);
  lines.push(`| Firefox | ${ff} | embed | OK |`);
  lines.push('');
  lines.push('## Panel');
  lines.push('');
  lines.push('| Aspect | VM | CapsuleOS |');
  lines.push('|--------|-----|-----------|');
  lines.push(`| Hauteur | ${vm.panel && vm.panel.height} | ~40px (CSS footer) |`);
  lines.push('| Lanceurs | menu + **grouped-window-list** | Icônes fixes (nemo, ff, term, …) |');
  lines.push('| Liste fenêtres | applet grouped-window-list | `#taskbar-window-list` |');
  lines.push('');
  lines.push('### Lanceurs panel (checklist P0)');
  lines.push('');
  lines.push('| Slot CapsuleOS | VM | Statut |');
  lines.push('|------------------|-----|--------|');
  const vmApps = (vm.apps && vm.apps.panelCore) || [];
  CAPSULE_PANEL_SLOTS.forEach((spec) => {
    const vmApp = vmApps.find((a) => a.desktop === spec.vmDesktop);
    let status = 'OK';
    if (spec.capsuleOnly) status = 'CapsuleOS (pédagogie)';
    else if (spec.p2Pedagogy) status = 'P2 — slot Paramètres (favori bureau VM)';
    else if (spec.p2 && !vmApp) status = 'P2 — optionnel VM';
    else if (!vmApp && spec.vmDesktop) status = 'Manquant VM';
    else if (vmApp) status = `OK (${vmApp.icon})`;
    lines.push(`| ${spec.slot} | ${spec.label} | ${status} |`);
  });
  lines.push('');
  lines.push('## Zone tray');
  lines.push('');
  lines.push('| CapsuleOS | VM (applets) |');
  lines.push('|-----------|----------------|');
  const vmTray = vm.tray || [];
  CAPSULE_TRAY.forEach((t) => {
    const found = t.vmCandidates.some((c) => vmTray.indexOf(c) >= 0);
    lines.push(`| ${t.label} | ${found ? 'oui' : 'partiel / stylisé'} |`);
  });
  lines.push('');
  lines.push(`Applets VM : ${vmTray.join(', ') || '—'}`);
  lines.push('');
  lines.push('## Thèmes & assets');
  lines.push('');
  lines.push('| Élément | VM | CapsuleOS |');
  lines.push('|---------|-----|-----------|');
  lines.push(`| Thème Cinnamon | ${vm.themes && vm.themes.cinnamon} | Mint-Y (CSS) |`);
  lines.push(`| GTK | ${vm.themes && vm.themes.gtk} | variables skin |`);
  lines.push(`| Icônes | ${vm.themes && vm.themes.icons} | Mint-Y / cinnamon icons |`);
  lines.push(`| Fond | ${(vm.themes && vm.themes.wallpaper || '').slice(0, 60)}… | \`default_background.jpg\` | OK |`);
  lines.push('');
  lines.push('## Applications et favoris bureau');
  lines.push('');
  lines.push('| Favori VM (.desktop) | CapsuleOS | Statut |');
  lines.push('|----------------------|-----------|--------|');
  lines.push('| org.gnome.Calculator.desktop | Bureau → menu → terminal | P1 simulation |');
  lines.push('| org.gnome.Calendar.desktop | Bureau → popover horloge | OK |');
  lines.push('| org.x.editor.desktop (xed) | Bureau + `text_editor` | P2 clone |');
  lines.push('| mintinstall.desktop | Bureau + `update_manager` | OK |');
  lines.push('| cinnamon-settings.desktop | Bureau → `themes` | OK |');
  lines.push('');
  lines.push('| Panel CapsuleOS | VM panel | Statut |');
  lines.push('|-----------------|------------|--------|');
  lines.push('| librewriter | absent | CapsuleOnly pédagogie |');
  lines.push('| checklist | absent | CapsuleOnly |');
  lines.push('');
  lines.push('## Système de fichiers simulé');
  lines.push('');
  lines.push('| Chemin | VM (référence) | CapsuleOS | Statut |');
  lines.push('|--------|------------------|-----------|--------|');
  lines.push('| Documents | XDG Documents | Nemo sidebar + `CAPSULE_CONTENT_ROOT` | P0 comparateur étape 5 |');
  lines.push('| Téléchargements | XDG Downloads | Nemo sidebar | OK |');
  lines.push('| Bureau | XDG Desktop | Explorateur + raccourcis `#desktop` | OK |');
  lines.push('');
  lines.push('## Backlog par priorité');
  lines.push('');
  lines.push('### P0 — fidélité bloquante');
  lines.push('- Panel : running-link / active-link / minimize (`taskbar-launcher-state.js`)');
  lines.push('- Nemo sidebar Documents (`compare-os-parity` étape 5)');
  lines.push('- Checklist panel CapsuleOS 6/6 (`run-capsule-panel-browser.mjs`)');
  lines.push('');
  lines.push('### P1 — assumé');
  lines.push('- Lanceurs fixes vs `grouped-window-list` (pédagogie)');
  lines.push('- Calculatrice → terminal / menu (pas GNOME Calculator)');
  lines.push('- Lab VM : étape Firefox focus fragile (multi-fenêtres)');
  lines.push('');
  lines.push('### P2 — livré ou en cours');
  lines.push('- Fond `default_background.jpg`, icônes `vendors/mint/panel/`');
  lines.push('- Tray : xapp-status, cornerbar, printers, keyboard, power');
  lines.push('- Favoris bureau + xed (`text_editor`)');
  lines.push('- Effets fenêtre Cinnamon (`cinnamon-window-effects.js`)');
  lines.push('- Versions composants dans profil / brief');
  lines.push('');
  lines.push('### P3 — hors scope');
  lines.push('- `button-layout` Muffin, multi-écrans, workspaces');
  lines.push('- Applet grouped-window-list natif');
  lines.push('');
  lines.push('### CapsuleOnly');
  lines.push('- checklist, librewriter panel, retour accueil');
  lines.push('');
  lines.push('## Commandes');
  lines.push('');
  lines.push('```bash');
  lines.push('node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs');
  lines.push('node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs --write-doc');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
};

const parseArgs = () => {
  return { writeDoc: process.argv.includes('--write-doc') };
};

const main = () => {
  const opts = parseArgs();
  const host = loadHost();
  const vm = runVmInventory(host);

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(vm, null, 2));
  process.stdout.write(`OK ${OUT_JSON}\n`);

  const report = buildReport(vm);
  if (opts.writeDoc) {
    fs.writeFileSync(OUT_MD, report);
    process.stdout.write(`OK ${OUT_MD}\n`);
    const gen = spawnSync(
      'node',
      [path.join(ROOT, 'usr/lib/capsuleos/tools/lab/generate-mint-apps-catalog.mjs'), '--write'],
      { encoding: 'utf8', cwd: ROOT },
    );
    if (gen.status === 0 && gen.stdout) {
      process.stdout.write(`${gen.stdout.trim()}\n`);
    }
  } else {
    process.stdout.write(`\n${report}`);
  }
};

main();
