---
name: capsuleos-onboarding
description: Formation agent CapsuleOS avant toute action — parcours H0–H6, validate-all, scalabilité distro/vendor/toolkit/version. Use when starting work on CapsuleOS, adding a new OS entry, uncertain routing, or before merge/release gates.
---

# Onboarding agent CapsuleOS

## Quand invoquer (prioritaire)

- **Première** intervention sur le dépôt ou après longue pause
- Ajout **distro**, **version**, **vendor**, **toolkit** ou **famille** OS
- Avant merge / release : vérifier que la baseline CI locale est comprise
- Utilisateur demande « comment scaler » ou « où commencer »

## Séquence obligatoire

| Étape | Action | Durée indicative |
|-------|--------|------------------|
| 0 | Lire [logique-formelle.md](../../docs/logique-formelle.md) §2–4 (prédicats, règles, décision) | 8 min |
| 1 | Lire [parcours-agent.md](../../docs/parcours-agent.md) § H0–H1 | 10 min |
| 2 | `node usr/lib/capsuleos/tools/validate-all.mjs` — noter échecs | 1 min |
| 3 | Si échec **assets** → `kernel-supervisor` ; **links** → `link-routing` ; **quality** → `code-quality` | — |
| 4 | Classifier la demande (matrice § « je veux… » dans parcours-agent) | 2 min |
| 5 | Charger **famille** (`os-linux`, …) + **vendor** + **distribution** (+ **version** / **langage** si besoin) + **rôle** | — |
| 6 | Si nouvel OS → [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md) **avant** d’éditer | 5 min |
| 7 | Implémenter (H5) puis `validate-all` (H6) | — |

## Brief par entrée registre

```bash
node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-elementary
node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-arch --write
node usr/lib/capsuleos/tools/print-agent-brief.mjs --list --tier P2 --status planned
```

Sortie optionnelle : `root/docs/briefs/<id>.md`.

## Gate release

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

Détail des sous-gates : assets (`validate-assets-all`), registre/façades (`validate-capsule`), ES6+JSON (`validate-quality-all`).

## Scalabilité — rappels

- **Toolkit** partagé > fork JS par distro
- **Vendor** = pack assets, pas nouveau `contentLoader`
- **Version** = souvent nouvelle entrée `os-registry`, même shell family
- Vérité : `os-registry.json`, `skin.profile.json`, `assets/manifest.json`

## Délégation

| Besoin | Skill suivant |
|--------|----------------|
| Routage OS incertain | `os-orchestrator` |
| Index skills vendor/distro/version | `_index` ou [skills-hierarchie.md](../../docs/skills-hierarchie.md) |
| Vendor Mint, Ubuntu, Microsoft… | `capsuleos-vendor-<vendor>` |
| Entrée registre (ex. linux-mint) | `capsuleos-distro-<id>` |
| Fichiers JS / CSS / JSON / HTML | `capsuleos-lang-javascript`, `capsuleos-lang-css`, … |
| Linux distro / KDE / Cinnamon | `os-linux` |
| Clone OS depuis VM | `os-clone-from-vm` |
| Migration images | `kernel-supervisor` |
| Intégration skin | `role-integrator` |
| ES6 / JSON | `code-quality` |
| Multi-familles release | `coordinator` |

## Ne pas

- Sauter H2 (`validate-all`) avant un gros patch
- Créer médias sous `OS/*/media/` ou `home/*/media/img/`
- Travailler sans skill OS sur un skin
- Dupliquer `writing.md` — lire le fichier workspace parent

## Références

- [logique-formelle.md](../../docs/logique-formelle.md) — paradigme agent (gates, **R-AUTO**)
- [convention-reproduction-os.md](../../docs/convention-reproduction-os.md) — clone VM, CSS/JS imposés
- [contrib.md](../../../contrib.md) — guide racine contributeurs + agents
- [parcours-agent.md](../../docs/parcours-agent.md)
- [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md)
- [AGENTS.md](../../AGENTS.md)
- [equipe-agentique.md](../../docs/equipe-agentique.md)
- [scalabilite-noyau.md](../../docs/scalabilite-noyau.md)
