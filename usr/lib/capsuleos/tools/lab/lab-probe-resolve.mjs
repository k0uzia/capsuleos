/**
 * Résout le script sonde lab selon l'entrée inventaire.
 */
export const resolveProbeScript = (host) => {
  if (host.probe) {
    return host.probe.replace(/^~/, process.env.HOME || '');
  }
  const toolkit = host.toolkit || 'cinnamon';
  const base = host.probeDir || `${process.env.HOME ? '' : ''}`;
  void base;
  if (toolkit === 'gnome') {
    return '~/capsuleos-lab/os-probe-gnome.sh';
  }
  return '~/capsuleos-lab/os-probe.sh';
};

export const expandProbePath = (probePath) => {
  if (!probePath) return probePath;
  if (probePath.startsWith('~/')) {
    const home = process.env.HOME || '';
    return `${home}/${probePath.slice(2)}`;
  }
  return probePath;
};

/** Chemin distant tel que passé à ssh (garde ~ pour la VM). */
export const remoteProbeCmd = (host) => {
  if (host.probe) {
    return host.probe;
  }
  if ((host.toolkit || '') === 'gnome') {
    return '$HOME/capsuleos-lab/os-probe-gnome.sh';
  }
  return '$HOME/capsuleos-lab/os-probe.sh';
};
