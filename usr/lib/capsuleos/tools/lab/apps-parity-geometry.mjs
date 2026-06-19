/**
 * Géométrie VM P0 partagée — capture capsule et compare pixel alignés.
 * KDE : expected width/height (fenêtre native).
 * GNOME : recadrage VM plein écran + capture Capsule fenêtre (.windowElement).
 */
export const KDE_NEON_PARITY_GEOMETRY = {
  themes: { width: 1060, height: 808 },
  update_manager: { width: 1066, height: 860 },
  nemo: { width: 890, height: 691 },
  firefox: { width: 1280, height: 754 },
  text_editor: { width: 1410, height: 884 },
  terminal: { width: 1041, height: 626 },
  lecteur_multimedia: { width: 560, height: 552 },
};

/** Recadrage VM 1280×800 → fenêtre active (capture virsh / Shell.Screenshot). */
export const GNOME_PARITY_GEOMETRY = {
  nemo: {
    capsuleMode: 'window',
    vmVendorRel: 'fedora-dark-nautilus.png',
    vmCrop: { x: 195, y: 120, width: 890, height: 563 },
    capsuleTrim: { bottom: 32 },
  },
  calculator: {
    capsuleMode: 'window',
    vmVendorRel: 'fedora-dark-calculator.png',
    vmCrop: { x: 300, y: 120, width: 640, height: 481 },
  },
};

const GNOME_REGISTRY_IDS = new Set([
  'linux-fedora',
  'linux-alma',
  'linux-rocky',
  'linux-ubuntu',
]);

export const parityGeometryForRegistry = (registryId) => {
  if (registryId === 'linux-kde-neon') {
    return KDE_NEON_PARITY_GEOMETRY;
  }
  if (GNOME_REGISTRY_IDS.has(registryId)) {
    return GNOME_PARITY_GEOMETRY;
  }
  return {};
};

export const expectedGeometry = (registryId, slotId) => {
  const spec = parityGeometryForRegistry(registryId)[slotId];
  if (!spec) {
    return null;
  }
  if (spec.width && spec.height) {
    return { width: spec.width, height: spec.height };
  }
  if (spec.vmCrop) {
    return { width: spec.vmCrop.width, height: spec.vmCrop.height };
  }
  return null;
};

export const paritySpecForSlot = (registryId, slotId) => {
  const spec = parityGeometryForRegistry(registryId)[slotId];
  return spec || null;
};

export const vmVendorCapturePath = (registryId, slotId) => {
  const spec = paritySpecForSlot(registryId, slotId);
  if (!spec?.vmVendorRel) {
    return null;
  }
  const vendor = registryId.replace('linux-', '');
  return `usr/share/capsuleos/assets/images/vendors/${vendor}/inventory/${vendor}-vm/${spec.vmVendorRel}`;
};
