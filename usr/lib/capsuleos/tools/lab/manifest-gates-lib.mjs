/**
 * Prédicats manifeste distribution — ManV, PbM, ManA, ManSt, ManI (tous registryId).
 */
import { loadManifest, pathsForManifest } from './vm-manifest-lib.mjs';
import { loadPlaybook } from './manifest-playbook-lib.mjs';
import fs from 'fs';

export const evaluateManifestGates = (registryId) => {
  const manifestPath = pathsForManifest(registryId).manifest;
  const manifest = loadManifest(registryId);
  const playbook = loadPlaybook(registryId);

  const ManV = !!(manifest && fs.existsSync(manifestPath));
  const ManS = ManV
    && (manifest.manifestVersion || 1) >= 2
    && (manifest.media?.fonts?.entryCount > 0 || manifest.media?.mimetypes?.entryCount > 0);
  const PbM = !!playbook?.items?.length;
  const ManA = !!(manifest?.validation?.approved || manifest?.validation?.status === 'approved');
  const ManSt = playbook?.staging?.status === 'completed';
  const ManI = playbook?.import?.status === 'completed'
    || manifest?.import?.status === 'completed';
  const ManInt = (playbook?.phases || []).some(
    (p) => p.id === 'integrate-skin' && p.status === 'done',
  );

  return {
    ManV,
    ManS,
    PbM,
    ManA,
    ManSt,
    ManI,
    ManInt,
    ManΣ: ManV && ManS && ManA && ManSt && ManI && ManInt,
    manifestVersion: manifest?.manifestVersion || 0,
    playbookSummary: playbook?.summary || null,
  };
};
