#!/usr/bin/env node
/**
 * Génère la hiérarchie skills agent : vendor, distribution, version, langage.
 * Source : etc/capsuleos/os-registry.json
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/seed-agent-skills.mjs           # dry-run
 *   node usr/lib/capsuleos/tools/seed-agent-skills.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const REGISTRY = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const SKILLS_ROOT = path.join(ROOT, 'root/skills');

const WRITE = process.argv.includes('--write');

const FAMILY_OS_SKILL = {
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
    other: 'os-stub',
};

const LANGUAGES = [
    {
        id: 'javascript',
        name: 'capsuleos-lang-javascript',
        label: 'JavaScript vanilla ES6',
        when: 'JS runtime sous usr/lib/capsuleos, OS/, home/, window/, shells/',
        gates: ['validate-vanilla-js.mjs', 'validate-quality-all.mjs'],
        sibling: 'code-quality',
        paths: ['usr/lib/capsuleos/', 'OS/', 'home/'],
    },
    {
        id: 'json',
        name: 'capsuleos-lang-json',
        label: 'JSON canonique',
        when: 'os-registry.json, skin.profile.json, strings.json, manifest, profils etc/',
        gates: ['validate-json.mjs', 'validate-skin-profiles.mjs'],
        sibling: 'code-quality',
        paths: ['etc/capsuleos/', 'home/', 'var/lib/capsuleos/generated/'],
    },
    {
        id: 'css',
        name: 'capsuleos-lang-css',
        label: 'CSS skins & toolkits',
        when: 'style/, themes/, *.skin.css, variables-linux, window-chrome',
        gates: ['validate-css-asset-urls.mjs'],
        sibling: 'role-web-designer',
        paths: ['usr/share/capsuleos/themes/', 'home/', 'contrib.md'],
    },
    {
        id: 'html',
        name: 'capsuleos-lang-html',
        label: 'HTML façades & apps',
        when: 'index.html, gabarits apps, data-link, embed offline',
        gates: ['validate-static-html-assets.mjs', 'audit-data-links.mjs'],
        sibling: 'link-routing',
        paths: ['OS/', 'home/', 'usr/share/capsuleos/linux/apps/'],
    },
    {
        id: 'markdown',
        name: 'capsuleos-lang-markdown',
        label: 'Markdown documentation',
        when: 'root/docs/, skills/, contrib.md, briefs agent',
        gates: [],
        sibling: 'role-manager',
        paths: ['root/', 'contrib.md', 'writing.md'],
    },
    {
        id: 'node-mjs',
        name: 'capsuleos-lang-node-mjs',
        label: 'Outils Node (.mjs)',
        when: 'scripts build/validate sous usr/lib/capsuleos/tools/',
        gates: ['validate-all.mjs'],
        sibling: 'kernel-guardian',
        paths: ['usr/lib/capsuleos/tools/'],
    },
];

function readRegistry() {
    return JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
}

/** Entrées dont l’id encode une version (windows-11, macos-sonoma, ios-15). */
function deriveVersionSlug(entry) {
    const id = entry.id;
    const versionTail = id.match(/^(windows|macos|ios|android)-(.+)$/);
    if (versionTail && versionTail[2] && versionTail[2] !== 'vanilla') {
        return id;
    }
    const semver = (entry.displayName || '').match(/\b(\d{2}\.\d{1,2})\b/);
    if (semver) {
        return `${id}-${semver[1].replace('.', '-')}`;
    }
    const quoted = (entry.displayName || '').match(/"([^"]+)"/);
    if (quoted) {
        return `${id}-${quoted[1].toLowerCase().replace(/\s+/g, '-')}`;
    }
    return null;
}

function vendorSkillName(vendor) {
    return `capsuleos-vendor-${vendor}`;
}

function distroSkillName(entryId) {
    return `capsuleos-distro-${entryId}`;
}

function versionSkillName(versionSlug) {
    return `capsuleos-version-${versionSlug}`;
}

function writeSkill(relDir, frontmatter, body) {
    const dir = path.join(SKILLS_ROOT, relDir);
    const file = path.join(dir, 'SKILL.md');
    const content = `---\n${frontmatter}\n---\n\n${body}\n`;
    if (WRITE) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(file, content, 'utf8');
    }
    return file;
}

function buildVendorSkill(vendor, entries) {
    const families = [...new Set(entries.map((e) => e.family))];
    const osSkill = [...new Set(families.map((f) => FAMILY_OS_SKILL[f] || 'os-stub'))];
    const distros = entries.map((e) => e.id).sort();
    const name = vendorSkillName(vendor);
    const fm = [
        `name: ${name}`,
        `description: CapsuleOS vendor ${vendor} — distributions ${distros.slice(0, 5).join(', ')}${distros.length > 5 ? ', …' : ''}. Use when working on ${vendor} branding, assets vendors/${vendor}, or any ${vendor} simulated OS entry.`,
    ].join('\n');
    const body = `# Vendor — ${vendor}

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | \`${vendor}\` |
| Familles | ${families.join(', ')} |
| Skill famille OS | ${osSkill.map((s) => `\`${s}\``).join(', ')} |

