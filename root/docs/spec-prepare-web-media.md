# Spécification — normalisation des médias pour le web (`prepare-web-media`)

> **Statut** : spec v1 — à implémenter avant passe de migration PNG/JXL massive.  
> Complète [politique-assets.md](politique-assets.md) · [convention-assets-depuis-vm.md](convention-assets-depuis-vm.md) · Contrat : `etc/capsuleos/contracts/web-media-prepare.json`

**Principe** : tout binaire consommé par le navigateur (HTML/CSS/JS) doit passer par une **politique de sortie explicite** selon le *rôle* de l’asset — pas par une conversion WebP aveugle.

---

## 1. Contexte et problème

### 1.1 État actuel (juin 2026)

| Métrique | Valeur |
|----------|--------|
| PNG dans `usr/share/capsuleos/assets/` | ~3349 |
| SVG | ~880 |
| WebP | ~15 |
| JXL | ~2 |

Le pipeline actuel :

1. **Pull VM** (`pull-vm-assets.sh`) — copie brute (PNG, SVG, TTF, parfois JXL).
2. **Migration** (`migrate-to-assets.mjs`) — déplacement + hash MD5.
3. **Validation** (`validate-vendor-image-extensions.mjs`) — exige WebP **si** une variante existe déjà, mais **ne la produit pas**.

### 1.2 Symptômes observés

- Fonds Fedora F44 en **JXL** sur la VM → non affichables tels quels dans le navigateur.
- Captures lab lourdes (PNG 400–800 Ko) sans variante optimisée.
- Mélange PNG/WebP par vendor sans règle documentée.
- Confusion entre **problème de format** (JXL, TIFF) et **problème de rendu** (polices, glyphes Unicode `↑n`, `−`, `÷`) — ce dernier relève de [convention-fidelite-visuelle.md](convention-fidelite-visuelle.md), pas de la transcodage raster.

### 1.3 Objectif

Introduire **`prepare-web-media.mjs`** : outil offline qui transforme les entrées brutes en **sorties web-safe**, met à jour les références, et alimente les gates existants.

---

## 2. Périmètre

### 2.1 In scope

| Entrée | Sortie | Rôles |
|--------|--------|-------|
| JXL, JPEG, PNG, GIF, BMP, TIFF, ICO | WebP (lossy ou lossless selon profil) | wallpapers, icons-raster, inventory, photos |
| SVG | **inchangé** (optionnel : optimiseur SVGO hors v1) | icons-vector, symbolic, logos |
| TTF / OTF | WOFF2 (outil séparé v1.1) | fonts — voir §7 |
| Captures Playwright / virsh | PNG par défaut ; WebP optionnel | inventory |

### 2.2 Out of scope (v1)

- Transpilation vidéo (MP4, WebM).
- Conversion de polices variable → statique (sauf subset WOFF2 en v1.1).
- Génération automatique de sprites ou d’icônes « inventées ».
- Remplacement des glyphes texte par des images (calculatrice, UI) — rester sur Unicode + `--font-ui`.
- Hébergement CDN ou pipeline CI distant.

---

## 3. Prédicats et gates

| Symbole | Signification | Gate |
|---------|---------------|------|
| **Tw** | Asset raster consommable navigateur (WebP ou SVG ou PNG autorisé par profil) | `validate-web-media-prepare.mjs` |
| **Tr** | Références source alignées sur la sortie (pas de PNG stale si WebP existe) | `validate-vendor-image-extensions.mjs` |
| **Tm** | Manifest sidecar à jour pour les assets transformés | `validate-web-media-prepare.mjs` |
| **Tp** | Prêt pour consommation web | **Tw ∧ Tr ∧ Tm** |

```bash
node usr/lib/capsuleos/tools/prepare-web-media.mjs --vendor fedora --dry-run
node usr/lib/capsuleos/tools/validate-web-media-prepare.mjs
node usr/lib/capsuleos/tools/validate-vendor-image-extensions.mjs
node usr/lib/capsuleos/tools/validate-assets-all.mjs
```

---

## 4. Classification des assets

Chaque fichier entrant reçoit un **rôle** (détection par chemin + heuristiques) :

