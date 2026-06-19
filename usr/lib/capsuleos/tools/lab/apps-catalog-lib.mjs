/**
 * Bibliothèque catalogue applications — VM → CapsuleOS (tous registryId).
 */
import fs from 'fs';
import path from 'path';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';

const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/apps-catalog.json');

export const loadAppsContract = () => JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));

export const pathsForApps = (registryId) => ({
  registryId,
  vmAppsInstalled: path.join(ROOT, 'root/docs/inventaires', `${registryId}-vm-apps-installed.json`),
  appsCatalog: path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-catalog.json`),
  appsCatalogMd: path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-catalog.md`),
});

export const skinIndexPath = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const skin = entry.referencePaths?.skin;
  if (!skin) throw new Error(`referencePaths.skin manquant: ${registryId}`);
  return path.join(ROOT, skin);
};

const glyphFor = (statut) => ({
  ok: '✅',
  partiel: '🔶',
  absent: '⬜',
  decorative: '🔷',
  capsuleOnly: '🎓',
  notOnVm: '—',
}[statut] || '⬜');

export const parseSkinPlacements = (indexHtml) => {
  const windowSlots = new Set();
  const overviewLinks = new Set();
  const dashLinks = new Set();
  const dockLinks = new Set();
  const desktopLinks = new Set();

  let m;
  const winRe = /class="windowElement"[^>]*data-link="([^"]+)"/g;
  while ((m = winRe.exec(indexHtml)) !== null) windowSlots.add(m[1]);

  const ovRe = /data-overview-link="([^"]+)"/g;
  while ((m = ovRe.exec(indexHtml)) !== null) overviewLinks.add(m[1]);

  const dashRe = /fedora-overview__dash-item[^>]*data-overview-link="([^"]+)"/g;
  while ((m = dashRe.exec(indexHtml)) !== null) dashLinks.add(m[1]);

  const dockRe = /fedora-dock[^>]*data-link="([^"]+)"/g;
  while ((m = dockRe.exec(indexHtml)) !== null) dockLinks.add(m[1]);

  const deskRe = /desktop-shortcut[^>]*data-link="([^"]+)"/g;
  while ((m = deskRe.exec(indexHtml)) !== null) desktopLinks.add(m[1]);

  return { windowSlots: [...windowSlots], overviewLinks: [...overviewLinks], dashLinks: [...dashLinks], dockLinks: [...dockLinks], desktopLinks: [...desktopLinks] };
};

const registryOverride = (contract, registryId) => {
  const o = contract.registryOverrides?.[registryId];
  if (!o) return null;
  return o;
};

const slotSpec = (contract, toolkitId, slot) => {
  if (!slot) return null;
  const direct = contract.toolkits?.[toolkitId]?.slotSpecs?.[slot];
  if (direct) return direct;
  if (toolkitId === 'cosmic') {
    return contract.toolkits?.gnome?.slotSpecs?.[slot] || null;
  }
  return null;
};

