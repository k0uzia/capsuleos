#!/usr/bin/env node
/**
 * Purge captures + artefacts de campagne KDE Neon — relance A→Z sans toucher au clone.
 *
 * Conserve : home/Debian/KDE-Neon/, catalogues VM, scénarios fidelity, ground-truth.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/reset-kde-neon-campaign.mjs
 *   node usr/lib/capsuleos/tools/lab/reset-kde-neon-campaign.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY = 'linux-kde-neon';
const INV = path.join(ROOT, 'root/docs/inventaires');

const write = process.argv.includes('--write');
const campaignArg = process.argv.find((a, i) => process.argv[i - 1] === '--campaign');
const CAMPAIGN_ID = campaignArg || 'v13-clone-excellence';

const rmPath = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return false;
  if (!write) {
    console.log(`[dry-run] supprimer ${rel}`);
    return true;
  }
  fs.rmSync(abs, { recursive: true, force: true });
  console.log(`✓ supprimé ${rel}`);
  return true;
};

const CAMPAIGN_DOCS = [
  'root/docs/inventaires/linux-kde-neon-roadmap.md',
  'root/docs/inventaires/linux-kde-neon-roadmap-v4.md',
  'root/docs/inventaires/linux-kde-neon-roadmap-v6.md',
  'root/docs/inventaires/linux-kde-neon-roadmap-v7.md',
  'root/docs/inventaires/linux-kde-neon-roadmap-v10.md',
  'root/docs/inventaires/linux-kde-neon-roadmap-v11-visual-parity.md',
  'root/docs/inventaires/linux-kde-neon-roadmap-pass.md',
  'root/docs/inventaires/linux-kde-neon-roadmap-ground.md',
  'root/docs/inventaires/linux-kde-neon-roadmap-g-coherence.md',
  'root/docs/inventaires/linux-kde-neon-g-coherence-handoff.md',
  'root/docs/inventaires/linux-kde-neon-vp-residual.md',
  'root/docs/inventaires/linux-kde-neon-v4-p1-handoff.md',
  'root/docs/inventaires/linux-kde-neon-v4-p2-kickoff-audit.md',
  'root/docs/inventaires/linux-kde-neon-panel-tray-closure.md',
  'root/docs/inventaires/linux-kde-neon-kickoff-closure.md',
  'root/docs/inventaires/linux-kde-neon-discover-detail-diff.md',
  'root/docs/inventaires/linux-kde-neon-discover-closure.md',
  'root/docs/inventaires/linux-kde-neon-dolphin-diff.md',
  'root/docs/inventaires/linux-kde-neon-firefox-toolbar-matrix.md',
  'root/docs/inventaires/linux-kde-neon-css-assets-audit.md',
  'root/docs/inventaires/linux-kde-neon-clone-status.md',
  'root/docs/inventaires/linux-kde-neon-repair-checklist.md',
  'root/docs/inventaires/linux-kde-neon-playbook-tail.md',
];

const CAMPAIGN_JSON = [
  'root/docs/inventaires/linux-kde-neon-pipeline-resolve.json',
  'root/docs/inventaires/linux-kde-neon-formal-resolve.json',
  'root/docs/inventaires/linux-kde-neon-playbook-general-resolve.json',
  'root/docs/inventaires/linux-kde-neon-parity-index.json',
  'root/docs/inventaires/linux-kde-neon-visual-fidelity.json',
  'root/docs/inventaires/linux-kde-neon-credibility-formal-state.json',
  'root/docs/inventaires/linux-kde-neon-formal-state.json',
  'root/docs/inventaires/linux-kde-neon-shell-polish.json',
  'root/docs/inventaires/linux-kde-neon-shell-polish-phase2.json',
  'root/docs/inventaires/linux-kde-neon-gnome-settings-h6-ready.json',
  'root/docs/inventaires/linux-kde-neon-gnome-settings-h6-closure.json',
  'root/docs/inventaires/linux-kde-neon-app-fidelity-gaps.json',
  'root/docs/inventaires/linux-kde-neon-kde-ground-truth-gaps.json',
  'root/docs/inventaires/linux-kde-neon-ground-truth-gaps.json',
  'root/docs/inventaires/linux-kde-neon-playbook-tail.json',
  'root/docs/inventaires/linux-kde-neon-playbook-general-state.json',
];

const CAPTURE_DIRS = [
  'root/docs/inventaires/captures/linux-kde-neon',
  'home/public/Images/screen_KDE-Neon',
];

const INTERACTIONS_DIR = 'root/docs/inventaires/interactions/linux-kde-neon';

const resetAppsVisualInvestigation = () => {
  const file = path.join(INV, `${REGISTRY}-apps-visual-investigation.json`);
  if (!fs.existsSync(file)) return;
  const inv = JSON.parse(fs.readFileSync(file, 'utf8'));
  let vmP0 = 0;
  let capP0 = 0;
  let classifiedP0 = 0;
  let shotsCaptured = 0;

  for (const item of inv.investigations || []) {
    const hasVm = (item.vmCaptures || []).length > 0
      || (item.componentShots || []).some((s) => s.vmCapture);
    if (item.parityPriority === 'P0' && hasVm) vmP0 += 1;

    item.vmCaptures = [];
    item.capsuleCaptures = [];
    if (item.capsuleParity) {
      delete item.capsuleParity;
    }
    for (const shot of item.componentShots || []) {
      if (shot.vmCapture) {
        delete shot.vmCapture;
      }
      if (shot.status === 'captured') {
        shot.status = 'planned';
      }
    }
    if (item.parityPriority === 'P0' && item.status === 'documented') {
      classifiedP0 += 0;
    }
    shotsCaptured += (item.componentShots || []).filter((s) => s.status === 'captured').length;
  }

  inv.summary = {
    documentedP0: (inv.investigations || []).filter(
      (i) => i.parityPriority === 'P0' && i.status === 'documented',
    ).length,
    vmCapturesP0: 0,
    componentShotsPlanned: (inv.investigations || []).reduce(
      (n, i) => n + (i.componentShots || []).length,
      0,
    ),
    componentShotsCaptured: shotsCaptured,
    capsuleCapturesP0: capP0,
    visualMatchClassifiedP0: classifiedP0,
    visualMatchClassifiedP1: 0,
    visualMatchClassifiedP2: 0,
    capsuleCapturesP1: 0,
    capsuleCapturesP2: 0,
  };
  inv.campaignResetAt = new Date().toISOString();
  inv.note = 'Captures purgées — relance campagne A→Z ; structure documented conservée.';

  const rel = `root/docs/inventaires/${REGISTRY}-apps-visual-investigation.json`;
  if (write) {
    fs.writeFileSync(file, `${JSON.stringify(inv, null, 2)}\n`);
    console.log(`✓ réinitialisé ${rel}`);
  } else {
    console.log(`[dry-run] réinitialiser ${rel}`);
  }
};

const writeReplicationState = () => {
  const now = new Date().toISOString();
  const state = {
    registryId: REGISTRY,
    campaign: CAMPAIGN_ID,
    campaignStatus: 'active',
    startedAt: now,
    purgedAt: now,
    previousCampaigns: [
      'v3-full-parity',
      'v4-deep-parity',
      'G-coherence',
      'v11-visual-parity',
    ],
    groundTruth: {
      pivot: true,
      doc: 'root/docs/ground-truth-kde.md',
      contract: 'etc/capsuleos/contracts/kde-ground-truth-chain.json',
      scope: 'Relance A→Z — clone skin conservé, métriques campagne purgées',
      propagationPolicy: `ground Neon d’abord — dérivés après excellence ${CAMPAIGN_ID.replace(/^v\d+-/, 'v')}`,
    },
    openBacklog: [
      'KdM/KdI — inventaire VM + validate-clone-assets',
      'Captures shell baseline (capture-clone-surfaces)',
      'AppVv→AppVp — collect VM/Capsule apps P0',
      'CredΣ — smoke fidelity scénarios',
      'Se+ Paramètres KDE · parité pixel documentée',
    ],
    clonePreserved: true,
  };
  const rel = `root/docs/inventaires/${REGISTRY}-replication-state.json`;
  if (write) {
    fs.writeFileSync(path.join(ROOT, rel), `${JSON.stringify(state, null, 2)}\n`);
    console.log(`✓ écrit ${rel}`);
  } else {
    console.log(`[dry-run] écrire ${rel}`);
  }
};

const resetAppsLabState = () => {
  const file = path.join(INV, `${REGISTRY}-apps-lab-state.json`);
  const state = {
    registryId: REGISTRY,
    status: 'pending',
    updatedAt: new Date().toISOString(),
    gate: 'run-apps-lab.mjs',
    playwright: false,
    vm: false,
    shell: false,
    note: 'Réinitialisé par reset-kde-neon-campaign.mjs',
  };
  const rel = `root/docs/inventaires/${REGISTRY}-apps-lab-state.json`;
  if (write) {
    fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
    console.log(`✓ réinitialisé ${rel}`);
  } else {
    console.log(`[dry-run] réinitialiser ${rel}`);
  }
};

const resetSettingsEffectsState = () => {
  const file = path.join(INV, `${REGISTRY}-settings-effects-state.json`);
  if (!fs.existsSync(file)) return;
  const state = {
    registryId: REGISTRY,
    updatedAt: new Date().toISOString(),
    status: 'pending',
    note: 'Campagne v12 — re-mesure Se+ requise',
  };
  const rel = `root/docs/inventaires/${REGISTRY}-settings-effects-state.json`;
  if (write) {
    fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
    console.log(`✓ réinitialisé ${rel}`);
  } else {
    console.log(`[dry-run] réinitialiser ${rel}`);
  }
};

const main = () => {
  console.log(`\n── reset-kde-neon-campaign ${write ? '--write' : '(dry-run)'} ──\n`);

  for (const rel of CAPTURE_DIRS) rmPath(rel);
  for (const rel of CAMPAIGN_DOCS) rmPath(rel);
  for (const rel of CAMPAIGN_JSON) rmPath(rel);
  rmPath(INTERACTIONS_DIR);

  resetAppsVisualInvestigation();
  resetAppsLabState();
  resetSettingsEffectsState();
  writeReplicationState();

  console.log(`\n${write ? '✓' : '→'} reset-kde-neon-campaign terminé`);
  if (!write) {
    console.log('  Relancer avec --write pour appliquer.');
  }
};

main();