## Distributions (registre)

${distros.map((id) => `- [\`${id}\`](../distributions/${id}/SKILL.md) — skill \`${distroSkillName(id)}\``).join('\n')}

## Chaîne agent

1. \`onboarding\` → \`validate-all.mjs\`
2. Skill **famille** : ${osSkill.join(' ou ')}
3. Skill **distribution** : \`capsuleos-distro-<id>\` pour l’entrée ciblée
4. Skill **version** si applicable : \`capsuleos-version-*\`
5. Skill **langage** selon fichiers touchés : \`capsuleos-lang-javascript\`, \`capsuleos-lang-css\`, …

## Assets

- Pack vendor : \`usr/share/capsuleos/assets/images/vendors/${vendor}/\`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

\`\`\`bash
node usr/lib/capsuleos/tools/validate-all.mjs
\`\`\`

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)
`;
    return writeSkill(`vendors/${vendor}`, fm, body);
}

function buildDistroSkill(entry, registry) {
    const osSkill = FAMILY_OS_SKILL[entry.family] || 'os-stub';
    const vendorSkill = vendorSkillName(entry.vendor);
    const name = distroSkillName(entry.id);
    const versionSlug = deriveVersionSlug(entry);
    const fm = [
        `name: ${name}`,
        `description: CapsuleOS distribution ${entry.displayName} (${entry.id}) — ${entry.family}, tier ${entry.tier}, ${entry.status}. Use when editing ${entry.facade || entry.skin || entry.id}, ${entry.toolkit || 'shell'} toolkit, or ${entry.vendor} vendor assets.`,
    ].join('\n');
    const paths = [];
    if (entry.facade) paths.push(`- Façade : [\`${entry.facade}\`](../../../${entry.facade})`);
    if (entry.skin) paths.push(`- Skin : [\`${entry.skin}\`](../../../${entry.skin})`);
    const versionLine = versionSlug
        ? `- Version : [\`${versionSlug}\`](../versions/${versionSlug}/SKILL.md)`
        : '- Version : (entrée catalogue unique — pas de skill version séparé)';

    const body = `# Distribution — ${entry.displayName}

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | \`${entry.id}\` |
| Vendor | [\`${entry.vendor}\`](../vendors/${entry.vendor}/SKILL.md) |
| Famille | \`${entry.family}\` |
| Tier / statut | ${entry.tier} / ${entry.status} |
| Toolkit | ${entry.toolkit || '—'} |
| embedKey | \`${entry.embedKey || entry.bodyId || '—'}\` |

## Chemins

${paths.join('\n') || '- (façade à définir)'}
${versionLine}

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | \`onboarding\` |
| 2 | \`${osSkill}\` (famille) |
| 3 | \`${vendorSkill}\` (vendor) |
| 4 | \`${name}\` (cette fiche) |
| 5 | \`capsuleos-lang-*\` selon fichiers |

Brief détaillé : \`node usr/lib/capsuleos/tools/print-agent-brief.mjs ${entry.id}\`

## Build / gates

\`\`\`bash
node usr/lib/capsuleos/tools/validate-all.mjs
${entry.family === 'linux' ? 'node usr/lib/capsuleos/tools/build-embeds-all.mjs  # si apps/strings\n' : ''}\`\`\`

## Ne pas

- Doc README sous \`OS/\`
- Médias hors \`usr/share/capsuleos/assets/\` et \`home/public/Images/\`

## Références

- [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md)
- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
`;
    return writeSkill(`distributions/${entry.id}`, fm, body);
}

function buildVersionSkill(entry, versionSlug) {
    const name = versionSkillName(versionSlug);
    const distroSkill = distroSkillName(entry.id);
    const fm = [
        `name: ${name}`,
        `description: CapsuleOS version slice ${entry.displayName} (${versionSlug}) — extends distribution ${entry.id}. Use when the task targets this specific release/codename/build, not the whole vendor line.`,
    ].join('\n');
    const body = `# Version — ${versionSlug}

## Lien catalogue

- Distribution parente : [\`${entry.id}\`](../distributions/${entry.id}/SKILL.md) (\`${distroSkill}\`)
- Vendor : [\`${entry.vendor}\`](../vendors/${entry.vendor}/SKILL.md)
- Libellé : **${entry.displayName}**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de \`${entry.id}\` uniquement.

## Héritage

Charger aussi : \`${distroSkill}\` + skill famille \`${FAMILY_OS_SKILL[entry.family] || 'os-stub'}\`.

## Gates

\`\`\`bash
node usr/lib/capsuleos/tools/validate-all.mjs
\`\`\`
`;
    return writeSkill(`versions/${versionSlug}`, fm, body);
}