export const buildCatalog = (registryId) => {
  const contract = loadAppsContract();
  const override = registryOverride(contract, registryId);
  if (!override) {
    throw new Error(`registryOverrides manquant pour ${registryId} — ajouter entrée dans apps-catalog.json`);
  }

  const toolkitId = override.toolkit || loadRegistryEntry(registryId).toolkit?.id || 'gnome';
  const paths = pathsForApps(registryId);
  const vmApps = fs.existsSync(paths.vmAppsInstalled)
    ? JSON.parse(fs.readFileSync(paths.vmAppsInstalled, 'utf8'))
    : null;

  const indexPath = skinIndexPath(registryId);
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const placements = parseSkinPlacements(indexHtml);

  const rows = [];
  const installed = vmApps?.installed || [];
  const installedIds = new Set(installed.map((v) => v.id));

  for (const vm of installed) {
    const spec = override.apps?.[vm.id] || {};
    const slot = spec.slot ?? vm.capsuleSlot ?? null;
    const statut = spec.statut || (slot && placements.windowSlots.includes(slot) ? 'partiel' : (slot ? 'absent' : 'decorative'));
    const priorite = spec.priorite || 'P2';
    const requiresSlot = spec.requiresSlot ?? (priorite === 'P0' || priorite === 'P1');
    const placement = {
      dash: !!(spec.placement?.dash || vm.dash),
      overview: !!(spec.placement?.overview || vm.grid),
      dock: placements.dockLinks.includes(slot),
      desktop: placements.desktopLinks.includes(slot),
      quickSettings: !!spec.placement?.quickSettings,
    };
    if (slot && placements.overviewLinks.includes(slot)) placement.overview = true;
    if (slot && placements.dashLinks.includes(slot)) placement.dash = true;

    rows.push({
      vmId: vm.id,
      desktop: vm.id === 'org.mozilla.Firefox' ? 'firefox.desktop' : `${vm.id}.desktop`,
      labelFr: spec.labelFr || vm.name,
      priorite,
      slotCapsule: slot,
      statut,
      glyph: glyphFor(statut),
      requiresSlot,
      onVm: spec.onVm !== false,
      placement,
      specs: slotSpec(contract, toolkitId, slot),
      note: spec.note || null,
    });
  }

  for (const [vmId, spec] of Object.entries(override.apps || {})) {
    if (installedIds.has(vmId)) continue;
    const slot = spec.slot ?? null;
    const statut = spec.statut || 'partiel';
    const priorite = spec.priorite || 'P2';
    rows.push({
      vmId,
      desktop: vmId === 'libreoffice-writer' ? 'libreoffice-writer.desktop' : `${vmId}.desktop`,
      labelFr: spec.labelFr || vmId,
      priorite,
      slotCapsule: slot,
      statut,
      glyph: glyphFor(statut),
      requiresSlot: spec.requiresSlot ?? false,
      onVm: spec.onVm !== false,
      placement: spec.placement || {},
      specs: slotSpec(contract, toolkitId, slot),
      note: spec.note || null,
    });
  }

  for (const extra of override.capsuleOnly || []) {
    rows.push({
      vmId: null,
      desktop: null,
      labelFr: extra.labelFr,
      priorite: 'CapsuleOnly',
      slotCapsule: extra.slot,
      statut: extra.statut || 'capsuleOnly',
      glyph: glyphFor(extra.statut || 'capsuleOnly'),
      requiresSlot: false,
      onVm: false,
      placement: extra.placement || {},
      specs: slotSpec(contract, toolkitId, extra.slot),
      note: 'CapsuleOnly',
    });
  }

  for (const deco of override.notOnVmOverview || []) {
    rows.push({
      vmId: null,
      desktop: null,
      labelFr: deco.labelFr,
      priorite: 'P3',
      slotCapsule: null,
      statut: 'notOnVm',
      glyph: glyphFor('notOnVm'),
      requiresSlot: false,
      onVm: false,
      placement: deco.placement || { overview: true },
      specs: null,
      note: 'Présent grille Capsule — non installé VM lab',
    });
  }

  rows.sort((a, b) => (a.labelFr || '').localeCompare(b.labelFr || '', 'fr', { sensitivity: 'base' }));

  const p0Rows = rows.filter((r) => r.priorite === 'P0' && r.onVm !== false);
  const p0Gaps = p0Rows.filter((r) => r.requiresSlot && r.statut !== 'ok');
  const p1Gaps = rows.filter((r) => r.priorite === 'P1' && r.requiresSlot && !['ok', 'partiel'].includes(r.statut));
  const p2Gaps = rows.filter((r) => r.priorite === 'P2' && r.requiresSlot && r.statut === 'absent');

  const nextGap = [...p0Gaps, ...p1Gaps, ...p2Gaps][0] || null;

  return {
    version: 1,
    registryId,
    toolkit: toolkitId,
    generatedAt: new Date().toISOString(),
    procedure: 'procedure-apps-catalog.md',
    contract: 'etc/capsuleos/contracts/apps-catalog.json',
    vmAppsSource: paths.vmAppsInstalled.replace(`${ROOT}/`, ''),
    skinIndex: skinIndexPath(registryId).replace(`${ROOT}/`, ''),
    capsuleSlots: placements.windowSlots,
    summary: {
      vmInstalled: installed.length,
      catalogRows: rows.length,
      p0Total: p0Rows.length,
      p0Ok: p0Rows.filter((r) => r.statut === 'ok').length,
      p0Gaps: p0Gaps.length,
      p1Gaps: p1Gaps.length,
      p2Gaps: p2Gaps.length,
      nextGap: nextGap ? { labelFr: nextGap.labelFr, slot: nextGap.slotCapsule, priorite: nextGap.priorite, statut: nextGap.statut } : null,
    },
    rows,
  };
};

