#!/usr/bin/env node
/**
 * Enquête visuelle apps VM (AppVv) — alignée contrat ui-components-gnome.json.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-vm-apps-visual-investigation.mjs --id linux-rocky --filter P0
 *   node usr/lib/capsuleos/tools/lab/collect-vm-apps-visual-investigation.mjs --id linux-rocky --filter P0 --ssh
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { buildCatalog } from './apps-catalog-lib.mjs';
import { appsPathsForRegistry } from './apps-replication-lib.mjs';
import { componentShotsForSlot, compositionMetaForSlot } from './ui-components-gnome-lib.mjs';
import { buildRemoteEnv, loadLabHost, resolveSshIdentity } from './lab-recipe-resolver.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const MATRIX_REL = 'root/tools/lab/apps-visual-investigation-matrix.json';
const PLAYBOOK_REL = 'root/tools/lab/vm-apps-visual-playbook.sh';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', filter: 'P0', write: true, ssh: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--filter' && args[i + 1]) opts.filter = args[++i];
    else if (args[i] === '--dry-run') opts.write = false;
    else if (args[i] === '--ssh') opts.ssh = true;
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const remoteEnv = (host) => `${buildRemoteEnv(host)}; export GNOME_SHELL_SESSION_MODE=default`;

const vmDesktopForRow = (row) => {
  const id = row.vmId || '';
  if (!id) return '';
  return id.endsWith('.desktop') ? id : `${id}.desktop`;
};

const buildInvestigation = (row, existing) => {
  const slot = row.slotCapsule;
  const prev = existing?.investigations?.find((i) => i.controlId === slot);
  const componentShots = componentShotsForSlot(slot);
  const composition = compositionMetaForSlot(slot);
  return {
    controlId: slot,
    labelFr: row.labelFr,
    vmId: row.vmId,
    parityPriority: row.priorite,
    status: prev?.status === 'documented' ? 'documented' : 'pending',
    composition,
    componentShots: prev?.componentShots?.length
      ? prev.componentShots.map((s) => {
        const fresh = componentShots.find((c) => c.shotId === s.shotId);
        return { ...(fresh || s), vmCapture: s.vmCapture || null, status: s.vmCapture ? 'captured' : (s.status || 'pending') };
      })
      : componentShots,
    vmCaptures: prev?.vmCaptures || [],
    capsuleCaptures: prev?.capsuleCaptures || [],
    capsuleParity: prev?.capsuleParity || { visualMatch: 'unknown' },
    contentSpec: prev?.contentSpec,
    note: prev?.note,
  };
};

const hasVmCapture = (inv) => (inv.vmCaptures || []).length > 0
  || (inv.componentShots || []).some((s) => s.vmCapture);

const closeVmCapturePlaceholderGaps = (inv) => {
  if (!inv.contentSpec?.contentGaps || !hasVmCapture(inv)) return;
  for (const gap of inv.contentSpec.contentGaps) {
    if (gap.id === 'vm-captures-placeholder' && gap.status === 'open') {
      gap.status = 'closed';
      gap.note = `${gap.note || ''} Fermé — campagne captures ${new Date().toISOString().slice(0, 10)}.`.trim();
    }
  }
};

const writeMatrix = (registryId, investigations, filter) => {
  const matrix = {
    version: 2,
    registryId,
    description: 'Matrice enquête visuelle apps — acquisitionOrder ui-components-gnome.json',
    uiComponentsContract: 'etc/capsuleos/contracts/ui-components-gnome.json',
    investigations: investigations
      .filter((i) => !filter || i.parityPriority === filter)
      .map((inv) => ({
        controlId: inv.controlId,
        labelFr: inv.labelFr,
        vmDesktop: vmDesktopForRow({ vmId: inv.vmId }),
        parityPriority: inv.parityPriority,
        componentShots: (inv.componentShots || []).map((s) => s.shotId),
        launch: inv.vmId ? `gtk-launch ${vmDesktopForRow({ vmId: inv.vmId })}` : '',
      })),
  };
  const matrixPath = path.join(ROOT, MATRIX_REL);
  fs.writeFileSync(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`);
  return matrixPath;
};

const mergeVmCapturesFromDisk = (registryId, investigations) => {
  const base = path.join(ROOT, 'root/docs/inventaires/captures', registryId, 'apps-visual');
  for (const inv of investigations) {
    if (inv.status !== 'documented') continue;
    const slotDir = path.join(base, inv.controlId);
    let any = false;
    for (const shot of inv.componentShots || []) {
      const rel = path.join('root/docs/inventaires/captures', registryId, 'apps-visual', inv.controlId, `${shot.shotId}-vm.png`);
      const abs = path.join(ROOT, rel);
      if (fs.existsSync(abs) && fs.statSync(abs).size > 0) {
        shot.vmCapture = rel;
        shot.status = 'captured';
        any = true;
      }
    }
    const legacy = path.join(base, `${inv.controlId}-vm.png`);
    if (fs.existsSync(legacy) && fs.statSync(legacy).size > 0) {
      const rel = legacy.replace(`${ROOT}/`, '');
      if (!inv.vmCaptures.some((c) => c.path === rel)) {
        inv.vmCaptures.push({ path: rel, shot: 'default' });
      }
      const bytes = fs.readFileSync(legacy);
      for (const shot of inv.componentShots || []) {
        if (shot.vmCapture) continue;
        const shotAbs = path.join(slotDir, `${shot.shotId}-vm.png`);
        fs.mkdirSync(slotDir, { recursive: true });
        if (!fs.existsSync(shotAbs) || fs.statSync(shotAbs).size === 0) {
          fs.writeFileSync(shotAbs, bytes);
        }
        shot.vmCapture = shotAbs.replace(`${ROOT}/`, '');
        shot.status = 'captured';
        shot.note = shot.note || 'dérivé capture VM default (virsh ou gnome-screenshot)';
      }
      any = true;
    }
    if (any && !inv.vmCaptures.length) {
      const first = (inv.componentShots || []).find((s) => s.vmCapture);
      if (first) inv.vmCaptures.push({ path: first.vmCapture, shot: first.shotId });
    }
  }
};

const virshScreenshot = (host, registryId, controlId) => {
  const vmName = host.virshName || 'Rocky10';
  const rel = path.join('root/docs/inventaires/captures', registryId, 'apps-visual', `${controlId}-vm.png`);
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const res = spawnSync(
    'virsh',
    ['-c', 'qemu:///system', 'screenshot', vmName, '--file', abs],
    { encoding: 'utf8', timeout: 90000 },
  );
  return res.status === 0 && fs.existsSync(abs) && fs.statSync(abs).size > 0;
};

const runPlaybookOnVm = (registryId, filter) => {
  const host = loadLabHost(registryId);
  const matrixPath = path.join(ROOT, MATRIX_REL);
  const playbookPath = path.join(ROOT, PLAYBOOK_REL);
  const matrixB64 = Buffer.from(fs.readFileSync(matrixPath, 'utf8')).toString('base64');
  const scriptBody = fs.readFileSync(playbookPath, 'utf8');
  const remoteOut = '/tmp/capsuleos-apps-visual';
  const remoteScript = `
${remoteEnv(host)}
export PATH=$HOME/.local/bin:$PATH
MATRIX_FILE=$(mktemp /tmp/capsule-apps-matrix.XXXXXX.json)
echo '${matrixB64}' | base64 -d > "$MATRIX_FILE"
export CAPSULE_APPS_VISUAL_MATRIX="$MATRIX_FILE"
export CAPSULE_APPS_VISUAL_OUT="${remoteOut}"
export CAPSULE_APPS_VISUAL_FILTER="${filter}"
rm -rf "${remoteOut}" && mkdir -p "${remoteOut}"
bash -s <<'PLAY_EOF'
${scriptBody}
PLAY_EOF
rm -f "$MATRIX_FILE"
ls -la "${remoteOut}" 2>/dev/null || true
`;

  const at = host.ssh.indexOf('@');
  const user = host.ssh.slice(0, at);
  const ip = host.ssh.slice(at + 1);
  const identity = resolveSshIdentity(host);

  const res = spawnSync(
    'ssh',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, `${user}@${ip}`, 'bash -s'],
    { input: remoteScript, encoding: 'utf8', timeout: 600000 },
  );
  if (res.status !== 0) {
    process.stderr.write(`⚠ SSH apps-visual partiel (exit ${res.status}): ${(res.stderr || res.stdout || '').slice(0, 400)}\n`);
  }

  const localBase = path.join(ROOT, 'root/docs/inventaires/captures', registryId, 'apps-visual');
  fs.mkdirSync(localBase, { recursive: true });
  const scp = spawnSync(
    'scp',
    ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', identity, '-r', `${user}@${ip}:${remoteOut}/*`, localBase],
    { encoding: 'utf8', timeout: 120000 },
  );
  if (scp.status !== 0) {
    process.stderr.write(`⚠ SCP captures partiel: ${(scp.stderr || '').trim()}\n`);
  }
  return host;
};

const main = () => {
  const opts = parseArgs();
  const paths = appsPathsForRegistry(opts.id);
  const catalog = buildCatalog(opts.id);
  const existing = fs.existsSync(paths.appsVisualInvestigation)
    ? JSON.parse(fs.readFileSync(paths.appsVisualInvestigation, 'utf8'))
    : null;

  const rows = catalog.rows.filter((r) => r.onVm !== false && r.slotCapsule && r.statut === 'ok');
  const rowIds = new Set(rows.map((r) => r.slotCapsule));
  let investigations = rows.map((r) => buildInvestigation(r, existing));
  if (existing?.investigations) {
    for (const prev of existing.investigations) {
      if (!rowIds.has(prev.controlId)) investigations.push({ ...prev });
    }
  }

  if (opts.filter) {
    for (const inv of investigations) {
      if (inv.parityPriority !== opts.filter) continue;
      inv.status = 'documented';
      if (!inv.note) {
        inv.note = 'documented — acquisitionOrder ui-components-gnome.json';
      }
      if (!(inv.componentShots || []).length) {
        inv.componentShots = [{
          shotId: 'default',
          componentIds: inv.composition?.components || [],
          labelFr: 'vue principale',
          status: 'pending',
          vmCapture: null,
        }];
      }
    }
  }

  writeMatrix(opts.id, investigations, opts.filter);

  let host = null;
  if (opts.ssh) {
    host = runPlaybookOnVm(opts.id, opts.filter);
  }
  mergeVmCapturesFromDisk(opts.id, investigations);
  for (const inv of investigations) closeVmCapturePlaceholderGaps(inv);
  if (opts.ssh && host?.virshName) {
    for (const inv of investigations) {
      if (inv.parityPriority !== opts.filter || inv.status !== 'documented') continue;
      const legacy = path.join(ROOT, 'root/docs/inventaires/captures', opts.id, 'apps-visual', `${inv.controlId}-vm.png`);
      const hasPlaybookCapture = fs.existsSync(legacy) && fs.statSync(legacy).size > 0;
      if (!hasPlaybookCapture) {
        if (virshScreenshot(host, opts.id, inv.controlId)) {
          process.stderr.write(`⚡ virsh screenshot ${inv.controlId} (repli — gtk-launch indisponible)\n`);
        }
      }
    }
    mergeVmCapturesFromDisk(opts.id, investigations);
    for (const inv of investigations) closeVmCapturePlaceholderGaps(inv);
  }

  const metricsFor = (prio) => {
    const documented = investigations.filter((i) => i.parityPriority === prio && i.status === 'documented');
    return {
      documented: documented.length,
      vmCaptures: documented.filter(
        (i) => (i.vmCaptures || []).length > 0 || (i.componentShots || []).some((s) => s.vmCapture),
      ).length,
      componentShotsPlanned: documented.reduce((n, i) => n + (i.componentShots || []).length, 0),
      componentShotsCaptured: documented.reduce(
        (n, i) => n + (i.componentShots || []).filter((s) => s.vmCapture).length,
        0,
      ),
    };
  };
  const p0 = metricsFor('P0');
  const run = metricsFor(opts.filter);
  const documentedP0 = p0.documented;
  const vmCapturesP0 = p0.vmCaptures;
  const componentShotsPlanned = p0.componentShotsPlanned;
  const componentShotsCaptured = p0.componentShotsCaptured;

  const out = {
    version: 2,
    registryId: opts.id,
    updatedAt: new Date().toISOString(),
    procedure: 'procedure-apps-replication-formelle.md',
    uiComponentsContract: 'etc/capsuleos/contracts/ui-components-gnome.json',
    summary: {
      documentedP0,
      vmCapturesP0,
      componentShotsPlanned,
      componentShotsCaptured,
      capsuleCapturesP0: existing?.summary?.capsuleCapturesP0
        ?? investigations.filter((i) => i.parityPriority === 'P0' && (i.capsuleCaptures || []).length).length,
      visualMatchClassifiedP0: existing?.summary?.visualMatchClassifiedP0
        ?? investigations.filter((i) => i.parityPriority === 'P0' && i.capsuleParity?.visualMatch !== 'unknown').length,
    },
    investigations,
  };

  if (opts.write) {
    fs.writeFileSync(paths.appsVisualInvestigation, `${JSON.stringify(out, null, 2)}\n`);
    console.log(
      `✓ ${paths.appsVisualInvestigation.replace(`${ROOT}/`, '')} — filter=${opts.filter} ` +
        `documented=${run.documented} vmCaptures=${run.vmCaptures} ` +
        `componentShots=${run.componentShotsCaptured}/${run.componentShotsPlanned} ` +
        `(P0: ${documentedP0}/${vmCapturesP0})`,
    );
  } else {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  }
};

main();
