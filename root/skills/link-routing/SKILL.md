---
name: capsuleos-link-routing
description: Routage données et médias CapsuleOS — liens file:// et HTTP, CapsuleResource, HTML statique vs JS, validate-links-all, fix-static-html-asset-urls. Use when images/CSS/JSON/links are broken, asset paths, data-link embed, or media migration pass.
---

# Routage données & médias

## Quand invoquer

- Images / icônes / CSS cassés en `file://` ou HTTP
- `./assets/` ou `./media/` dans HTML, CSS, JS
- `data-link` sans gabarit embed
- Passe générale résilience liens
- Après migration assets (avec `kernel-supervisor` + `asset-pipeline`)

## Diagnostic (toujours en premier)

```bash
node usr/lib/capsuleos/tools/validate-links-all.mjs
```

Si échec `validate-static-html-assets` → passe HTML statique (ci-dessous).

## Règle centrale

| Où | Quel chemin |
|----|-------------|
| `<img src>`, `<link href>` favicon, icônes barre **dans HTML** | **Physique** `…/usr/share/capsuleos/assets/…` |
| JS après `capsule-resource.js` | **Logique** `./assets/…` + `resolveCapsuleResourceUrl()` |
| `index.html` portail | `./usr/share/capsuleos/assets/…` |
| Images pédagogiques user | `home/public/Images/` |

`CapsuleResource` ne s’applique **pas** aux attributs HTML déjà interprétés par le navigateur avant les scripts de fin de `<body>`.

## Séquence de correction

| Étape | Outil / action |
|-------|----------------|
| 1 | `audit-asset-paths.mjs` — legacy `media/img`, `branding/` |
| 2 | `fix-static-html-asset-urls.mjs` — `home/`, façades Linux |
| 3 | `rewrite-physical-asset-paths.mjs` — Windows, Android, iOS, macOS |
| 4 | `fix-theme-import-depths.mjs` + `rewrite-css-asset-urls.mjs` |
| 5 | `validate-links-all.mjs` → **exit 0** |
| 6 | Smoke Mint `file://` + HTTP ([smoke-integrite-liens.md](../../docs/smoke-integrite-liens.md)) |
| 7 | Regen embed si `data-link` / apps : `build-linux-embed.mjs` |

`--dry-run` sur les outils `fix-*` et `rewrite-*` avant application massive.

## Boot Linux (rappel)

`user-home.js` → manifest → profils → `capsule-resource.js` → `capsule-skin-boot.js` → shell.

Vérifier `skin.profile.json` : `assets.assetsBase`, `toolkitPack`, pas de `CAPSULE_MEDIA_BASE` dans profil.

## Délégation

| Sous-tâche | Skill |
|------------|--------|
| Zones images / packs | `kernel-supervisor`, `asset-pipeline` |
| JS fetch / contentLoader | `role-developer`, `kernel-guardian` |
| CSS profondeur | `role-web-designer` |
| Nouveau skin | `os-linux`, `role-integrator`, `onboarding` |

## Ne pas

- Créer `home/<skin>/assets/` (legacy)
- Supposer que `validate-link-integrity` vert = OK runtime `file://` (ignore `./assets/` si boot détecté en fin de body)
- `fetch` apps en `file://` sans embed regen

## Références

- [routage-donnees-medias.md](../../docs/routage-donnees-medias.md)
- [politique-assets.md](../../docs/politique-assets.md)
- [raccordement-noyau-os.md](../../docs/raccordement-noyau-os.md)
- [contrib.md](../../../contrib.md)
