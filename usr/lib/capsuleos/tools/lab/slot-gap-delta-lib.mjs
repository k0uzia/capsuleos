/**
 * SlotMap + GapΔ — comparer inventaire VM au dépôt (C8/C9).
 * Contrat : os-reproduction-coherence.json → differentialCampaign
 */
import fs from 'fs';
import path from 'path';
import { ROOT, loadRegistryEntry } from './replication-chain-lib.mjs';
import { evaluateAppsPredicates, pathsForApps, loadAppsContract } from './apps-catalog-lib.mjs';
import { evaluateAppsReplicationPredicates } from './apps-replication-lib.mjs';
import { evaluateStorePredicates, storeAppliesToRegistry } from './store-replication-lib.mjs';
import { loadCampaignPhases, loadRecipeProfile } from './lab-recipe-resolver.mjs';
import { shouldSkipCampaignPhase, loadDifferentialCampaign } from './differential-campaign-lib.mjs';
import {
  collectContentGaps,
  evaluateSlotRealSigma,
  evaluateVSigmaRegistry,
  filterOpenGaps,
  functionalDepthForSlot,
  materializeParityDebtGaps,
} from './content-gaps-lib.mjs';

const COHERENCE_PATH = path.join(ROOT, 'etc/capsuleos/contracts/os-reproduction-coherence.json');
const SLOTS_PATH = path.join(ROOT, 'etc/capsuleos/contracts/slots-manifest.json');

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export const reportPathsForRegistry = (registryId) => ({
  json: path.join(ROOT, 'root/docs/inventaires', `${registryId}-slot-gap-delta.json`),
  md: path.join(ROOT, 'root/docs/inventaires', `${registryId}-slot-gap-delta.md`),
});

export { filterOpenGaps };

const slotInManifest = (slotsManifest, slotId) => !!slotsManifest?.slots?.[slotId];

const reuseSigma = (row, slotsManifest, openGapsForSlot) => {
  if (!row?.slotCapsule) return false;
  if (!slotInManifest(slotsManifest, row.slotCapsule)) return false;
  if (row.statut !== 'ok' && row.statut !== 'partiel') return false;
  return openGapsForSlot.length === 0;
};

