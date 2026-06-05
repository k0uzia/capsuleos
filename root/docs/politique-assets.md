# Politique de cloisonnement des images CapsuleOS

## Zones autorisées (seules destinations pour images)

| Zone | Chemin | Contenu |
|------|--------|---------|
| **Noyau système** | `usr/share/capsuleos/assets/` | Icônes, chrome, toolkits, vendors, pick-os |
| **Home simulé** | `home/public/Images/` | Photos / fichiers « utilisateur » pédagogiques |

**Interdit** pour tout agent IA : créer ou déposer des images ailleurs (`home/*/media/`, `OS/*/media/`, `branding/`, etc.).

## Chemins logiques dans le code

Utiliser exclusivement des préfixes résolus par `CapsuleResource.resolve()` :

| Préfixe | Exemple | Résolu via |
|---------|---------|------------|
| `./assets/icons/kde/` | `./assets/icons/kde/elements/folder.svg` | `CAPSULE_ASSETS_BASE` |
| `./assets/icons/cinnamon/` | `./assets/icons/cinnamon/nemo/go-up.svg` | idem |
| `./assets/images/toolkits/{toolkit}/` | `./assets/images/toolkits/gnome/dock/firefox.png` | idem |
| `./assets/images/vendors/{vendor}/` | `./assets/images/vendors/mint/mint-logo.svg` | idem |
| `./assets/images/platforms/pick-os/` | `./assets/images/platforms/pick-os/linux/mint.png` | idem |

Ne plus utiliser `./assets/images/toolkits/cinnamon/` dans HTML/CSS/JS source (legacy supprimé après migration).

## Arborescence assets

```
assets/
├── icons/kde/, icons/cinnamon/
├── images/toolkits/{cinnamon,kde,gnome,cosmic,windows,macos-aqua,android-material,ios}/
├── images/vendors/{mint,ubuntu,fedora,mx,opensuse,debian,popos,anduin}/
├── images/platforms/pick-os/, platforms/brands/
└── images/common/
```

## Validation CI

```bash
node usr/lib/capsuleos/tools/validate-assets-all.mjs
```

Ou séparément : `validate-asset-zones.mjs`, `validate-skin-profiles.mjs`, `audit-asset-paths.mjs`, `validate-css-asset-urls.mjs`, `validate-link-integrity.mjs`.

Complément release : `validate-capsule.mjs`, `audit-data-links.mjs` (skins Linux).

Échoue si une image existe hors `assets/` ou `home/public/Images/`, ou si un lien portail/façade pointe vers un fichier absent.

## Migration / maintenance

```bash
node usr/lib/capsuleos/tools/migrate-to-assets.mjs      # copie canonique → assets/
node usr/lib/capsuleos/tools/rewrite-asset-paths.mjs  # réécrit chemins source
node usr/lib/capsuleos/tools/fix-portal-asset-paths.mjs # portail + hubs (././assets → usr/share/...)
node usr/lib/capsuleos/tools/prune-skin-media.mjs     # supprime doublons skin
node usr/lib/capsuleos/tools/prune-git-legacy-media.mjs # git rm index media/ mort
node usr/lib/capsuleos/tools/build-assets-manifest.mjs
node usr/lib/capsuleos/tools/build-pick-os.mjs
node usr/lib/capsuleos/tools/sync-linux-facade-boot.mjs   # boot resource sur façades Linux
node usr/lib/capsuleos/tools/rewrite-physical-asset-paths.mjs  # Windows / Android / iOS / macOS
node usr/lib/capsuleos/tools/validate-link-integrity.mjs
node usr/lib/capsuleos/tools/rewrite-css-asset-urls.mjs      # url(./assets/) → chemins physiques dans CSS
node usr/lib/capsuleos/tools/normalize-css-kernel-urls.mjs    # corrige la profondeur ../ vers noyau
node usr/lib/capsuleos/tools/fix-theme-import-depths.mjs      # @import themes/global|linux
```

## Assets depuis une VM réelle (obligatoire pour les clones lab)

Pour chaque distribution clonée depuis une VM (Mint, Rocky GNOME, …), **copier** les icônes et fonds nécessaires depuis la VM vers `usr/share/capsuleos/assets/` — ne pas réutiliser un pack d’un autre vendor.

Convention détaillée : [`convention-assets-depuis-vm.md`](convention-assets-depuis-vm.md) · script : `root/tools/lab/pull-vm-assets.sh`.

## Règle agent Cursor

Voir `.cursor/rules/capsuleos-assets.mdc`.
