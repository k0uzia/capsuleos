/**
 * Source de vérité desktop / libellé FR → csPanel (cinnamon-settings.js).
 * Consommé par generate-mint-menu-data.mjs, smoke-mint-menu-cs-routing.mjs, menu-cs-routing.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CS_JS = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/cinnamon-settings.js');

/** .desktop VM → id panneau cinnamon-settings */
export const DESKTOP_CS_PANEL = {
  'cinnamon-settings.desktop': 'general',
  'cinnamon-settings-general.desktop': 'general',
  'cinnamon-settings-themes.desktop': 'themes',
  'cinnamon-settings-backgrounds.desktop': 'backgrounds',
  'cinnamon-settings-effects.desktop': 'effects',
  'cinnamon-settings-extensions.desktop': 'extensions',
  'cinnamon-settings-applets.desktop': 'applets',
  'cinnamon-settings-desklets.desktop': 'desklets',
  'cinnamon-settings-windows.desktop': 'windows',
  'cinnamon-settings-workspaces.desktop': 'workspaces',
  'cinnamon-settings-hotcorner.desktop': 'hotcorner',
  'cinnamon-settings-gestures.desktop': 'gestures',
  'cinnamon-settings-panel.desktop': 'panel',
  'cinnamon-settings-desktop.desktop': 'desktop',
  'cinnamon-settings-screensaver.desktop': 'screensaver',
  'cinnamon-settings-fonts.desktop': 'fonts',
  'cinnamon-settings-keyboard.desktop': 'keyboard',
  'cinnamon-settings-mouse.desktop': 'mouse',
  'cinnamon-settings-universal-access.desktop': 'accessibility',
  'cinnamon-settings-sound.desktop': 'sound',
  'cinnamon-settings-notifications.desktop': 'notifications',
  'cinnamon-settings-privacy.desktop': 'privacy',
  'cinnamon-settings-power.desktop': 'power',
  'cinnamon-settings-startup.desktop': 'startup',
  'cinnamon-settings-default.desktop': 'default',
  'cinnamon-settings-calendar.desktop': 'calendar',
  'cinnamon-settings-user.desktop': 'user',
  'cinnamon-settings-users.desktop': 'users',
  'cinnamon-settings-actions.desktop': 'actions',
  'cinnamon-settings-nightlight.desktop': 'nightlight',
  'cinnamon-settings-thunderbolt.desktop': 'thunderbolt',
  'cinnamon-display-panel.desktop': 'display',
  'cinnamon-network-panel.desktop': 'network',
  'cinnamon-color-panel.desktop': 'color',
  'cinnamon-wacom-panel.desktop': 'wacom',
  'mintsysadm.desktop': 'system-info',
  'nm-connection-editor.desktop': 'network',
  'lightdm-settings.desktop': 'login-window',
  'mintlocale.desktop': 'languages',
  'mintlocale-im.desktop': 'input-method',
  'gnome-online-accounts-gtk.desktop': 'online-accounts',
  'org.gnome.font-viewer.desktop': 'fonts',
  'fingwit.desktop': 'fingerprints',
  'cinnamon-onscreen-keyboard.desktop': 'accessibility',
  'gufw.desktop': 'firewall',
  'blueman-manager.desktop': 'bluetooth',
  'blueman-adapters.desktop': 'bluetooth',
  'org.gnome.DiskUtility.desktop': 'disks',
  'system-config-printer.desktop': 'printers',
  'org.gnome.seahorse.Application.desktop': 'passwords',
  'mintsources.desktop': 'software-sources',
  'mintreport.desktop': 'system-info',
  'onboard.desktop': 'accessibility',
  'org.freedesktop.IBus.Setup.desktop': 'input-method',
};

/** Libellés menu FR (post-parité) → csPanel — secours si desktop inconnu */
export const LABEL_FR_CS_PANEL = {
  'Accessibilité': 'accessibility',
  'Actions': 'actions',
  'Administration du système': 'system-info',
  'Advanced Network Configuration': 'network',
  'Adaptateurs Bluetooth': 'bluetooth',
  'Affichage': 'display',
  'Applets': 'applets',
  'Applications lancées au démarrage': 'startup',
  'Applications par défaut': 'default',
  'Bureau': 'desktop',
  'Choix des polices': 'fonts',
  'Clavier': 'keyboard',
  'Clavier visuel': 'accessibility',
  'Comptes en ligne': 'online-accounts',
  'Préférences IBus': 'input-method',
  'Coins intelligents': 'hotcorner',
  'Couleur': 'color',
  'Date et heure': 'calendar',
  'Desklets': 'desklets',
  'Détails du compte': 'user',
  'Disks': 'disks',
  'Disques': 'disks',
  'Économiseur d\'écran': 'screensaver',
  'Économiseur d’écran': 'screensaver',
  'Effets': 'effects',
  'Empreintes digitales': 'fingerprints',
  'Espaces de travail': 'workspaces',
  'Extensions': 'extensions',
  'Fenêtre de connexion': 'login-window',
  'Fenêtres': 'windows',
  'Firewall Configuration': 'firewall',
  'Pare-feu': 'firewall',
  'Fonds d\'écran': 'backgrounds',
  'Fonds d’écran': 'backgrounds',
  'Fonts': 'fonts',
  'Polices': 'fonts',
  'Général': 'general',
  'Gestes': 'gestures',
  'Gestion de l\'alimentation': 'power',
  'Gestion de l’alimentation': 'power',
  'Gestionnaire Bluetooth': 'bluetooth',
  'Informations système': 'system-info',
  'Langues': 'languages',
  'Méthode de saisie': 'input-method',
  'Mode nuit': 'nightlight',
  'Mots de passe et clés': 'passwords',
  'Notifications': 'notifications',
  'Onboard': 'accessibility',
  'Panneau': 'panel',
  'Paramètres du système': 'general',
  'Passwords and Keys': 'passwords',
  'Imprimantes': 'printers',
  'Printers': 'printers',
  'Protection des renseignements personnels': 'privacy',
  'Renseignements sur le système': 'system-info',
  'Réseau': 'network',
  'Son': 'sound',
  'Sources de logiciels': 'software-sources',
  'Souris et pavé tactile': 'mouse',
  'Tablette graphique': 'wacom',
  'Thèmes': 'themes',
  'Thunderbolt': 'thunderbolt',
  'Utilisateurs et groupes': 'users',
};

let cachedPanelIds = null;

export const readCinnamonPanelIds = () => {
  if (cachedPanelIds) return cachedPanelIds;
  const src = fs.readFileSync(CS_JS, 'utf8');
  cachedPanelIds = [...src.matchAll(/\{\s*id:\s*'([^']+)'/g)].map((m) => m[1]);
  return cachedPanelIds;
};

export const csPanelFromDesktop = (desktopPath) => {
  if (!desktopPath) return null;
  const desktop = path.basename(desktopPath);
  return DESKTOP_CS_PANEL[desktop] || null;
};

export const csPanelFromLabel = (labelFr) => LABEL_FR_CS_PANEL[labelFr] || null;

export const resolveCsPanel = ({ desktopPath, name } = {}) => (
  csPanelFromDesktop(desktopPath) || csPanelFromLabel(name) || null
);

export const panelExists = (panelId) => readCinnamonPanelIds().includes(panelId);
