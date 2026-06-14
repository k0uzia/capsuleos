/**
 * Géométrie VM P0 partagée — capture capsule et compare pixel alignés.
 * Source : captures VM apps-visual (linux-kde-neon).
 */
export const KDE_NEON_PARITY_GEOMETRY = {
  themes: { width: 1060, height: 808 },
  update_manager: { width: 1066, height: 860 },
  nemo: { width: 890, height: 691 },
  firefox: { width: 1066, height: 860 },
  text_editor: { width: 1410, height: 884 },
  terminal: { width: 1041, height: 626 },
  lecteur_multimedia: { width: 560, height: 552 },
};

export const parityGeometryForRegistry = (registryId) => {
  if (registryId === 'linux-kde-neon') {
    return KDE_NEON_PARITY_GEOMETRY;
  }
  return {};
};

export const expectedGeometry = (registryId, slotId) => {
  const map = parityGeometryForRegistry(registryId);
  return map[slotId] || null;
};