| Rôle | Chemin type | Exemple |
|------|-------------|---------|
| `wallpaper` | `vendors/*/wallpaper/` | `f44-01-day.jxl` |
| `icon-raster` | `vendors/*/panel/`, `toolkits/*/apps/*.png` | `firefox-48.png` |
| `icon-vector` | `icons/**/*.svg`, `**/*.svg` | `org.gnome.Nautilus.svg` |
| `inventory` | `vendors/*/inventory/**` | `fedora-dark-calculator.png` |
| `photo` | `home/public/Images/**` | photos pédagogiques |
| `branding` | `images/platforms/`, `images/common/` | `capsule.webp` |
| `font` | `fonts/vendors/**` | `RedHatText[wght].ttf` |
| `unknown` | reste | rapport + skip sauf `--force-role` |

Règle : **`icon-vector` et `font` ne sont jamais convertis en WebP** en v1.

---

## 5. Matrice de conversion (profils)

Profils définis dans `etc/capsuleos/contracts/web-media-prepare.json` :

| Profil | Entrées | Sortie | Qualité | Supprime source |
|--------|---------|--------|---------|---------------|
| `wallpaper` | jxl, png, jpeg, tiff | `.webp` | lossy q=85, effort=4 | oui après rewrite |
| `icon-raster` | png, ico, gif (1 frame) | `.webp` | lossless | oui si taille ≤ source |
| `inventory` | png | `.png` (défaut) | — | non |
| `inventory-optimize` | png | `.webp` | lossless | non (garde PNG) |
| `photo` | png, jpeg | `.webp` | lossy q=82 | oui après rewrite |
| `branding` | png, jpeg | `.webp` | lossy q=90 | oui après rewrite |

### 5.1 Cas JXL (priorité Fedora F44)

```
f44-01-day.jxl  →  f44-01-day.webp   (profil wallpaper)
f44-01-night.jxl → f44-01-night.webp
```

Prérequis outil : `djxl` (libjxl) **ou** backend `sharp` avec support JXL si compilé.  
Fallback documenté : conversion manuelle une fois, entrée sidecar `sourceFormat: jxl`.

### 5.2 Seuils de conservation PNG

Ne **pas** supprimer le PNG source si :

- sortie WebP > 105 % de la taille PNG (profil `icon-raster`) ;
- asset référencé dans un gate de **diff pixel-perfect** (`inventory` sans `--optimize`) ;
- `--keep-source` explicite.

### 5.3 SVG

- Pass-through : copie identique, entrée manifest `action: preserve`.
- v1.1 optionnel : `svgo` avec config conservative (pas de merge paths agressif).

---

## 6. Outil `prepare-web-media.mjs`

### 6.1 Emplacement

```
usr/lib/capsuleos/tools/prepare-web-media.mjs
usr/lib/capsuleos/tools/validate-web-media-prepare.mjs
```

### 6.2 Interface CLI

```bash
node usr/lib/capsuleos/tools/prepare-web-media.mjs [options]
```

| Option | Description |
|--------|-------------|
| `--vendor <id>` | Limite à `assets/images/vendors/<vendor>/` |
| `--dir <path>` | Répertoire racine (relatif au repo ou absolu) |
| `--profile <name>` | Un ou plusieurs profils (défaut : détection par rôle) |
| `--only <glob>` | Filtre fichiers (ex. `**/*.jxl`) |
| `--rewrite-refs` | Réécrire HTML/CSS/JS/JSON après conversion |
| `--keep-source` | Ne pas supprimer les sources |
| `--dry-run` | Rapport sans écriture |
| `--json <file>` | Rapport machine (défaut : stdout si `--verbose`) |
| `--force-role <role>` | Forcer le rôle pour `--only` |

### 6.3 Backends d’encodage (ordre de préférence)

1. **`sharp`** (npm devDependency optionnelle du repo lab) — PNG/JPEG/WebP/TIFF, JXL si build le permet.
2. **`cwebp`** (libwebp CLI) — fallback WebP.
3. **`djxl`** (libjxl CLI) — JXL → PNG intermédiaire, puis `cwebp` ou `sharp`.

Détection au démarrage : si aucun backend disponible → exit 2 avec message d’installation (`dnf install libwebp-tools libjxl`).

**Pas de dépendance npm obligatoire** pour consommer CapsuleOS dans le navigateur — seulement pour l’outil de build (aligné [manifeste-noyau.md](manifeste-noyau.md)).