const buildRecommendations = (registryId, gapDelta, diff) => {
  const recs = [];
  const triggers = diff?.gapTriggers || {};

  if (gapDelta.catalogGaps.p0.length) {
    const g = gapDelta.catalogGaps.p0[0];
    recs.push({
      priority: 1,
      rule: 'C9',
      action: `Corriger écart catalogue P0 — ${g.labelFr}`,
      command: `node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id ${registryId} --write`,
      trigger: 'p0Gaps',
    });
  }

  const contentGaps = gapDelta.openContentGaps.filter((g) => ['content', 'catalog', 'detail'].includes(g.dimension));
  if (contentGaps.length && triggers.extractContent) {
    recs.push({
      priority: 2,
      rule: 'C9',
      action: 'Extraire contenu ciblé (gaps content/catalog/detail)',
      command: `node usr/lib/capsuleos/tools/lab/enrich-apps-visual-investigation-parity.mjs --id ${registryId}`,
      trigger: 'extractContent',
    });
  }

  const chromeGaps = gapDelta.openContentGaps.filter((g) => g.dimension === 'chrome' || g.dimension === 'Vc');
  if (chromeGaps.length) {
    recs.push({
      priority: 2,
      rule: 'C9',
      action: 'Captures / parité chrome ciblée',
      command: storeAppliesToRegistry(registryId)
        ? `CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/capture-capsule-software-views.mjs --id ${registryId}`
        : `node usr/lib/capsuleos/tools/lab/collect-capsule-apps-visual-investigation.mjs --id ${registryId}`,
      trigger: 'visualInvestigation',
    });
  }

  const interactionGaps = gapDelta.openContentGaps.filter((g) => g.dimension === 'interaction');
  if (interactionGaps.length || gapDelta.catalogGaps.p0.some((r) => r.statut === 'partiel')) {
    recs.push({
      priority: 3,
      rule: 'C9',
      action: 'Analyse fonctionnelle / scénarios slot',
      command: `node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id ${registryId}`,
      trigger: triggers.analyzeFunction || 'interaction',
    });
  }

  if (gapDelta.slotsNeedingNewSlot?.length) {
    recs.push({
      priority: 1,
      rule: 'C8',
      action: 'Créer ou mapper slot pour apps VM non couvertes',
      command: `node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id ${registryId} --write`,
      trigger: triggers.newSlot,
    });
  }

  if (gapDelta.parityDebt?.length) {
    const storeSlots = gapDelta.parityDebt.filter((s) => s.slotId === 'update_manager');
    recs.push({
      priority: 2,
      rule: 'C3',
      action: `Parité visuelle P0 — ${gapDelta.parityDebt.length} slot(s) partial/unknown (sans contentGaps ouverts)`,
      command: storeSlots.length
        ? `node usr/lib/capsuleos/tools/lab/run-store-replication-chain.mjs --id ${registryId} --auto`
        : `node usr/lib/capsuleos/tools/lab/enrich-apps-visual-investigation-parity.mjs --id ${registryId}`,
      trigger: 'parityDebt',
    });
  }

  if (gapDelta.gapDeltaEmpty && !gapDelta.parityDebt?.length && gapDelta.realSigma?.registryClosed) {
    recs.push({
      priority: 0,
      rule: 'P-OS9',
      action: 'GapΔ vide et RealΣ — réutiliser l\'existant ; pas de campagne CR complète',
      command: `node usr/lib/capsuleos/tools/lab/run-capsule-pipeline.mjs --id ${registryId} --dry-run`,
      trigger: 'reuse',
    });
  } else if (gapDelta.gapDeltaEmpty && gapDelta.parityDebt?.length) {
    recs.push({
      priority: 0,
      rule: 'RealΣ',
      action: 'GapΔ structurel vide — contentGaps ouverts depuis parityDebt (--write) ; pas de ré-extraction',
      command: `node usr/lib/capsuleos/tools/lab/enrich-apps-visual-investigation-parity.mjs --id ${registryId}`,
      trigger: 'materialize-parity-debt',
    });
  } else if (!gapDelta.realSigma?.registryClosed) {
    recs.push({
      priority: 1,
      rule: 'RealΣ',
      action: 'Clôturer réalisme vécu — Vp + VΣ + profondeur P0 full',
      command: `node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id ${registryId}`,
      trigger: 'real-sigma',
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
};

export const buildSlotGapDeltaReport = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const profile = loadRecipeProfile(registryId);
  const paths = pathsForApps(registryId);
  const appsContract = loadAppsContract();
  const slotsManifest = readJson(SLOTS_PATH);
  const coherence = readJson(COHERENCE_PATH);
  const diff = loadDifferentialCampaign();

  const vmInv = readJson(paths.vmAppsInstalled);
  const catalog = readJson(paths.appsCatalog);
  const visualInv = readJson(
    path.join(ROOT, 'root/docs/inventaires', `${registryId}-apps-visual-investigation.json`),
  );

  const appsPred = evaluateAppsPredicates(registryId);
  const appsRep = evaluateAppsReplicationPredicates(registryId);
  const storePred = evaluateStorePredicates(registryId);

  const investigationsBySlot = new Map(
    (visualInv?.investigations || []).map((i) => [i.controlId, i]),
  );

  const toolkit = catalog?.toolkit || profile.toolkit || entry.toolkit?.id || 'gnome';
  const vSigma = evaluateVSigmaRegistry(registryId);

  const openContentGaps = filterOpenGaps(visualInv);
  const gapsBySlot = new Map();
  for (const g of openContentGaps) {
    const slot = g.slotId || g.controlId || 'unknown';
    if (!gapsBySlot.has(slot)) gapsBySlot.set(slot, []);
    gapsBySlot.get(slot).push(g);
  }

  const catalogRows = catalog?.rows || [];
  const mappedVmIds = new Set(catalogRows.filter((r) => r.vmId).map((r) => r.vmId));

  const slotMap = catalogRows
    .filter((r) => r.onVm !== false && r.priorite !== 'CapsuleOnly')
    .map((row) => {
      const inv = investigationsBySlot.get(row.slotCapsule);
      const slotGaps = gapsBySlot.get(row.slotCapsule) || [];
      const slotId = row.slotCapsule || null;
      const visualMatch = inv?.capsuleParity?.visualMatch || 'unknown';
      const functionalDepth = slotId ? functionalDepthForSlot(toolkit, slotId) : null;
      const realSigmaEval = evaluateSlotRealSigma({
        slotId,
        priorite: row.priorite,
        visualMatch,
        functionalDepth,
        vSigmaClosed: vSigma.closed,
      });

      return {
        vmId: row.vmId || null,
        labelFr: row.labelFr,
        slotId,
        priorite: row.priorite,
        catalogStatut: row.statut,
        requiresSlot: !!row.requiresSlot,
        inSlotsManifest: slotId ? slotInManifest(slotsManifest, slotId) : false,
        hasToolkitSpec: !!(slotId && appsContract.toolkits?.[toolkit]?.slotSpecs?.[slotId]),
        reuseSigma: reuseSigma(row, slotsManifest, slotGaps),
        visualMatch,
        functionalDepth,
        realSigma: realSigmaEval.realSigma,
        documented: inv?.status === 'documented',
        openGaps: slotGaps.map((g) => ({
          id: g.id,
          dimension: g.dimension,
          severity: g.severity,
          status: g.status,
        })),
      };
    });

  const installed = vmInv?.installed || [];
  const unmappedVmApps = installed
    .filter((app) => !mappedVmIds.has(app.id || app.desktopId || app.vmId))
    .map((app) => ({
      vmId: app.id || app.desktopId || app.vmId,
      name: app.name || app.labelFr || app.id,
    }));

  const p0Gaps = catalogRows.filter((r) => r.priorite === 'P0' && r.requiresSlot && r.statut !== 'ok');
  const p1Gaps = catalogRows.filter((r) => r.priorite === 'P1' && r.requiresSlot && r.statut !== 'ok');

  const p0RealSigmaSlots = slotMap.filter((s) => s.priorite === 'P0' && s.slotId && s.realSigma === true);
  const p0Slots = slotMap.filter((s) => s.priorite === 'P0' && s.slotId);

  const gapDelta = {
    realSigma: {
      formula: 'Vp ∧ VΣ ∧ functionalDepth ∉ {partial}',
      vSigmaClosed: vSigma.closed,
      vSigmaReason: vSigma.reason,
      registryClosed: p0Slots.length > 0
        && p0RealSigmaSlots.length === p0Slots.length
        && vSigma.closed,
      p0Closed: p0RealSigmaSlots.length,
      p0Total: p0Slots.length,
    },
    openContentGaps: openContentGaps.map((g) => ({
      id: g.id,
      slotId: g.slotId || g.controlId,
      dimension: g.dimension,
      severity: g.severity,
      status: g.status,
      note: g.note || null,
    })),
    catalogGaps: {
      p0: p0Gaps.map((r) => ({ labelFr: r.labelFr, slotId: r.slotCapsule, statut: r.statut })),
      p1: p1Gaps.map((r) => ({ labelFr: r.labelFr, slotId: r.slotCapsule, statut: r.statut })),
    },
    slotsNeedingVisual: slotMap
      .filter((s) => s.openGaps.some((g) => ['chrome', 'Vc'].includes(g.dimension)) || s.visualMatch === 'gap')
      .map((s) => s.slotId)
      .filter(Boolean),
    slotsNeedingContent: slotMap
      .filter((s) => s.openGaps.some((g) => ['content', 'catalog', 'detail'].includes(g.dimension)))
      .map((s) => s.slotId)
      .filter(Boolean),
    slotsNeedingNewSlot: unmappedVmApps.map((a) => a.vmId),
    parityDebt: slotMap
      .filter((s) => s.priorite === 'P0' && s.slotId && s.openGaps.length === 0
        && ['partial', 'gap', 'unknown'].includes(s.visualMatch))
      .map((s) => ({ slotId: s.slotId, visualMatch: s.visualMatch })),
    realSigmaDebt: slotMap
      .filter((s) => s.priorite === 'P0' && s.slotId && s.realSigma === false && s.openGaps.length === 0)
      .map((s) => ({
        slotId: s.slotId,
        visualMatch: s.visualMatch,
        functionalDepth: s.functionalDepth,
      })),
    gapDeltaEmpty: openContentGaps.length === 0
      && p0Gaps.length === 0
      && unmappedVmApps.length === 0,
    structuralOnly: true,
  };
  gapDelta.structuralOnly = gapDelta.gapDeltaEmpty;
  gapDelta.parityWorkRemaining = gapDelta.parityDebt.length > 0;

  const configuredPhases = profile.storeCampaign?.campaignPhases
    || (coherence?.campaignRecipe?.phases || []).map((p) => p.id);
  const afterSkip = loadCampaignPhases(registryId, { applyDifferentialSkip: true });
  const skipped = configuredPhases
    .filter((id) => !afterSkip.includes(id))
    .map((id) => ({ id, ...shouldSkipCampaignPhase(registryId, id) }));

  const recommendations = buildRecommendations(registryId, gapDelta, diff);

  return {
    registryId,
    generatedAt: new Date().toISOString(),
    toolkit: catalog?.toolkit || profile.toolkit || entry.toolkit?.id || 'gnome',
    coherenceContract: coherence?.doc || 'etc/capsuleos/contracts/os-reproduction-coherence.json',
    workflow: diff?.workflow || ['VmInventory', 'SlotMap', 'GapDelta', 'SelectiveCR'],
    predicates: {
      AppV: appsPred.AppV,
      AppC: appsPred.AppC,
      AppP0: appsPred.AppP0,
      AppΣ: appsPred.AppΣ,
      AppVp: appsRep.state.AppVp,
      StoreG: storePred.state.StoreG,
      StoreVp: storePred.state.StoreVp,
      VΣ: vSigma.closed,
      RealΣ: p0RealSigmaSlots.length === p0Slots.length && p0Slots.length > 0 && vSigma.closed,
    },
    slotMap,
    unmappedVmApps,
    gapDelta,
    campaignPhases: {
      configured: configuredPhases,
      afterSkip,
      skipped,
    },
    recommendations,
    summary: {
      vmAppsInstalled: installed.length,
      catalogRows: catalogRows.length,
      mappedSlots: slotMap.filter((s) => s.slotId).length,
      reuseEligible: slotMap.filter((s) => s.reuseSigma).length,
      openGapsTotal: openContentGaps.length,
      p0CatalogGaps: p0Gaps.length,
      unmappedVm: unmappedVmApps.length,
      gapDeltaEmpty: gapDelta.gapDeltaEmpty,
      parityDebtP0: gapDelta.parityDebt.length,
      parityWorkRemaining: gapDelta.parityWorkRemaining,
      realSigmaP0: `${p0RealSigmaSlots.length}/${p0Slots.length}`,
      realSigmaRegistry: gapDelta.realSigma.registryClosed,
    },
  };
};

export const renderSlotGapDeltaMarkdown = (report) => {
  const lines = [];
  lines.push(`# SlotMap / GapΔ — ${report.registryId}`);
  lines.push('');
  lines.push(`> Généré : \`${report.generatedAt}\` · Toolkit : **${report.toolkit}** · [convention-reproduction-parfaite.md](../convention-reproduction-parfaite.md) §2c`);
  lines.push('');
  lines.push('```bash');
  lines.push(`node usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs --id ${report.registryId} --write`);
  lines.push('```');
  lines.push('');
  lines.push('## Synthèse');
  lines.push('');
  lines.push('| Indicateur | Valeur |');
  lines.push('|------------|--------|');
  lines.push(`| Apps VM | ${report.summary.vmAppsInstalled} |`);
  lines.push(`| Slots mappés | ${report.summary.mappedSlots} |`);
  lines.push(`| Réutilisation Σ (ReuseΣ) | ${report.summary.reuseEligible} |`);
  lines.push(`| contentGaps ouverts | ${report.summary.openGapsTotal} |`);
  lines.push(`| Écarts catalogue P0 | ${report.summary.p0CatalogGaps} |`);
  lines.push(`| Apps VM non mappées | ${report.summary.unmappedVm} |`);
  lines.push(`| **GapΔ structurel vide** | ${report.summary.gapDeltaEmpty ? '✓ oui — ne pas tout refaire' : '✗ non — campagne ciblée'} |`);
  lines.push(`| Dette parité P0 (sans gap ouvert) | ${report.summary.parityDebtP0} |`);
  lines.push(`| **RealΣ** (Vp ∧ VΣ ∧ depth≠partial) | ${report.summary.realSigmaP0} slots · registre ${report.summary.realSigmaRegistry ? '✓' : '✗'} |`);
  lines.push('');
  if (report.gapDelta.parityDebt?.length) {
    lines.push('## Dette parité (≠ ré-extraction)');
    lines.push('');
    for (const p of report.gapDelta.parityDebt) {
      lines.push(`- **${p.slotId}** — visualMatch: ${p.visualMatch}`);
    }
    lines.push('');
  }
  lines.push('## Phases CR');
  lines.push('');
  lines.push(`- Configurées : ${report.campaignPhases.configured.join(', ')}`);
  lines.push(`- Après skip C9 : ${report.campaignPhases.afterSkip.join(', ') || '—'}`);
  if (report.campaignPhases.skipped.length) {
    lines.push('- Sautées :');
    for (const s of report.campaignPhases.skipped) {
      lines.push(`  - **${s.id}** — ${s.reason}`);
    }
  }
  lines.push('');
  if (report.recommendations.length) {
    lines.push('## Recommandations (ordre)');
    lines.push('');
    for (const r of report.recommendations) {
      lines.push(`1. **${r.action}** (\`${r.rule}\`)`);
      lines.push(`   \`${r.command}\``);
    }
    lines.push('');
  }
  lines.push('## SlotMap');
  lines.push('');
  lines.push('| Slot | Priorité | Catalogue | ReuseΣ | visualMatch | depth | RealΣ | Gaps |');
  lines.push('|------|----------|-----------|--------|-------------|-------|-------|------|');
  for (const s of report.slotMap.filter((x) => x.slotId)) {
    const rs = s.realSigma === true ? '✓' : (s.realSigma === false ? '✗' : '—');
    lines.push(
      `| ${s.slotId} | ${s.priorite} | ${s.catalogStatut} | ${s.reuseSigma ? '✓' : '—'} `
      + `| ${s.visualMatch} | ${s.functionalDepth || '—'} | ${rs} | ${s.openGaps.length} |`,
    );
  }
  lines.push('');
  if (report.gapDelta.openContentGaps.length) {
    lines.push('## GapΔ — contentGaps ouverts');
    lines.push('');
    for (const g of report.gapDelta.openContentGaps) {
      lines.push(`- **${g.slotId || '—'}** · ${g.dimension} · ${g.severity} — ${g.note || g.id}`);
    }
    lines.push('');
  }
  if (report.unmappedVmApps.length) {
    lines.push('## Apps VM sans slot');
    lines.push('');
    for (const a of report.unmappedVmApps.slice(0, 20)) {
      lines.push(`- ${a.name} (\`${a.vmId}\`)`);
    }
    if (report.unmappedVmApps.length > 20) {
      lines.push(`- … +${report.unmappedVmApps.length - 20} autres`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
};

export const writeSlotGapDeltaReport = (registryId) => {
  const draft = buildSlotGapDeltaReport(registryId);
  const materialization = materializeParityDebtGaps(registryId, {
    slotMap: draft.slotMap,
    toolkit: draft.toolkit,
    realSigmaDebt: draft.gapDelta.realSigmaDebt,
    vSigma: {
      closed: draft.gapDelta.realSigma.vSigmaClosed,
      reason: draft.gapDelta.realSigma.vSigmaReason,
    },
    write: true,
  });
  const report = materialization.added.length ? buildSlotGapDeltaReport(registryId) : draft;
  report.materialization = materialization;
  const out = reportPathsForRegistry(registryId);
  fs.writeFileSync(out.json, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(out.md, renderSlotGapDeltaMarkdown(report));
  return { report, paths: out, materialization };
};