export const evaluateAppsPredicates = (registryId) => {
  const paths = pathsForApps(registryId);
  const appV = fs.existsSync(paths.vmAppsInstalled)
    && (JSON.parse(fs.readFileSync(paths.vmAppsInstalled, 'utf8')).installed || []).length > 0;

  let catalog = null;
  let appC = false;
  if (fs.existsSync(paths.appsCatalog)) {
    catalog = JSON.parse(fs.readFileSync(paths.appsCatalog, 'utf8'));
    appC = catalog.version === 1 && (catalog.rows || []).length > 0 && catalog.summary?.p0Gaps !== undefined;
  }

  const p0Gaps = catalog?.summary?.p0Gaps ?? null;
  const appP0 = appC && p0Gaps === 0;
  const appSigma = appV && appC && appP0;

  return {
    AppV: appV,
    AppC: appC,
    AppP0: appP0,
    AppΣ: appSigma,
    summary: catalog?.summary || null,
    nextGap: catalog?.summary?.nextGap || null,
  };
};

export const validateCatalogStrict = (catalog) => {
  const errors = [];
  if (!catalog?.rows?.length) errors.push('catalogue vide');

  for (const row of catalog?.rows || []) {
    if (row.requiresSlot && row.slotCapsule && !catalog.capsuleSlots.includes(row.slotCapsule)) {
      if (row.statut === 'ok') {
        errors.push(`${row.labelFr} : slot ${row.slotCapsule} absent de index.html (windowElement)`);
      }
    }
    if (row.priorite === 'P0' && row.onVm !== false && row.requiresSlot && row.statut === 'absent') {
      errors.push(`P0 ${row.labelFr} : statut absent interdit`);
    }
    if (row.slotCapsule && row.statut === 'ok' && !row.specs) {
      errors.push(`${row.labelFr} : slot ${row.slotCapsule} sans specs toolkit`);
    }
  }

  return errors;
};

export const renderCatalogMarkdown = (catalog) => {
  const lines = [];
  lines.push(`# Catalogue applications — ${catalog.registryId}`);
  lines.push('');
  lines.push(`> Généré : \`${catalog.generatedAt}\` · Toolkit : **${catalog.toolkit}** · Procédure : [procedure-apps-catalog.md](../procedure-apps-catalog.md)`);
  lines.push('');
  lines.push('```bash');
  lines.push(`node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id ${catalog.registryId} --write`);
  lines.push(`node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id ${catalog.registryId} --write`);
  lines.push(`node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id ${catalog.registryId}`);
  lines.push('```');
  lines.push('');
  lines.push('## Prédicats');
  lines.push('');
  lines.push('| Symbole | Valeur |');
  lines.push('|---------|--------|');
  lines.push(`| **AppV** | ${catalog.summary.vmInstalled > 0 ? '✓' : '✗'} inventaire VM |`);
  lines.push(`| **AppC** | ✓ catalogue |`);
  lines.push(`| **AppP0** | ${catalog.summary.p0Gaps === 0 ? '✓' : `✗ (${catalog.summary.p0Gaps} écart(s))`} |`);
  lines.push(`| **AppΣ** | ${catalog.summary.p0Gaps === 0 ? '✓' : '—'} |`);
  lines.push('');
  if (catalog.summary.nextGap) {
    lines.push(`**Prochain écart** : ${catalog.summary.nextGap.labelFr} (${catalog.summary.nextGap.priorite}, ${catalog.summary.nextGap.statut})`);
    lines.push('');
  }
  lines.push('## Applications VM installées');
  lines.push('');
  lines.push('| App (FR) | VM ID | Priorité | Slot | Statut | Dash | Overview | Spécificités |');
  lines.push('|----------|-------|----------|------|--------|------|----------|--------------|');
  for (const r of catalog.rows.filter((x) => x.onVm !== false && x.priorite !== 'CapsuleOnly' && x.statut !== 'notOnVm')) {
    const pl = [
      r.placement?.dash ? 'dash' : '',
      r.placement?.overview ? 'ov' : '',
      r.placement?.quickSettings ? 'QS' : '',
    ].filter(Boolean).join(', ') || '—';
    const spec = r.specs
      ? `${r.specs.chromeProvider || '—'} · ${r.specs.functionalDepth || '—'}`
      : (r.note || '—');
    lines.push(`| ${r.labelFr} | ${r.vmId || '—'} | ${r.priorite} | ${r.slotCapsule || '—'} | ${r.glyph} ${r.statut} | ${r.placement?.dash ? '✓' : ''} | ${r.placement?.overview ? '✓' : ''} | ${spec} |`);
  }
  lines.push('');
  lines.push('## CapsuleOnly / hors VM');
  lines.push('');
  for (const r of catalog.rows.filter((x) => x.priorite === 'CapsuleOnly' || x.statut === 'notOnVm' || x.onVm === false)) {
    lines.push(`- ${r.glyph} **${r.labelFr}** — ${r.statut}${r.note ? ` (${r.note})` : ''}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
};