### 6.4 Algorithme (résumé)

```
pour chaque fichier dans la zone cible :
  ignorer si déjà web-ready (webp + sidecar à jour)
  détecter rôle → profil
  si profil = preserve → skip
  encoder vers <basename>.webp (ou conserver png pour inventory)
  écrire sidecar .webp.json (§8)
  si --rewrite-refs : patcher les refs dans SCAN_ROOTS
  si politique delete : supprimer source
régénérer entrées manifest.json (packs touchés)
```

`SCAN_ROOTS` = mêmes racines que `validate-vendor-image-extensions.mjs` :

- `home/`, `OS/linux/families/`, `usr/lib/capsuleos/shells/`, `usr/share/capsuleos/themes/`, `usr/share/capsuleos/linux/apps/`

### 6.5 Idempotence

- Re-run sans changement source → **no-op** (compare hash source dans sidecar).
- Sidecar absent + WebP présent → considéré legacy ; `--repair-manifest` recrée les sidecars.

---

## 7. Polices (v1.1 — hors scope implémentation immédiate)

Les polices ne passent **pas** par WebP.

Pipeline prévu :

```
pull-vm-assets.sh  →  fonts/vendors/<vendor>/*.ttf
prepare-web-fonts.mjs  →  *.woff2 + @font-face dans skin
```

Documenté ici pour éviter la dérive « tout en WebP ». Bloquant pour **Tp** (typographie) mais distinct de **Tw**.

---

## 8. Sidecar manifest (`<file>.webp.json`)

À côté de chaque sortie produite :

```json
{
  "version": 1,
  "source": "images/vendors/fedora/wallpaper/f44-01-day.jxl",
  "sourceSha256": "…",
  "output": "images/vendors/fedora/wallpaper/f44-01-day.webp",
  "outputSha256": "…",
  "role": "wallpaper",
  "profile": "wallpaper",
  "encoder": "djxl+cwebp",
  "options": { "quality": 85, "lossless": false },
  "width": 3840,
  "height": 2160,
  "preparedAt": "2026-06-07T12:00:00Z",
  "vmSource": "file:///usr/share/backgrounds/f44/default/f44-01-day.jxl"
}
```

Agrégat optionnel : `usr/share/capsuleos/assets/web-media-index.json` (généré par l’outil, consommé par le gate).

---

## 9. Intégration pipeline

### 9.1 Ordre recommandé (clone VM)

```bash
bash root/tools/lab/pull-vm-assets.sh --id linux-fedora
node usr/lib/capsuleos/tools/prepare-web-media.mjs --vendor fedora --rewrite-refs
node usr/lib/capsuleos/tools/build-assets-manifest.mjs
node usr/lib/capsuleos/tools/validate-web-media-prepare.mjs
node usr/lib/capsuleos/tools/validate-vendor-image-extensions.mjs
node usr/lib/capsuleos/tools/validate-assets-all.mjs
```

### 9.2 Captures lab

Par défaut **ne pas** convertir les captures inventaire (diff visuel PNG).

```bash
bash root/tools/lab/vm-fedora-capture-host.sh
node root/tools/lab/capture-capsule-fedora.mjs
# Optionnel doc uniquement :
node usr/lib/capsuleos/tools/prepare-web-media.mjs \
  --dir usr/share/capsuleos/assets/images/vendors/fedora/inventory \
  --profile inventory-optimize --keep-source
```

### 9.3 Mise à jour `pull-vm-assets.sh` (phase 2)

Ajouter en fin de script (opt-in via `PREPARE_WEB_MEDIA=1`) :

```bash
if [[ "${PREPARE_WEB_MEDIA:-}" == 1 ]]; then
  node "$ROOT/usr/lib/capsuleos/tools/prepare-web-media.mjs" --vendor "$VENDOR" --rewrite-refs
fi
```

---

## 10. Réécriture des références

Quand `--rewrite-refs` :

| Avant | Après |
|-------|-------|
| `vendors/fedora/wallpaper/foo.png` | `vendors/fedora/wallpaper/foo.webp` |
| `url(.../foo.jpg)` | `url(.../foo.webp)` |

Fichiers touchés : mêmes extensions que `validate-vendor-image-extensions.mjs`.  
Mode `--dry-run` liste les patches sans écrire.

