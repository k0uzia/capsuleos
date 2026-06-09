# Ground truth Cinnamon — Linux Mint

Dernière mise à jour : 2026-06-09

## TIER-C-THEMES — routage menu → csPanel

| Métrique | Valeur |
|----------|--------|
| Entrées menu `dataLink: themes` | 52 |
| Routage csPanel OK | 52 (100 %) |
| Panneaux cinnamon-settings | 49 |
| Smoke gate | `smoke-mint-menu-cs-routing.mjs` |

**Statut : clos** — 100 % des entrées menu themes routées vers un panneau enregistré.

## Nemo — menus contextuels (réalisme VM)

| Contexte | VM Nemo 6.6.3 fr | Capsule `:5501` | Smoke |
|----------|------------------|-----------------|-------|
| Fond liste | Créer dossier / document (+ sous-menu) | ✅ aligné | `nemo.list.background` |
| Sous-menu document | Document vide, Feuille de calcul, Présentation | ✅ gettext `_Empty Document` | `nemo.list.background.submenu` |
| Fichier | Ouvrir avec… (+ flyout apps) | ✅ | `nemo.list.file.submenu` |
| Compresser… | `nemo-extensions.mo` | ✅ ellipsis VM | `nemo.list.file` |

**Écarts résiduels P2** : icônes symboliques par entrée (Nemo GTK) ; raccourcis clavier menu — hors P1.

## P4 apps menu — batch #33

| App | Slot | Smoke |
|-----|------|-------|
| Analyseur d'espace disque | `baobab` | `smoke-mint-p4-batch33.mjs` |
| Pix | `visionneur_images` | idem |
| Moniteur système | `system_monitor` | idem |

## Chaîne validation

- **R-CIN-H2** — undefined : `undefined`
- **R-CIN-GAPS** — undefined : `undefined`
- **R-CIN-PARADIGM** — undefined : `undefined`
- **R-CIN-CTX** — undefined : `undefined`
- **R-CIN-CTX2** — undefined : `undefined`
- **R-CIN-CTX3** — undefined : `undefined`
- **R-CIN-CTX4** — undefined : `undefined`
- **R-CIN-CTX5** — undefined : `undefined`
- **R-CIN-CRED-LIVE** — undefined : `undefined`
- **R-CIN-DONE** — undefined : `undefined`



## Campagne clic droit Nemo (VM vs recette)

Dernière passe : **2026-06-09**

- Scénarios : `nemo-context-scenarios.json` (29)
- Écarts : **0 P0**, **12 P1**
- Rapport : [`nemo-context-campaign-report.md`](interactions/linux-mint/nemo-context-campaign-report.md)

Workflow :

```bash
node usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign.mjs
node usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign-vm.mjs
node usr/lib/capsuleos/tools/lab/compare-mint-nemo-context-campaign.mjs --write
```

