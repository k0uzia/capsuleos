#!/usr/bin/env node
/**
 * Génère un brief agent Markdown depuis etc/capsuleos/os-registry.json.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-elementary
 *   node usr/lib/capsuleos/tools/print-agent-brief.mjs --list --tier P2 --status planned
 *   node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-arch --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const BRIEFS_DIR = path.join(ROOT, 'root/docs/briefs');

const FAMILY_SKILL = {
  linux: 'os-linux',
  windows: 'os-windows',
  macos: 'os-macos',
  android: 'os-android',
  ios: 'os-ios',
  bsd: 'os-bsd',
  chromeos: 'os-chromeos',
  harmonyos: 'os-harmonyos',
  unix: 'os-unix',
  retro: 'os-stub',
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { list: false, tier: null, status: null, write: false, ids: [] };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--list') opts.list = true;
    else if (a === '--write') opts.write = true;
    else if (a === '--tier' && args[i + 1]) {
      opts.tier = args[++i];
    } else if (a === '--status' && args[i + 1]) {
      opts.status = args[++i];
    } else if (!a.startsWith('--')) opts.ids.push(a);
  }
  return opts;
};

const loadRegistry = () => JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));

const slugFromId = (id) => id.replace(/^linux-/, '').replace(/^windows-/, '').replace(/^macos-/, '');

const suggestFacade = (entry) => {
  if (entry.facade) return entry.facade;
  if (entry.family === 'linux') {
    const slug = slugFromId(entry.id);
    const vendor = entry.vendor || slug;
    if (['fedora'].includes(slug) || entry.vendor === 'fedora') {
      return `OS/linux/families/redhat/${slug}/index.html`;
    }
    if (['opensuse'].includes(slug) || entry.vendor === 'opensuse') {
      return `OS/linux/families/suse/${slug}/index.html`;
    }
    return `OS/linux/families/debian/${slug}/index.html`;
  }
  if (entry.family === 'windows') {
    return `OS/windows/${slugFromId(entry.id)}/index.html`;
  }
  if (entry.family === 'macos') {
    return `OS/macos/${slugFromId(entry.id)}/index.html`;
  }
  return `OS/${entry.family}/index.html`;
};

const suggestSkin = (entry, facade) => {
  if (entry.skin) return entry.skin;
  if (entry.family !== 'linux') return null;
  const familyDir = facade.includes('/redhat/') ? 'RedHat' : facade.includes('/suse/') ? 'SUSE' : 'Debian';
  const raw = entry.vendor || slugFromId(entry.id);
  const folder = raw
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  return `home/${familyDir}/${folder}/index.html`;
};

const findReferenceEntry = (registry, entry) => {
  const tk = entry.toolkit;
  if (!tk) return null;
  return registry.entries.find(
    (e) => e.status === 'active' && e.toolkit === tk && e.id !== entry.id
  );
};

const toolkitPack = (toolkitId) => (toolkitId ? `toolkits/${toolkitId}` : '—');
const vendorPack = (vendor) => (vendor ? `vendors/${vendor}` : '—');

const buildBrief = (registry, entry) => {
  const facade = suggestFacade(entry);
  const skin = suggestSkin(entry, facade);
  const ref = findReferenceEntry(registry, entry);
  const osSkill = (entry.skills && entry.skills[0]) || FAMILY_SKILL[entry.family] || 'os-orchestrator';
  const explorer = entry.explorerTemplate || '—';
  const sources = (entry.sources || [])
    .map((s) => `- ${s.type}: [${s.label}](${s.url || '#'})`)
    .join('\n');

  const lines = [
    `# Brief agent — ${entry.displayName || entry.id}`,
    '',
    '> Généré par `print-agent-brief.mjs` — à copier dans la tâche agent ou committer sous `root/docs/briefs/`.',
    '',
    '## Contexte',
    '',
    `- **ID registre** : \`${entry.id}\``,
    `- **Famille** : ${entry.family}`,
    `- **Tier** : ${entry.tier || '—'} · **Statut** : ${entry.status || '—'} · **Maturité** : ${entry.maturity != null ? entry.maturity : '—'}`,
    `- **Toolkit** : ${entry.toolkit || '—'} (${toolkitPack(entry.toolkit)})`,
    `- **Vendor** : ${entry.vendor || '—'} (${vendorPack(entry.vendor)})`,
    `- **Shell** : ${entry.shell || '—'} · **Explorateur** : ${explorer}`,
    `- **embedKey** / **bodyId** : \`${entry.embedKey || slugFromId(entry.id)}\` / \`${entry.bodyId || slugFromId(entry.id)}\``,
    '',
  ];

  if (sources) {
    lines.push('## Sources design', '', sources, '');
  }

  lines.push(
    '## Skills & formation',
    '',
    '1. `onboarding` → H0–H2 : `node usr/lib/capsuleos/tools/validate-all.mjs`',
    `2. \`${osSkill}\` + \`role-integrator\` (skin) ; \`role-graphic-artist\` si pack vendor`,
    '3. Doc : [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md)',
    '',
    '## Fichiers canon',
    '',
    '- `etc/capsuleos/os-registry.json`',
    `- Profil cible : \`etc/capsuleos/profiles/${entry.id}.json\``,
    '- `usr/share/capsuleos/assets/manifest.json`',
    '- [manifeste-noyau.md](../../docs/manifeste-noyau.md) · [contrib.md § toolkits](../../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui) (si Linux)',
    '',
    '## Chemins proposés',
    '',
    `- **Façade** : \`${facade}\`${entry.facade ? '' : ' _(à créer)_'}`,
    skin ? `- **Skin miroir** : \`${skin}\`${entry.skin ? '' : ' _(à créer)_'}` : '',
    `- **Pack toolkit** : \`assets/images/${toolkitPack(entry.toolkit)}/\``,
    entry.vendor ? `- **Pack vendor** : \`assets/images/${vendorPack(entry.vendor)}/\`` : '',
    ''
  );

  if (ref) {
    lines.push(
      '## Référence à copier (même toolkit actif)',
      '',
      `- \`${ref.id}\` — façade \`${ref.facade}\`${ref.skin ? `, skin \`${ref.skin}\`` : ''}`,
      ''
    );
  }

  lines.push(
    '## Livrables',
    '',
    '1. Entrée registre à jour (`facade`, `skin`, `status` si passage beta/active)',
    '2. `skin.profile.json` (façade + home) + `etc/capsuleos/profiles/<id>.json`',
    '3. Façade + miroir home ; boot : `capsule-resource.js` → `capsule-skin-boot.js`',
    '4. Tokens CSS / `content/strings.json` si Linux',
    '5. `validate-all.mjs` → exit 0',
    '6. Regen embed Linux si templates/strings : `linux/build-linux-embed.mjs`',
    '7. Smoke `file://` : shell, menu, 1 app, explorateur',
    '',
    '## Gates',
    '',
    '```bash',
    'node usr/lib/capsuleos/tools/validate-all.mjs',
    '```',
    '',
    '## Interdits',
    '',
    '- Fork `contentLoader` / `CapsuleWindow`',
    '- Images hors `usr/share/capsuleos/assets/` et `home/public/Images/`',
    '- `CAPSULE_MEDIA_BASE` dans profil ; README sous `OS/`',
    '- `?.` / `??` / object spread dans JS runtime',
    ''
  );

  return lines.filter((l) => l !== undefined).join('\n');
};

const opts = parseArgs();
const registry = loadRegistry();

if (opts.list) {
  const filtered = registry.entries.filter((e) => {
    if (opts.tier && e.tier !== opts.tier) return false;
    if (opts.status && e.status !== opts.status) return false;
    return true;
  });
  console.log(`Entrées (${filtered.length}) :`);
  filtered.forEach((e) => {
    console.log(`  ${e.id}\t${e.tier || '?'}\t${e.status}\t${e.displayName || ''}`);
  });
  process.exit(0);
}

if (!opts.ids.length) {
  console.error('Usage: print-agent-brief.mjs <id> | --list [--tier P2] [--status planned] [--write]');
  process.exit(1);
}

for (const id of opts.ids) {
  const entry = registry.entries.find((e) => e.id === id);
  if (!entry) {
    console.error(`✗ Entrée introuvable: ${id}`);
    process.exit(1);
  }
  const brief = buildBrief(registry, entry);
  if (opts.write) {
    fs.mkdirSync(BRIEFS_DIR, { recursive: true });
    const out = path.join(BRIEFS_DIR, `${id}.md`);
    fs.writeFileSync(out, brief);
    console.log(`✓ Brief écrit : ${path.relative(ROOT, out)}`);
  } else {
    console.log(brief);
  }
}
