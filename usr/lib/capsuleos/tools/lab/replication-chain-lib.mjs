/**
 * Bibliothèque chaîne de réplication — chemins et métadonnées par registryId.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/replication-chain.json');
const REGISTRY_PATH = path.join(ROOT, 'etc/capsuleos/os-registry.json');

export const loadContract = () => JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));

export const loadRegistryEntry = (registryId) => {
  const reg = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const entry = (reg.entries || []).find((e) => e.id === registryId);
  if (!entry) throw new Error(`registryId inconnu: ${registryId}`);
  return entry;
};

export const skinUrlFromRegistry = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  const skin = entry.referencePaths?.skin || entry.referencePaths?.facade;
  if (!skin) throw new Error(`referencePaths.skin manquant pour ${registryId}`);
  return `http://127.0.0.1:5500/${skin.replace(/^\//, '')}`;
};

export const vendorFromRegistry = (registryId) => {
  const entry = loadRegistryEntry(registryId);
  return entry.vendor || registryId.replace(/^linux-/, '');
};

export const pathsForRegistry = (registryId) => {
  const vendor = vendorFromRegistry(registryId);
  const prefix = registryId.replace(/^linux-/, '');
  return {
    registryId,
    vendor,
    visualInvestigation: path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-visual-investigation.json`),
    vmCapturesDir: path.join(ROOT, 'root/docs/inventaires/captures', registryId, 'gnome-settings-visual'),
    capsuleCapturesDir: path.join(ROOT, 'root/docs/inventaires/captures', registryId, 'gnome-settings-visual-capsule'),
    capsuleInventoryDir: path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors', vendor, 'inventory', `${prefix}-capsule`),
    replicationState: path.join(ROOT, 'root/docs/inventaires', `${registryId}-replication-state.json`),
    sourceVmTxt: path.join(ROOT, 'usr/share/capsuleos/assets/images/vendors', vendor, 'SOURCE-VM.txt'),
    assetsInventory: path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-assets.json`),
    capturePrefix: `${prefix}-capsule`,
  };
};

export const readJsonIfExists = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export const countP0Documented = (inv) => (inv?.investigations || []).filter(
  (i) => i.status === 'documented' && i.capsuleParity?.parityPriority === 'P0',
).length;

export const countP0VisualMatchClassified = (inv) => (inv?.investigations || []).filter(
  (i) => i.status === 'documented'
    && i.capsuleParity?.parityPriority === 'P0'
    && i.capsuleParity?.visualMatch
    && i.capsuleParity.visualMatch !== 'unknown',
).length;

export const countP0CapsuleCaptures = (inv) => (inv?.investigations || []).filter(
  (i) => i.status === 'documented'
    && i.capsuleParity?.parityPriority === 'P0'
    && (i.capsuleCaptures || []).some((c) => c.path),
).length;

export const evaluatePredicates = (registryId, domain = 'gnome-settings-playbook') => {
  const contract = loadContract();
  const p = pathsForRegistry(registryId);
  const inv = readJsonIfExists(p.visualInvestigation);
  const domainPreds = contract.domains[domain]?.predicates || [];

  const formal = readJsonIfExists(path.join(ROOT, 'root/docs/inventaires', `${registryId}-formal-state.json`));
  const assetsDrift = readJsonIfExists(path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-assets-drift.json`));
  const playbookJson = path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-playbook.json`);

  const state = {
    H2: formal?.gates?.H2?.ok ?? null,
    M: fs.existsSync(path.join(ROOT, 'etc/capsuleos/lab-inventory.json')),
    I: fs.existsSync(path.join(ROOT, 'root/docs/inventaires', `${registryId}-vm.json`)),
    A: assetsDrift
      ? ((assetsDrift.missingCapsuleCount ?? assetsDrift.summary?.missingCapsule ?? 1) === 0
        && (assetsDrift.driftCount ?? assetsDrift.summary?.drift ?? 1) === 0)
      : null,
    S: fs.existsSync(p.assetsInventory),
    T: fs.existsSync(p.sourceVmTxt) && fs.readFileSync(p.sourceVmTxt, 'utf8').trim().length > 0,
    L: (() => {
      const labState = readJsonIfExists(path.join(ROOT, 'root/docs/inventaires', `${registryId}-gnome-settings-lab-state.json`));
      if (labState?.gates?.L?.ok) return true;
      return null;
    })(),
    V: countP0Documented(inv) > 0,
    G: (inv?.gsettingsDeepPass?.p0Enriched || 0) > 0,
    Vc: countP0CapsuleCaptures(inv) > 0,
    Vp: countP0VisualMatchClassified(inv) > 0,
    documentedP0: countP0Documented(inv),
    capsuleCapturesP0: countP0CapsuleCaptures(inv),
    visualMatchClassifiedP0: countP0VisualMatchClassified(inv),
  };

  if (inv?.summary) {
    inv.summary.capsuleCapturesP0 = state.capsuleCapturesP0;
    inv.summary.visualMatchClassifiedP0 = state.visualMatchClassifiedP0;
  }

  const order = ['H2', 'M', 'I', 'A', 'S', 'T', 'L', 'V', 'G', 'Vc', 'Vp', 'H6'];
  let nextPredicate = null;
  for (const sym of order) {
    if (!domainPreds.includes(sym)) continue;
    if (state[sym] === false || state[sym] === null) {
      nextPredicate = sym;
      break;
    }
  }

  return { registryId, domain, state, nextPredicate, paths: p, contract };
};
