/**
 * Préfixe d'environnement X11 pour commandes SSH lab (Wayland / Xorg).
 * Voir root/docs/lab-vm-rhel-wayland.md et champs lab-inventory.json.
 */

/** Commande évaluée sur la VM (bash) — cookie Mutter/Xwayland (GNOME Wayland). */
export const MUTTER_XWAYLAND_AUTH_CMD =
  'ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1';

/**
 * @param {object} host — entrée lab-inventory.json
 * @returns {string} préfixe « DISPLAY=… XAUTHORITY=… » (sans export)
 */
/**
 * @param {object} host
 * @param {string} remoteCmd — commande distante (sonde, wmctrl, etc.)
 */
export const wrapRemoteCommand = (host, remoteCmd) => `${buildX11EnvPrefix(host)} ${remoteCmd}`;

/**
 * Script bash « export … » pour sessions interactives SSH.
 * @param {object} host
 */
export const buildX11EnvParts = (host) => {
  const display = host.display || ':0';
  const parts = [`DISPLAY=${display}`];

  if (host.xauthority) {
    parts.push(`XAUTHORITY=${host.xauthority}`);
  } else if (
    host.xauthorityDiscovery === 'mutter-xwayland'
    || host.sessionType === 'wayland-xwayland'
  ) {
    parts.push(`XAUTHORITY=$(${MUTTER_XWAYLAND_AUTH_CMD})`);
  } else if (host.sessionType === 'xorg') {
    parts.push('XAUTHORITY=${XAUTHORITY:-$HOME/.Xauthority}');
  }

  if (host.sessionType === 'wayland-xwayland' || host.sessionType === 'wayland') {
    parts.push('DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus');
    parts.push('XDG_RUNTIME_DIR=/run/user/$(id -u)');
  }

  return parts;
};

export const buildX11EnvPrefix = (host) => buildX11EnvParts(host).join(' ');

export const buildX11ExportScript = (host) => buildX11EnvParts(host).map((pair) => `export ${pair}`).join('; ');
