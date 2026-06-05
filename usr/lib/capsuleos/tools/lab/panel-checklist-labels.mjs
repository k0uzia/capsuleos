/**
 * Libellés checklist panel — distinguer app VM (Nautilus) et slot Capsule (nemo).
 * @param {string} [toolkit] — cinnamon | gnome | …
 */
export const panelChecklistLabels = (toolkit = 'cinnamon') => {
  const gnome = toolkit === 'gnome';
  const files = gnome ? 'Fichiers (Nautilus · slot nemo)' : 'Nemo';
  const term = gnome ? 'Terminal (Ptyxis · slot terminal)' : 'Terminal';
  return {
    0: `${files} seul, focus`,
    1: '+ Firefox, focus Firefox',
    2: `+ ${term}, focus`,
    3: `Focus ${files} via lanceur`,
    4: `Minimize ${files}`,
    5: `Sidebar ${files} → Documents`,
  };
};

export const applyPanelLabels = (steps, toolkit) => {
  const labels = panelChecklistLabels(toolkit);
  return steps.map((s) => ({ ...s, label: labels[s.step] ?? s.label }));
};
