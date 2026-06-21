---
name: capsuleos-vm-app-fidelity-pass
description: Campagne crédibilité pédagogique — scénarios utilisateur fidèles à la VM Mint Cinnamon, au-delà de Π structurel. Inventaire steps, captures VM/Capsule, smoke Playwright par scénario. Use when user wants pedagogical fidelity, menu/submenu parity, or v3-credibility-pass campaign.
---

# Passe fidélité applicative VM

## Quand invoquer

- Campagne **v3-credibility-pass** ou « crédibilité pédagogique »
- Utilisateur veut que le clone **se comporte** comme la VM (menus, sous-menus, états)
- **Π_global=100** atteint mais parcours utilisateur encore incomplets
- Extension **P-F v2** : cartographie gaps (`map-gaps`) puis tier B par slot (~32 gaps, pas 101 apps linéaires)

## Prérequis

1. Cycles C0–C10 clôturés pour le registryId cible (Mint : pallier 10).
2. `node usr/lib/capsuleos/tools/validate-all.mjs` — **H₂** baseline.
3. VM accessible : `linux-mint-replication-state.json` → `<lab-inventory:linux-lab>`.
4. Lire [campagne-credibilite-pedagogique.md](../../docs/campagne-credibilite-pedagogique.md).

## Séquence par application

```bash
# 0. Cartographie P-F1 (après clôture P0)
node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase map-gaps

# 1. État campagne
node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase status

# 2. Prochain scénario admissible
node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase next

# 3. Inventaire interaction VM (si steps manquants)
node usr/lib/capsuleos/tools/lab/collect-app-interaction-inventory.mjs --id linux-mint --app <slot>

# 4. Dry-run chaîne (collect, smoke, validate)
node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase run --app <slot> --dry-run

# 5. Smoke scénario (Playwright — façade OS)
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/smoke-app-fidelity-scenario.mjs --id linux-mint --scenario <scenario-id>

# 6. Parité classée (si CredS vert)
node usr/lib/capsuleos/tools/lab/run-app-parity-pass.mjs --id linux-mint --app <slot>

# 7. Clôture
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Boucle récursive (par app)

| Niveau | Exemples Mint Cinnamon |
|--------|------------------------|
| Shell | Ouverture slot panel, focus/minimize |
| Menus | Fichier→Nouveau, Édition→Copier, clic droit bureau |
| Sous-écrans | Onglets Update Manager, panneaux cs-* Themes |
| États | hover sidebar, focus recherche, liste vide, erreur réseau |

Documenter chaque niveau dans `root/docs/inventaires/<id>-app-fidelity-scenarios.json`.

## Capture VM vs Capsule

| Couche | Outil | Sortie |
|--------|-------|--------|
| VM ground truth | SSH lab + noVNC manuel | `vmCapture` dans inventaire |
| Capsule runtime | `smoke-app-fidelity-scenario.mjs` | `capsuleCapture` + selectors DOM |
| Classé | `run-app-parity-pass.mjs` | `pi_credibility` par scénario |

**Gabarit Nemo Mint** : modifier `usr/share/capsuleos/linux/apps/nemo.html` (embed) **et** `explorers/nemo/shell.html` (fetch), puis `node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs`.

**URL canonique** : `resolveCapsuleOsUrl(registryId)` — jamais `home/Debian/Mint/index.html` en Playwright.

## Gates

| Gate | Quand |
|------|-------|
| `validate-all.mjs` | Clôture chaque phase |
| `smoke-app-fidelity-scenario.mjs` | Après impl (**CredC**) |
| `run-app-parity-pass.mjs` | Avant **CredΠ** |
| `run-cross-regression-gates.mjs` | Touch noyau partagé (Nemo/menu ctx) |
| `sync-linux-skin-closure.mjs` | Avant push skin |

## Anti-patterns

| Interdit | Raison |
|--------|--------|
| Scénario sans observation VM | **R-INV1** |
| Implémenter sans steps documentés | Saut **CredV** |
| Asset emprunté autre vendor | **R-A1** |
| Smoke avant code slot | **CredC** manquant |
| Parcours fictif « proche » | Crédibilité = vérité VM |

## Pairing

`os-clone-from-vm` · `os-linux` · `distributions/linux-mint` · `role-integrator` · `ui-state-effects-replication` · `visual-parity-lab`

## Reprise

```bash
node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase next
```
