#!/usr/bin/env node
/**
 * Génère un squelette Z2 pour un registry planned (AccΣ).
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/bootstrap-os-welcome-scaffold.mjs --id linux-elementary
 *   node usr/lib/capsuleos/tools/lab/bootstrap-os-welcome-scaffold.mjs --kernel linux
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/os-welcome-scaffold.json');
const REGISTRY_PATH = path.join(ROOT, 'etc/capsuleos/os-registry.json');
const LAB_RECIPES = path.join(ROOT, 'etc/capsuleos/contracts/lab-recipe-profiles.json');
const FACADE_LIB = path.join(ROOT, 'usr/lib/capsuleos/tools/linux/linux-skin-facade-lib.mjs');

const args = process.argv.slice(2);
const idArg = args.find((a, i) => args[i - 1] === '--id');
const kernelArg = args.find((a, i) => args[i - 1] === '--kernel');
const force = args.includes('--force');

const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));

const findEntry = (id) => registry.entries.find((e) => e.id === id);
const pilotHome = (pilotId) => {
  const pilot = findEntry(pilotId);
  if (!pilot) throw new Error(`Pilote introuvable: ${pilotId}`);
  const skin = pilot.referencePaths?.skin || pilot.skin;
  if (!skin) throw new Error(`Pilote ${pilotId} sans skin`);
  return skin.replace(/\/index\.html$/, '');
};

const a11yTemplate = (bodyId) => `/* Squelette Se-A11y — ${bodyId} (bootstrap os-welcome-scaffold) */
html[data-font-scale="100"] { --a11y-font-scale-factor: 1; }
html[data-font-scale="110"] { --a11y-font-scale-factor: 1.1; }
html[data-font-scale="125"] { --a11y-font-scale-factor: 1.25; }

html[data-font-scale="100"] #${bodyId},
html[data-font-scale="110"] #${bodyId},
html[data-font-scale="125"] #${bodyId} {
    font-size: calc(1rem * var(--a11y-font-scale-factor));
}

#${bodyId} :where(a, button, input, [role="button"], [tabindex="0"]):focus-visible {
    outline: 2px solid var(--a11y-focus-ring, #3584e4);
    outline-offset: 1px;
}
`;

function walk(dir, fn) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, fn);
    else fn(full);
  }
}

function adaptTree(destRoot, replacements) {
  walk(destRoot, (filePath) => {
    if (!/\.(html|css|js|json|md|svg)$/i.test(filePath)) return;
    let text = fs.readFileSync(filePath, 'utf8');
    replacements.forEach(([from, to]) => {
      if (from && to !== undefined) text = text.split(from).join(to);
    });
    fs.writeFileSync(filePath, text, 'utf8');
  });
}

function ensureA11yImports(homeRel, bodyId) {
  const a11yPath = path.join(ROOT, homeRel, 'style/a11y-overrides.css');
  fs.mkdirSync(path.dirname(a11yPath), { recursive: true });
  if (!fs.existsSync(a11yPath)) {
    fs.writeFileSync(a11yPath, a11yTemplate(bodyId), 'utf8');
  }
  const importsPath = path.join(ROOT, homeRel, 'style/imports.css');
  if (fs.existsSync(importsPath)) {
    let imports = fs.readFileSync(importsPath, 'utf8');
    if (!imports.includes('a11y-overrides.css')) {
      imports = `${imports.trim()}\n@import url(./a11y-overrides.css?v=scaffold);\n`;
      fs.writeFileSync(importsPath, imports, 'utf8');
    }
  }
  const stylePath = path.join(ROOT, homeRel, 'style/style.css');
  if (!fs.existsSync(stylePath)) {
    fs.writeFileSync(stylePath, '@import url(imports.css?v=scaffold);\n', 'utf8');
  } else {
    let style = fs.readFileSync(stylePath, 'utf8');
    if (!style.includes('imports.css') && !style.includes('a11y-overrides')) {
      style = `@import url(imports.css?v=scaffold);\n${style}`;
      fs.writeFileSync(stylePath, style, 'utf8');
    }
  }
}

function patchRegistry(entryId, spec) {
  const idx = registry.entries.findIndex((e) => e.id === entryId);
  if (idx < 0) throw new Error(`Registry ${entryId} absent`);
  const entry = registry.entries[idx];
  const facade = `OS/linux/${spec.facadePath}/index.html`;
  const skin = `${spec.homeLayout}/index.html`;
  entry.upstreamId = spec.upstreamId;
  entry.tier = spec.welcomeTier;
  entry.status = spec.status;
  entry.referencePaths = {
    facade,
    skin,
    embedKey: spec.embedKey,
    bodyId: spec.bodyId,
    scaffoldAt: new Date().toISOString().slice(0, 10)
  };
  entry.facade = facade;
  entry.skin = skin;
  entry.embedKey = spec.embedKey;
  entry.bodyId = spec.bodyId;
  registry.entries[idx] = entry;
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function patchLabRecipe(entryId, spec) {
  const recipes = JSON.parse(fs.readFileSync(LAB_RECIPES, 'utf8'));
  if (recipes.profiles[entryId]) return;
  recipes.profiles[entryId] = {
    toolkit: spec.toolkit,
    vendor: spec.vendor,
    upstreamId: spec.upstreamId,
    coherenceContract: 'etc/capsuleos/contracts/os-reproduction-coherence.json',
    welcomeScaffold: 'etc/capsuleos/contracts/os-welcome-scaffold.json',
    notes: `Squelette AccΣ — pilote ${spec.pilotRegistryId}`
  };
  fs.writeFileSync(LAB_RECIPES, `${JSON.stringify(recipes, null, 2)}\n`, 'utf8');
}

function patchFacadeLib(spec) {
  let text = fs.readFileSync(FACADE_LIB, 'utf8');
  const home = spec.homeLayout;
  const facade = spec.facadePath;
  const needle = `{ facade: '${facade}', home: '${home}' }`;
  if (text.includes(needle)) return;
  const insert = `    { facade: '${facade}', home: '${home}' },\n`;
  text = text.replace(
    /export const LINUX_SKIN_FACADES = \[\n/,
    `export const LINUX_SKIN_FACADES = [\n${insert}`
  );
  fs.writeFileSync(FACADE_LIB, text, 'utf8');
}

function writeProcReadme(entryId, spec) {
  const procDir = path.join(ROOT, 'proc', entryId);
  fs.mkdirSync(procDir, { recursive: true });
  const readme = `# ${spec.displayName} (\`${entryId}\`)

Squelette AccΣ généré par \`bootstrap-os-welcome-scaffold.mjs\`.

- **Pilote** : \`${spec.pilotRegistryId}\`
- **Amont** : \`${spec.upstreamId}\`
- **Toolkit** : \`${spec.toolkit}\`
- **Tier** : \`${spec.welcomeTier}\` / \`${spec.status}\`

Prochaine étape : inventaire VM (¬I) avant maturation Se.
`;
  fs.writeFileSync(path.join(procDir, 'README.md'), readme, 'utf8');
}