function buildLanguageSkill(lang) {
    const fm = [
        `name: ${lang.name}`,
        `description: CapsuleOS ${lang.label} — ${lang.when}. Use when editing ${lang.paths.join(', ')}.`,
    ].join('\n');
    const gatesBlock = lang.gates.length
        ? `\`\`\`bash\n${lang.gates.map((g) => `node usr/lib/capsuleos/tools/${g}`).join('\n')}\n\`\`\``
        : '(pas de gate dédié — suivre validate-all en release)';
    const body = `# Langage — ${lang.label}

## Périmètre fichiers

${lang.paths.map((p) => `- \`${p}\``).join('\n')}

## Skill complémentaire

Souvent couplé à : \`${lang.sibling}\`.

## Gates

${gatesBlock}

## Règles projet

- JavaScript : ES6 strict, pas de \`?\.\`, \`??\`, spread runtime ([passe-vanilla-json.md](../../docs/passe-vanilla-json.md))
- JSON : schémas sous \`etc/capsuleos/schemas/\`
- CSS : pas de nesting ; préfixer \`body#\` sur skins ([contrib.md § toolkits](../../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui))

## Hiérarchie

Les skills **vendor / distribution / version** décrivent *où* travailler ; ce skill décrit *comment* éditer ce langage.

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [code-quality](../code-quality/SKILL.md)
`;
    return writeSkill(`languages/${lang.id}`, fm, body);
}

function buildIndex(registry, vendors, versionCount) {
    const fm = [
        'name: capsuleos-skills-index',
        'description: Index hiérarchie skills CapsuleOS — vendors, distributions, versions, langages. Use when choosing which agent skill to load for a scoped task.',
    ].join('\n');
    const vendorList = [...vendors.keys()].sort();
    const active = registry.entries.filter((e) => e.status === 'active');
    const body = `# Index — hiérarchie skills

## Niveaux

| Niveau | Chemin | Exemple |
|--------|--------|---------|
| Vendor | \`vendors/<vendor>/\` | \`vendors/mint/\` |
| Distribution | \`distributions/<registry-id>/\` | \`distributions/linux-mint/\` |
| Version | \`versions/<slug>/\` | \`versions/windows-11/\` |
| Langage | \`languages/<id>/\` | \`languages/javascript/\` |

Skills **famille** (transverses) : \`os-linux\`, \`os-windows\`, … — inchangés à la racine de \`root/skills/\`.

## Vendors (${vendorList.length})

${vendorList.map((v) => `- [${v}](vendors/${v}/SKILL.md)`).join('\n')}

## Distributions actives (${active.length})

${active.map((e) => `- [${e.id}](distributions/${e.id}/SKILL.md) — ${e.displayName}`).join('\n')}

## Langages (${LANGUAGES.length})

${LANGUAGES.map((l) => `- [${l.label}](languages/${l.id}/SKILL.md)`).join('\n')}

## Génération

\`\`\`bash
node usr/lib/capsuleos/tools/seed-agent-skills.mjs --write
node usr/lib/capsuleos/tools/validate-agent-skills.mjs
\`\`\`

Voir [skills-hierarchie.md](../docs/skills-hierarchie.md).
`;
    return writeSkill('_index', fm, body);
}

function main() {
    const registry = readRegistry();
    const byVendor = new Map();
    for (const entry of registry.entries) {
        const v = entry.vendor || 'unknown';
        if (!byVendor.has(v)) byVendor.set(v, []);
        byVendor.get(v).push(entry);
    }

    const planned = [];
    for (const [vendor, entries] of [...byVendor.entries()].sort()) {
        planned.push(buildVendorSkill(vendor, entries));
    }
    const versionSlugs = new Set();
    for (const entry of registry.entries) {
        planned.push(buildDistroSkill(entry, registry));
        const vs = deriveVersionSlug(entry);
        if (vs && !versionSlugs.has(vs)) {
            versionSlugs.add(vs);
            planned.push(buildVersionSkill(entry, vs));
        }
    }
    for (const lang of LANGUAGES) {
        planned.push(buildLanguageSkill(lang));
    }
    planned.push(buildIndex(registry, byVendor, versionSlugs.size));

    console.log(`${WRITE ? 'Écrit' : 'Prévu'} ${planned.length} SKILL.md`);
    if (!WRITE) {
        console.log('Relancer avec --write pour appliquer.');
    }
}

main();
