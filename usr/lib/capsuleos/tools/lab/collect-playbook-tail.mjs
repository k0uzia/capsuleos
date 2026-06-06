#!/usr/bin/env node
/**
 * Playbook bout de chaîne (τ) — spécificités environnement (doc officielle + VM lab).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id linux-rocky
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  ROOT,
  loadRegistryEntry,
  readJsonIfExists,
} from './replication-chain-lib.mjs';
import { evaluateUniversal, tailPaths, toolkitId } from './playbook-general-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVENTORY = path.join(ROOT, 'etc/capsuleos/lab-inventory.json');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
  }
  return opts;
};

const loadHost = (registryId) => {
  if (!fs.existsSync(INVENTORY)) return null;
  const inv = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  return (inv.hosts || []).find((h) => h.registryId === registryId) || null;
};

const sshProbe = (host) => {
  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = host.sshIdentity
    ? path.join(process.env.HOME || '', host.sshIdentity.replace(/^~\//, ''))
    : path.join(process.env.HOME || '', '.ssh/capsuleos-lab');
  const script = `
export DISPLAY=${host.display || ':0'}
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus
echo "=== os-release ==="
cat /etc/os-release 2>/dev/null | head -5
echo "=== gnome-shell ==="
gnome-shell --version 2>/dev/null || true
echo "=== gcc ==="
gnome-control-center --version 2>/dev/null || true
`;
  const res = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, 'bash -s'],
    { input: script, encoding: 'utf8', timeout: 30000 },
  );
  return res.status === 0 ? (res.stdout || '').trim() : null;
};

const OFFICIAL_SOURCES = {
  gnome: [
    { title: 'GNOME Help', url: 'https://help.gnome.org/users/gnome-help/stable/', role: 'comportement utilisateur' },
    { title: 'GNOME HIG', url: 'https://developer.gnome.org/hig/', role: 'patterns UI' },
    { title: 'gsettings-desktop-schemas', url: 'https://gitlab.gnome.org/GNOME/gsettings-desktop-schemas', role: 'sémantique clés' },
  ],
  rocky: [
    { title: 'Rocky Linux 10 Release Notes', url: 'https://docs.rockylinux.org/release_notes/10_0/', role: 'composants EL10' },
  ],
};

const main = () => {
  const opts = parseArgs();
  const pb = evaluateUniversal(opts.id);
  if (!pb.state.PbT) {
    process.stderr.write(
      '⚠ R-PB3 : collecte τ avant PbT — brouillon seulement ; Pbτ restera false jusqu’à clôture toolkit\n',
    );
  }
  const entry = loadRegistryEntry(opts.id);
  const tk = toolkitId(opts.id);
  const vendor = entry.vendor || opts.id.replace(/^linux-/, '');
  const paths = tailPaths(opts.id);

  const vmJson = readJsonIfExists(path.join(ROOT, 'root/docs/inventaires', `${opts.id}-vm.json`));
  const visualInv = readJsonIfExists(path.join(ROOT, 'root/docs/inventaires', `${opts.id}-gnome-settings-visual-investigation.json`));
  const parityMd = path.join(ROOT, 'root/docs/inventaire-parite-rocky.md');
  const host = loadHost(opts.id);
  const vmProbe = host ? sshProbe(host) : null;

  const gapsFromVisual = (visualInv?.investigations || [])
    .filter((i) => i.status === 'documented' && i.capsuleParity?.visualMatch === 'partial')
    .map((i) => ({
      controlId: i.controlId,
      priority: i.capsuleParity?.parityPriority || 'P1',
      gapNotes: i.capsuleParity?.gapNotes,
      source: 'visual-investigation',
    }));

  const out = {
    registryId: opts.id,
    vendor,
    toolkit: tk,
    branchId: entry.branchId || null,
    displayName: entry.displayName,
    status: 'documented',
    generatedAt: new Date().toISOString(),
    investigator: 'collect-playbook-tail.mjs',
    source: 'procedure-playbook-general.md §couche-τ',
    vmEnvironment: vmProbe ? { probeExcerpt: vmProbe.slice(0, 2000) } : { probeExcerpt: null, note: 'M indisponible ou SSH échec' },
    officialDocCrossCheck: [
      ...(OFFICIAL_SOURCES[tk] || []),
      ...(OFFICIAL_SOURCES[vendor] || []),
    ].map((d) => ({
      ...d,
      matchesObservation: null,
      delta: null,
      reviewedAt: null,
    })),
    vmInventoryRef: vmJson ? `root/docs/inventaires/${opts.id}-vm.json` : null,
    parityDocRef: fs.existsSync(parityMd) ? 'root/docs/inventaire-parite-rocky.md' : null,
    gaps: gapsFromVisual,
    agentInteractionNotes: [
      'Compléter delta après lecture doc officielle (VM prime en cas de contradiction).',
      'Écarts P0 playbook τ → patch skin minimal sous home/ avant merge.',
      'Écarts P1/P2 → documenter dans gaps[] sans bloquer H6 si PbΣ atteint.',
    ],
    h5Completed: gapsFromVisual
      .filter((g) => (g.gapNotes || '').startsWith('H5') || (g.gapNotes || '').startsWith('P2'))
      .map((g) => g.controlId),
    nextH5: gapsFromVisual
      .filter((g) => !(g.gapNotes || '').startsWith('H5') && !(g.gapNotes || '').startsWith('P2') && g.priority !== 'P2')
      .map((g) => ({
        target: g.controlId,
        priority: g.priority,
        action: 'aligner capsuleParity / CSS / dataset',
      })),
    h6Ready: gapsFromVisual.length > 0
      && gapsFromVisual.every(
        (g) => (g.gapNotes || '').startsWith('H5')
          || (g.gapNotes || '').startsWith('P2')
          || g.priority === 'P2',
      ),
  };

  fs.writeFileSync(paths.json, `${JSON.stringify(out, null, 2)}\n`);

  const md = [
    `# Playbook bout de chaîne (τ) — ${entry.displayName}`,
    '',
    `Généré : ${out.generatedAt}`,
    '',
    '## Spécificités environnement',
    '',
    `- Registry : \`${opts.id}\``,
    `- Vendor : ${vendor} · Toolkit : ${tk} · Branche : ${entry.branchId || '—'}`,
    '',
    '## Documentation officielle à confronter',
    '',
    ...out.officialDocCrossCheck.map((d) => `- [${d.title}](${d.url}) — ${d.role}`),
    '',
    '## Écarts issus enquête / VM',
    '',
    ...out.gaps.map((g) => `- **${g.controlId}** (${g.priority}) : ${g.gapNotes || '—'}`),
    '',
    '## H5 appliqués',
    '',
    ...(out.h5Completed.length
      ? out.h5Completed.map((id) => `- ✓ ${id}`)
      : ['- —']),
    '',
    '## Prochaines actions H5 (restantes)',
    '',
    ...(out.nextH5.length
      ? out.nextH5.map((n) => `- **${n.target}** (${n.priority}) : ${n.action}`)
      : ['- Aucune — prêt H6']),
    '',
    `**h6Ready** : ${out.h6Ready ? 'oui' : 'non'}`,
    '',
  ].join('\n');
  fs.writeFileSync(paths.md, `${md}\n`);

  process.stdout.write(`OK ${paths.json}\nOK ${paths.md} — Pbτ documented\n`);
};

main();
