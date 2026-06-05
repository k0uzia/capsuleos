---
name: capsuleos-kernel-supervisor
description: Supervise kernel consolidation for CapsuleOS — centralizes assets under usr/share/capsuleos/assets/, CapsuleResource routing, hydration phases H0–H6, and migration gates. Use when asset migration stalls, validate-asset-zones fails, consolidating CAPSULE_* bases, or coordinating multiple agents on noyau work.
---

# Superviseur noyau CapsuleOS

## Rôle

**Orchestrateur unique** pour la migration ressources → noyau et la santé du routage. Ne remplace pas `coordinator` (multi-familles produit) ni `role-manager` (roadmap release) : il **cadre et séquence** le travail technique noyau/assets avant que les skins avancent.

> Un skin P1 ne doit pas avancer tant que `validate-asset-zones.mjs` échoue sur sa famille.

## Quand invoquer

- Migration images / icônes incomplète ou échouée
- `node usr/lib/capsuleos/tools/validate-asset-zones.mjs` en échec
- Refactor `CapsuleResource`, `assets/manifest.json`, jalons S2–S6
- Plusieurs agents sur assets + JS noyau + embeds

## État de référence (à re-vérifier en début de tâche)

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
# ou détail : validate-assets-all.mjs, validate-capsule.mjs, validate-quality-all.mjs
```

Détail : `validate-asset-zones.mjs`, `validate-skin-profiles.mjs`, `audit-asset-paths.mjs`, `validate-css-asset-urls.mjs`, `validate-link-integrity.mjs`.

Qualité code : skill `code-quality`. **Gate release** : `validate-all.mjs`. Formation agents : skill `onboarding` + [parcours-agent.md](../../docs/parcours-agent.md).

Gate attendu : `validate-asset-zones.mjs` → **exit 0**. En cas d’échec, lister les chemins et planifier une vague (voir [roadmap.md § Phase 0.5](../../docs/roadmap.md)).

## Séquence obligatoire (une vague à la fois)

| Étape | Action | Skill délégué | Gate |
|-------|--------|---------------|------|
| 1 | Inventaire violations + familles touchées | ce skill | liste chemins |
| 2 | Copie canonique → `assets/` | `asset-pipeline` | pas de doublon pack |
| 3 | Réécriture `./assets/...` dans sources | `asset-pipeline` + `role-developer` | grep sans `OS/*/assets/` ni `home/*/assets/` |
| 4 | `build-assets-manifest.mjs` + `build-pick-os.mjs` | `asset-pipeline` | manifest à jour |
| 5 | `skin.profile.json` / boot ordre | `role-integrator` + `os-*` | `resource.js` avant `skin-boot.js` ; pas de `CAPSULE_*_BASE` dans `capsuleGlobals` |
| 6 | Regen embed + smoke Mint | `kernel-guardian` | `file://` + HTTP OK |
| 7 | `validate-all.mjs` (assets + capsule + quality) | ce skill | **exit 0** |
| 8 | Passe intégrité liens (22 actifs + hubs) | ce skill | `validate-link-integrity.mjs` ; `audit-data-links.mjs` pour Linux |
| 9 | CSS thèmes / assets `url()` | ce skill | `fix-theme-import-depths.mjs` ; `rewrite-css-asset-urls.mjs` ; `validate-css-asset-urls.mjs` |

**Ordre des familles recommandé** (dépendances croisées minimales) :

1. Linux skins Debian/RedHat/SUSE (`home/` + `OS/linux/families/`)
2. `usr/share/capsuleos/linux/media/` → `assets/images/toolkits/`
3. Android → `assets/images/toolkits/android-material/`
4. iOS → `assets/images/toolkits/ios/` ou `platforms/`
5. Windows / macOS (si violations)

## Matrice de délégation

| Sous-tâche | Skill |
|------------|-------|
| Déplacer / renommer packs FOSS | `asset-pipeline` + `role-graphic-artist` |
| `capsule-resource.js`, rewrite inject | `role-developer` + `kernel-guardian` |
| Façade + skin miroir | `role-integrator` + `os-linux` (etc.) |
| Priorisation / blocage release | `role-manager` |
| 2+ familles OS hors noyau | `coordinator` (remonter si conflit) |

## Parallélisation

| Autorisé | Interdit |
|----------|----------|
| Android et iOS en parallèle (familles distinctes) | 2 agents sur même skin Linux |
| Doc manifeste + migration pack KDE | embed regen concurrent |
| CSS skin pendant rewrite chemins **après** étape 3 du même pack | `contentLoader` + `CapsuleWindow` même PR sans `kernel-guardian` |

## Brief type à émettre aux agents fils

```markdown
## Superviseur : vague Linux Debian skins
- Gate : validate-asset-zones → 0 violation Linux+home listées
- Interdit : nouvelles images sous OS/ ou home/*/assets/
- Chemins logiques : ./assets/images/vendors/*, ./assets/icons/*
- Livrables : fichiers déplacés, sources réécrits, manifest regen, embed regen
- Réf : politique-assets.md, manifeste-noyau.md § Routage
```

## Escalade

| Situation | Action |
|-----------|--------|
| Régression Mint P0 | **Stop** — `kernel-guardian` seul corrige |
| Conflit « media skin vs assets noyau » | `role-manager` tranche ; défaut = noyau |
| > 2 familles + portail pick-os | `coordinator` après vague noyau courante |
| Violation licence asset | `role-graphic-artist` documente manifest |

## Ne pas

- Créer d’images sous `OS/*/assets/`, `home/*/media/img/`, `branding/`
- Clore une PR migration sans `validate-asset-zones` vert
- Fork `contentLoader` / `CapsuleWindow` par distro
- Lancer Phase 1 roadmap skins sans Phase 0.5 verte sur la famille concernée

## Références

- [roadmap.md § Phase 0.5](../../docs/roadmap.md)
- [manifeste-noyau.md](../../docs/manifeste-noyau.md) — hydratation H0–H6, registre
- [scalabilite-noyau.md](../../docs/scalabilite-noyau.md) — jalons S2–S6
- [politique-assets.md](../../docs/politique-assets.md)
- [equipe-agentique.md](../../docs/equipe-agentique.md)
- Skills : `asset-pipeline`, `kernel-guardian`, `coordinator`