function bootstrapOne(entryId) {
  const spec = contract.entries[entryId];
  if (!spec) throw new Error(`Entrée scaffold absente: ${entryId}`);
  if (!spec.bootstrapEnabled) throw new Error(`${entryId} : bootstrap désactivé (vague 2)`);

  const destHome = spec.homeLayout;
  const destAbs = path.join(ROOT, destHome);
  if (fs.existsSync(destAbs) && !force) {
    console.log(`  skip ${entryId} — ${destHome} existe ( --force pour écraser )`);
    return;
  }
  if (fs.existsSync(destAbs)) fs.rmSync(destAbs, { recursive: true });

  const pilot = findEntry(spec.pilotRegistryId);
  const pilotBody = pilot.referencePaths?.bodyId || pilot.bodyId || 'ubuntu';
  const srcHome = pilotHome(spec.pilotRegistryId);

  fs.cpSync(path.join(ROOT, srcHome), destAbs, { recursive: true });

  const replacements = [
    [spec.pilotRegistryId, entryId],
    [pilotBody, spec.bodyId],
    [pilot.embedKey || pilotBody, spec.embedKey],
    [pilot.displayName, spec.displayName],
    [`#${pilotBody}`, `#${spec.bodyId}`],
    [`id="${pilotBody}"`, `id="${spec.bodyId}"`],
    [`data-skin="${pilotBody}"`, `data-skin="${spec.bodyId}"`],
    [`CAPSULE_SKIN_PROFILE_ID = '${spec.pilotRegistryId}'`, `CAPSULE_SKIN_PROFILE_ID = '${entryId}'`],
    [srcHome.replace(/\//g, '/'), destHome],
    [`home/${path.basename(srcHome)}`, `home/${path.basename(destHome)}`]
  ];
  adaptTree(destAbs, replacements);
  ensureA11yImports(destHome, spec.bodyId);
  patchRegistry(entryId, spec);
  patchLabRecipe(entryId, spec);
  patchFacadeLib(spec);
  writeProcReadme(entryId, spec);

  console.log(`✓ bootstrap ${entryId} ← ${spec.pilotRegistryId} → ${destHome}`);
}

function runProfilesBuild() {
  const script = path.join(ROOT, 'usr/lib/capsuleos/tools/build-profiles-from-registry.mjs');
  const r = spawnSync(process.execPath, [script], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

const targets = [];
if (idArg) targets.push(idArg.trim());
else if (kernelArg === 'linux') targets.push(...contract.kernels.linux.entryIds);
else throw new Error('Usage: --id <registryId> | --kernel linux');

targets.forEach(bootstrapOne);
runProfilesBuild();
console.log('✓ bootstrap-os-welcome-scaffold OK');
