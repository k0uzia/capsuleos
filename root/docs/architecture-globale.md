# Architecture globale CapsuleOS

Vue d’ensemble du dépôt pour agents et contributeurs. Complète [arborescence.md](arborescence.md) (navigation) et [manifeste-noyau.md](manifeste-noyau.md) (principes).

## Modèle mental

CapsuleOS est un **rootfs web statique** : pas de SPA imposée, pas de npm en production. Une **vérité machine-lisible** (`etc/capsuleos/`) projette des façades URL (`OS/`), des skins pédagogiques (`home/`) et des packs visuels (`usr/share/capsuleos/assets/`).

```
                    ┌─────────────────────────────────────┐
                    │  etc/capsuleos/ (vérité catalogue)   │
                    │  os-registry.json · skin.profile     │
                    │  profiles/*.json · contracts/*.json  │
                    └──────────────┬──────────────────────┘
                                   │ hydrate / valide
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   OS/<famille>/            home/<Vendor>/          usr/share/capsuleos/
   façades index.html       miroirs skins           apps, themes, assets/
         │                         │                         │
         └──────────── boot ───────┴── capsule-resource.js ─┘
                                   │
                    usr/lib/capsuleos/ (noyau JS)
                    common/ · shells/ · tools/
                                   │
                    var/lib/capsuleos/generated/ (embeds offline)
```

## Couches et responsabilités

| Couche | Chemin | Rôle |
|--------|--------|------|
| **Portail** | `index.html`, `js/`, `sw.js` | Entrée utilisateur, service worker |
| **Registre** | `etc/capsuleos/os-registry.json` | Catalogue OS (id, tier, status, façade, toolkit, vendor) |
| **Profils boot** | `etc/capsuleos/profiles/*.json`, `skin.profile.json` | `assetsBase`, `toolkitPack`, scripts shell, `CAPSULE_WINDOW_CONTEXT` |
| **Façades** | `OS/<famille>/.../index.html` | URLs stables ; **pas de README dev** sous `OS/` |
| **Skins** | `home/<Vendor>/` | Miroir pédagogique ; `home/public/` = FS simulé partagé |
| **Assets** | `usr/share/capsuleos/assets/` | Icônes, toolkits, vendors — voir [politique-assets.md](politique-assets.md) |
| **Noyau JS** | `usr/lib/capsuleos/common/`, `shells/` | Fenêtres, contentLoader, explorateurs, résolution chemins |
| **Apps / thèmes** | `usr/share/capsuleos/linux/apps/`, `themes/` | Gabarits HTML, `.base.css`, tokens CSS |
| **Généré** | `var/lib/capsuleos/generated/` | Embeds (`build-linux-embed.mjs`, etc.) — ne pas éditer à la main |
| **Outils** | `usr/lib/capsuleos/tools/` | Build, validate-all, seed skills |
| **Agents** | `root/` | Skills Cursor + docs (ce dossier) |

## Fichiers source de vérité

| Fichier | Contenu |
|---------|---------|
| [`etc/capsuleos/os-registry.json`](../../etc/capsuleos/os-registry.json) | Entrées catalogue, statut, façade, toolkit, vendor |
| [`usr/share/capsuleos/assets/manifest.json`](../../usr/share/capsuleos/assets/manifest.json) | Bases `CAPSULE_*`, alias chemins assets |
| `home/**/skin.profile.json` | Profil par skin (miroir registre + scripts boot) |
| [`etc/capsuleos/contracts/desktop-selectors.json`](../../etc/capsuleos/contracts/desktop-selectors.json) | IDs DOM contractuels (Nemo, chrome) |
| [`etc/capsuleos/contracts/css-variable-sources.json`](../../etc/capsuleos/contracts/css-variable-sources.json) | Chaîne de définition `var(--*)` |

## Flux boot Linux (résumé)

1. `index.html` façade : `capsule-resource.js` → `capsule-skin-boot.js` → scripts profil.
2. `CapsuleResource` résout `./assets/...` vers `usr/share/capsuleos/assets/`.
3. `contentLoader` injecte apps dans slots `data-link`.
4. `CapsuleWindow` + profil `CAPSULE_WINDOW_CONTEXT` (regen : `build-skin-profiles.mjs`).

Détail : [manifeste-noyau.md](manifeste-noyau.md) · [raccordement-noyau-os.md](raccordement-noyau-os.md) · [convention-contexte-fenetres.md](convention-contexte-fenetres.md).

## Scalabilité (distro / vendor / version)

- **Toolkit** partagé (`assets/images/toolkits/{cinnamon|kde|gnome|cosmic|…}`) — pas de fork `contentLoader`.
- **Vendor** = pack `assets/images/vendors/<id>/`.
- **Nouvelle version** = souvent nouvelle entrée registre, même toolkit.

Procédure : [ajouter-os-scalable.md](ajouter-os-scalable.md) · catalogue : [repertoire-os.md](repertoire-os.md).

## Qualité et gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

Enchaîne assets, liens, capsule (registre + façades), quality (JSON + ES6 strict + contrats UI). Détail : [contrib.md](../../contrib.md) · [passe-vanilla-json.md](passe-vanilla-json.md).

## Skills agents (routage)

| Besoin | Skill / doc |
|--------|-------------|
| Première intervention | [`onboarding`](../skills/onboarding/SKILL.md) (H0–H6 + routage famille OS) |
| Contrats bureau / fenêtres | [`ui-contracts`](../skills/ui-contracts/SKILL.md) |
| Famille OS | `os-linux`, `os-windows`, … |
| Vendor / distro / version | `capsuleos-vendor-*`, `capsuleos-distro-*`, `capsuleos-version-*` |
| Assets / noyau | `kernel-supervisor`, `kernel-guardian`, `asset-pipeline` |

Hiérarchie : [skills-hierarchie.md](skills-hierarchie.md) · staffing : [equipe-agentique.md](equipe-agentique.md).

## Liens utiles

- [parcours-agent.md](parcours-agent.md) — formation H0→H6
- [scalabilite-noyau.md](scalabilite-noyau.md) — stratégie scale statique
- [contrats-ui-bureau.md](contrats-ui-bureau.md) — gates UI bureau
- [contrib.md § toolkits](../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui) — bureaux Linux simulés
