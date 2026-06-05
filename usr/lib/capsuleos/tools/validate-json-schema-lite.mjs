/**
 * Validation structurelle légère (sous-ensemble utile à CapsuleOS).
 * Pas de dépendance npm — complète validate-json.mjs / futur validate-capsule.
 */

const ID_PATTERN = /^[a-z0-9-]+$/;

const FAMILY_ENUM = new Set([
  'linux', 'windows', 'macos', 'android', 'ios', 'bsd',
  'chromeos', 'harmonyos', 'unix', 'retro', 'other',
]);

const TIER_ENUM = new Set(['P0', 'P1', 'P2', 'P3', 'P4']);
const STATUS_ENUM = new Set(['active', 'beta', 'stub', 'planned', 'deprecated', 'archived']);

const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * @param {object} profile
 * @param {string} label chemin relatif pour les messages
 * @returns {string[]} erreurs
 */
export function validateSkinProfile(profile, label) {
  const errors = [];
  const req = ['id', 'version', 'family', 'displayName', 'bodyId', 'embedKey', 'tier', 'status', 'paths'];
  req.forEach((key) => {
    if (profile[key] === undefined) errors.push(`${label}: champ requis manquant "${key}"`);
  });
  if (profile.id && !ID_PATTERN.test(profile.id)) {
    errors.push(`${label}: id invalide (^[a-z0-9-]+$)`);
  }
  if (profile.version !== undefined && (!Number.isInteger(profile.version) || profile.version < 1)) {
    errors.push(`${label}: version doit être un entier ≥ 1`);
  }
  if (profile.family && !FAMILY_ENUM.has(profile.family)) {
    errors.push(`${label}: family hors enum`);
  }
  if (profile.tier && !TIER_ENUM.has(profile.tier)) {
    errors.push(`${label}: tier hors enum`);
  }
  if (profile.status && !STATUS_ENUM.has(profile.status)) {
    errors.push(`${label}: status hors enum`);
  }
  if (profile.paths && !isNonEmptyString(profile.paths.facade)) {
    errors.push(`${label}: paths.facade requis`);
  }
  if (profile.maturity !== undefined) {
    const m = profile.maturity;
    if (typeof m !== 'number' || m < 0 || m > 1) {
      errors.push(`${label}: maturity doit être entre 0 et 1`);
    }
  }
  return errors;
}

/**
 * @param {object} registry
 * @returns {string[]} erreurs
 */
export function validateOsRegistry(registry) {
  const errors = [];
  if (!Number.isInteger(registry.version) || registry.version < 1) {
    errors.push('os-registry.json: version invalide');
  }
  if (!Array.isArray(registry.entries)) {
    errors.push('os-registry.json: entries[] manquant');
    return errors;
  }
  const seen = new Set();
  registry.entries.forEach((entry, i) => {
    const ctx = `os-registry.entries[${i}]`;
    if (!isNonEmptyString(entry.id)) {
      errors.push(`${ctx}: id manquant`);
      return;
    }
    if (seen.has(entry.id)) errors.push(`${ctx}: id dupliqué "${entry.id}"`);
    seen.add(entry.id);
    if (!FAMILY_ENUM.has(entry.family)) errors.push(`${ctx} (${entry.id}): family invalide`);
    if (entry.status === 'active') {
      if (!TIER_ENUM.has(entry.tier)) errors.push(`${ctx} (${entry.id}): tier requis si active`);
      if (entry.facade && typeof entry.facade !== 'string') {
        errors.push(`${ctx} (${entry.id}): facade doit être une chaîne`);
      }
    }
  });
  return errors;
}

/**
 * @param {object} manifest
 * @returns {string[]} erreurs
 */
export function validateAssetsManifest(manifest) {
  const errors = [];
  if (!Number.isInteger(manifest.version) || manifest.version < 1) {
    errors.push('manifest.json: version invalide');
  }
  if (!isObject(manifest.packs)) {
    errors.push('manifest.json: packs{} manquant');
  }
  return errors;
}

/**
 * Fichiers strings.json des skins : objet plat string → string.
 * @param {unknown} data
 * @param {string} label
 * @returns {string[]} erreurs
 */
export function validateStringsJson(data, label) {
  const errors = [];
  if (!isObject(data)) {
    errors.push(`${label}: doit être un objet JSON`);
    return errors;
  }
  for (const [key, value] of Object.entries(data)) {
    if (!isNonEmptyString(key)) errors.push(`${label}: clé invalide`);
    if (typeof value !== 'string') errors.push(`${label}: "${key}" doit être une chaîne`);
  }
  return errors;
}

/**
 * @param {object} data
 * @param {string} label
 * @returns {string[]} erreurs
 */
export function validateCapsuleManifest(data, label) {
  const errors = [];
  if (!isNonEmptyString(data.root)) errors.push(`${label}: root manquant`);
  if (!isObject(data.folders)) errors.push(`${label}: folders{} manquant`);
  return errors;
}