**Exception** : attributs HTML `type="image/png"` sur `<link rel="icon">` → mettre `image/webp` si MIME supporté, sinon conserver PNG favicon (gate dédié v1.1).

---

## 11. Validation `validate-web-media-prepare.mjs`

Échecs :

1. Raster consommable (hors profils `inventory` / PNG autorisé) sans WebP ni sidecar.
2. Sidecar `sourceSha256` ne correspond plus au fichier source (drift).
3. JXL présent dans `vendors/` sans WebP jumeau (règle `wallpaper`).
4. WebP orphelin (sidecar pointe vers source absente) — warning ou erreur selon `--strict`.

Succès :

```
✓ validate-web-media-prepare OK — N assets, M webp, 0 drift
```

Intégration : chaîne `validate-assets-all.mjs` (nouvelle étape après `validate-vendor-image-extensions`).

---

## 12. Plan d’implémentation par phases

### Phase 0 — Spec + contrat (cette livraison)

- [x] `root/docs/spec-prepare-web-media.md`
- [x] `etc/capsuleos/contracts/web-media-prepare.json`
- [x] Cross-refs dans `politique-assets.md`, skill `asset-pipeline`

### Phase 1 — MVP JXL + wallpapers Fedora

- [x] `prepare-web-media.mjs` : profils `wallpaper`, `dry-run`, sidecar
- [x] Conversion `f44-01-day/night.jxl` → WebP (backend `ffmpeg+convert`)
- [x] Rewrite refs `--fedora-bg` / `capsule-theme-storage.js`
- [x] Gate minimal JXL (`validate-web-media-prepare.mjs`)

### Phase 2 — Icons raster + vendors

- [x] Profil `icon-raster` (panel, dash)
- [x] `--rewrite-refs` branché sur `validate-vendor-image-extensions` (mêmes `SCAN_ROOTS` + chemins `vendors/<id>/`)
- [x] Passe `--vendor rocky` puis `fedora` (+ alma) — `firefox-48.png` → WebP lossless

### Phase 3 — Inventaire et opt-in captures

- [x] Profil `inventory-optimize` (doc uniquement — voir §9.2, ne pas lancer en masse sur `inventory/`)
- [x] Hook opt-in `PREPARE_WEB_MEDIA` dans `pull-vm-assets.sh` (lignes 196–200)
- [x] Fonds Rocky `wallpaper/*.png` → WebP (10 fichiers, refs `capsule-theme-storage` + skins)

### Phase 4 — Polices WOFF2

- [ ] `prepare-web-fonts.mjs` (spec dérivée ou §7 ici)

### Phase 5 — Migration globale PNG legacy

- [ ] Passe contrôlée par vendor (pas 3349 fichiers d’un coup)
- [ ] Métriques taille repo avant/après dans inventaire parité

---

## 13. Compatibilité navigateur

| Format | Support cible CapsuleOS |
|--------|-------------------------|
| WebP | Chrome, Firefox, Safari ≥ 14 — OK pour lab et pick-os |
| AVIF | Non v1 (évaluer v2 si gain > 20 % vs WebP) |
| JXL | **Interdit** en sortie consommable |
| SVG | Universel |

Fallback wallpaper : si WebP rejeté (contexte exotique), conserver une variante PNG **une fois** via `--keep-source` sur la première passe JXL.

---

## 14. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Perte qualité wallpapers | q=85 + comparaison visuelle VM/Capsule après passe |
| Icônes floues | `icon-raster` en **lossless** uniquement |
| Références cassées | `--rewrite-refs` + `validate-links-all.mjs` |
| Dette sidecar | `web-media-index.json` + gate drift |
| Confusion typo vs image | Doc croisée §1.2 → `convention-fidelite-visuelle.md` |

---

## 15. Références

- [politique-assets.md](politique-assets.md)
- [convention-assets-depuis-vm.md](convention-assets-depuis-vm.md)
- [convention-fidelite-visuelle.md](convention-fidelite-visuelle.md)
- [routage-donnees-medias.md](routage-donnees-medias.md)
- `usr/lib/capsuleos/tools/validate-vendor-image-extensions.mjs`
- `root/skills/asset-pipeline/SKILL.md`
