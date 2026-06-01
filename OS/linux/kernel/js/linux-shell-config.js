/**
 * Configuration du bureau Linux simulé (CapsuleOS).
 *
 * Définir ces propriétés sur `window` **avant** de charger les scripts du noyau
 * (`kernel/js/*.js`), typiquement dans un bloc `<script>` en tête du `index.html`
 * de chaque skin sous `OS/linux/families/.../<distro>/`.
 *
 * **Ordre de chargement recommandé** : bloc `window.CAPSULE_*` → `capsule-app-embed.js` (généré) →
 * `strings-default.js` → `capsule-strings.js` → les autres scripts noyau (`windowContainer.js`, `contentLoader.js`, …) →
 * scripts terminal (`terminal-core.js`, `terminal.js`, `executeCommand.js`, `filesystem.js`, `manuel.js`).
 *
 * @property {string} [CAPSULE_APPS_BASE]  Chemin relatif vers `OS/linux/shared/apps` (HTML + CSS `.base.css`).
 * @property {string} [CAPSULE_CONTENT_ROOT]  Racine du contenu pédagogique partagé (`Dossier_personnel`).
 * @property {string} [CAPSULE_SKIN_BASE]  Répertoire de la skin pour les surcouches `style/apps/*.skin.css` (souvent `.`).
 * @property {string} [CAPSULE_MEDIA_BASE]  Base des chemins `./media/…` (défaut `./media` ; ex. `../mint/media` pour une skin dérivée sans dossier `media/` local).
 * @property {string} [CAPSULE_ASSETS_BASE]  Base des chemins `./assets/…` (défaut `./assets` ; ex. `../mint/assets` pour une skin dérivée).
 * @property {string} [CAPSULE_FILE_MANAGER_TEMPLATE]  Gabarit HTML pour le slot `nemo` : `nemo`, `nautilus`, `nautilus-cosmic`, `dolphin`, …
 * @property {string} [CAPSULE_FILE_MANAGER_SKIN_KEY]  Clé du `.skin.css` (ex. `nemo`, `nautilus`, `dolphin`) sans changer le template.
 * @property {string} [CAPSULE_FILE_MANAGER_DISPLAY_NAME]  Titre fenêtre / libellé UI (`Nemo`, `Fichiers`, `Dolphin`, `Nautilus`).
 * @property {string} [CAPSULE_FILE_MANAGER_APP_ID]  Identifiant technique du slot (défaut `fileExplorer`, `data-link` / `id` du conteneur fenêtre).
 * @property {boolean} [CAPSULE_FILE_MANAGER_LIST_VIEW]  Force le mode liste (Anduinos, variantes Cosmic).
 * @property {string} [CAPSULE_EXPLORER_TEMPLATE]  **Déprécié** — alias de `CAPSULE_FILE_MANAGER_TEMPLATE` (voir `capsule-file-manager-config.js`).
 * @property {string} [CAPSULE_EXPLORER_SKIN_KEY]  **Déprécié** — alias de `CAPSULE_FILE_MANAGER_SKIN_KEY`.
 * @property {string} [CAPSULE_EXPLORER_DISPLAY_NAME]  **Déprécié** — alias de `CAPSULE_FILE_MANAGER_DISPLAY_NAME`.
 * @property {string} [CAPSULE_STRINGS_URL]  URL du JSON de surcharges (`fetch` même origine), défaut `./content/strings.json`.
 * @property {Object} [CAPSULE_STRINGS_INLINE]  Surcharges inline fusionnées avant le JSON (petits jeux de clés).
 * @property {string} [CAPSULE_EMBED_SKIN_KEY]  Clé de skin pour les CSS apps embarqués (`mint`, `ubuntu`, `fedora`) ; requis pour `file://` cohérent avec `capsule-app-embed.js`.
 * @property {boolean} [CAPSULE_FORCE_APP_EMBED]  Si `true`, utiliser les gabarits / manifeste embarqués même sous `http(s)://` (défaut : embed seulement en `file://`).
 * @property {string} [CAPSULE_SITE_HOME]  URL ou chemin relatif vers la page d’accueil du dépôt (`index.html`) pour l’iframe « os-lacapsule » du faux Firefox ; requis en `file://` (évite `file:///index.html` et les pages d’erreur internes du navigateur).
 * @property {string} [CAPSULE_LINUX_HUB]  Chemin relatif vers le hub Linux (`OS/linux/index.html`), ex. `../../../index.html` depuis une skin sous `families/.../` ; utilisé par le menu Démarrer (déconnexion / arrêt).
 * @property {string} [CAPSULE_TERMINAL_USER]  Nom utilisateur affiché dans le prompt du terminal commun.
 * @property {string} [CAPSULE_TERMINAL_HOST]  Nom machine affiché dans le prompt du terminal commun.
 * @property {string} [CAPSULE_TERMINAL_HOME]  Répertoire initial du terminal commun.
 * @property {string} [CAPSULE_TERMINAL_OS_FAMILY]  Famille OS terminal (`linux`, `windows`, `macos`), défaut `linux`.
 * @property {string} [CAPSULE_TERMINAL_PROFILE]  Profil terminal pour la distro (`debian`, `redhat`, `arch`).
 */
