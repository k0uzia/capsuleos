---
name: capsuleos-asset-pipeline
description: Executes CapsuleOS asset migration into usr/share/capsuleos/assets/ — copy, path rewrite, manifest and pick-os rebuild. Use under kernel-supervisor when moving icons, toolkit images, or fixing legacy OS/ and home/ asset paths.
---

# Pipeline assets CapsuleOS

## Objectif

Déplacer les binaires vers la zone noyau, réécrire les références en **préfixes logiques** `./assets/...`, tenir `manifest.json` à jour.

**Toujours** travailler sous mandat de `kernel-supervisor` si la migration est multi-skins ou si `validate-asset-zones` échoue.

## Zones autorisées

| Zone | Chemin |
|------|--------|
| Noyau | `usr/share/capsuleos/assets/` |
| Home pédagogique | `home/public/Images/` |

Voir [politique-assets.md](../../docs/politique-assets.md) et `.cursor/rules/capsuleos-assets.mdc`.

**Clones depuis VM** : ne jamais emprunter les icônes d’un autre vendor — source ground truth via manifeste (`import-manifest-staging.mjs`) puis compléments lab ([convention-manifest-vm.md](../../docs/convention-manifest-vm.md), `pull-vm-assets.sh`).

**Catalogue vendor** : `etc/capsuleos/contracts/vm-manifest-media-catalog.json` — toolkits (`gnome`, `cinnamon`, `kde`) + overrides vendor (`extends`). Résolution : `vm-manifest-media-catalog-lib.mjs`.

## Préfixes logiques (sources HTML/CSS/JS)

| Préfixe | Destination physique |
|---------|----------------------|
| `./assets/icons/kde/` | `assets/icons/kde/` |
| `./assets/icons/cinnamon/` | `assets/icons/cinnamon/` |
| `./assets/images/toolkits/{toolkit}/` | `assets/images/toolkits/...` |
| `./assets/images/vendors/{vendor}/` | `assets/images/vendors/...` |
| `./assets/images/platforms/pick-os/` | portail, hub |

Résolution runtime : `CapsuleResource.resolve()` — pas de chemins absolus hôte.

## Normalisation web (raster)

**Pipeline recommandé (prérequis passe VΣ / parité)** :

```bash
# Prérequis ManΣ ou lot staging déjà importé
node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id linux-<vendor> --auto --write

node usr/lib/capsuleos/tools/lab/run-vendor-assets-pipeline.mjs --id linux-<vendor>
```

Enchaîne : manifeste/staging → pull VM compléments (thème `iconPack` du catalogue, symboles, emblèmes, fonds) → WebP + miniatures → `inventory-optimize` → gates.

Après `pull-vm-assets.sh` seul (opt-in WebP) :

```bash
PREPARE_WEB_MEDIA=1 bash root/tools/lab/pull-vm-assets.sh --id linux-<vendor>

# Ou manuellement (cibler un répertoire pour éviter inventory/) :
node usr/lib/capsuleos/tools/prepare-web-media.mjs --vendor <vendor> --rewrite-refs --wallpaper-thumbnails
node usr/lib/capsuleos/tools/prepare-web-media.mjs --vendor <vendor> --profile icon-raster --only panel --rewrite-refs
node usr/lib/capsuleos/tools/validate-web-media-prepare.mjs
```

Captures lab (`inventory/`) : PNG conservé par défaut. Variante WebP optionnelle **sans** supprimer le PNG :

```bash
node usr/lib/capsuleos/tools/prepare-web-media.mjs \
  --dir usr/share/capsuleos/assets/images/vendors/<vendor>/inventory \
  --profile inventory-optimize --keep-source
```

Spec : [spec-prepare-web-media.md](../../docs/spec-prepare-web-media.md).

## Scripts (ordre type)

```bash
node usr/lib/capsuleos/tools/migrate-to-assets.mjs
node usr/lib/capsuleos/tools/rewrite-asset-paths.mjs
node usr/lib/capsuleos/tools/prune-skin-media.mjs
node usr/lib/capsuleos/tools/build-assets-manifest.mjs
node usr/lib/capsuleos/tools/build-pick-os.mjs
node usr/lib/capsuleos/tools/validate-asset-zones.mjs
node usr/lib/capsuleos/tools/validate-assets-all.mjs
node usr/lib/capsuleos/tools/seed-skin-profiles.mjs
node usr/lib/capsuleos/tools/build-skin-profiles.mjs
node usr/lib/capsuleos/tools/sync-capsule-resource.mjs
```

Après modification de gabarits Linux :

```bash
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```

## Mapping migration (juin 2026 — Linux)

| Source legacy | Cible suggérée |
|---------------|----------------|
| `OS/linux/families/.../assets/*.webp` | `assets/images/vendors/{mint,mx,...}/` |
| `home/Debian/*/assets/` | même pack vendor (miroir) |
| `./assets/images/toolkits/gnome/apps/` | `assets/images/toolkits/` ou `common/` |
| `OS/android/./assets/images/toolkits/android-material/icones/` | `assets/images/toolkits/android-material/` |
| `OS/ios/15/assets/` | `assets/images/toolkits/ios/` ou `platforms/` |

Supprimer les fichiers source **après** rewrite + test visuel HTTP.

## `manifest.json`

Chaque pack déplacé :

- entrée `packs.{id}.path`
- `logicalPrefixes` si nouveau préfixe
- licence / `sources[]` si FOSS tiers

## Checklist avant PR

- [ ] Aucune nouvelle image hors zones autorisées
- [ ] `validate-asset-zones.mjs` → exit 0
- [ ] Pas de `./media/` système restant pour icônes chrome (sauf contenu skin documenté)
- [ ] `pick-os.js` regen si icônes portail touchées
- [ ] Licences documentées pour packs ajoutés

## Rôle complémentaire

- `role-graphic-artist` : qualité visuelle, SVG, nomenclature packs
- `role-developer` : `capsule-resource-url.js`, embed, rewrite dans JS injecté
- `role-integrator` : `skin.profile.json`, suppression dossiers `assets/` skin

## Références

- [spec-prepare-web-media.md](../../docs/spec-prepare-web-media.md)
- [usr/share/capsuleos/assets/manifest.json](../../../usr/share/capsuleos/assets/manifest.json)
- [usr/share/capsuleos/assets/README.md](../../../usr/share/capsuleos/assets/README.md)
