# Scalabilité du noyau CapsuleOS

Stratégie pour émuler **des dizaines puis des centaines** de bureaux sans explosion de dette technique — en restant **100 % statique**.

**Prérequis** : [manifeste-noyau.md](manifeste-noyau.md) · [repertoire-os.md](repertoire-os.md)

---

## Objectif

Passer de ~22 OS actifs à un catalogue ouvert (50+ planifiés aujourd'hui, extensible) tout en conservant :

- zéro bundler obligatoire ;
- parité `file://` / HTTP ;
- un seul noyau JS par famille (`CapsuleWindow`, `contentLoader`, …) ;
- temps d'ajout d'un skin « dérivé » < 1 journée agent.

---

## Axes de scalabilité

### 1. Horizontal — plus de skins, même noyau

```
                    ┌─────────────────┐
                    │  CapsuleWindow  │
                    │  contentLoader  │
                    └────────┬────────┘
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   toolkit: kde        toolkit: gnome      toolkit: cinnamon
         │                   │                   │
    mx-kde, opensuse    ubuntu, fedora         mint
    debian-kde          anduinos, zorin*
```

**Levier** : `skin.profile.json` + tokens CSS — pas de fork JS.

### 2. Vertical — fidélité croissante

| Niveau | Description | Coût |
|--------|-------------|------|
| L1 | Shell navigable, icônes approximatives | 1–3 j |
| L2 | Apps par défaut reconnaissables | 1–2 sem |
| L3 | Parcours checklist complet | 2–4 sem |
| L4 | Fidélité pixel (animations, sons) | optionnel |

Prioriser **L2 pour P1**, **L3 pour P0**.

### 3. Assets — déduplication

| Problème actuel | Solution scalable |
|-----------------|-------------------|
| Icônes KDE dispersées | `assets/icons/kde/` + manifest |
| `./media/` par skin | `CAPSULE_MEDIA_BASE` héritage (Ubuntu → Mint) |
| CSS dupliqué entre KDE skins | `window-chrome.base.css` + `dolphin.base.css` |
| Embeds monolithiques | **Embeds partitionnés** (ci-dessous) |

### 4. Embeds partitionnés (roadmap)

Aujourd'hui : un `capsule-app-embed.js` (~tous templates × 8 skins).

**Cible** :

```
var/lib/capsuleos/generated/
├── capsule-app-embed-linux.js      # templates linux
├── capsule-app-embed-windows.js
├── capsule-android-embed.js        # existant
└── capsule-embed-index.json        # manifeste des chunks
```

Chaque `index.html` ne charge que son chunk → **taille SW cache maîtrisée**, build incrémental.

### 5. Hydratation lazy

| Composant | Aujourd'hui | Cible |
|-----------|-------------|-------|
| Slots apps | Tous au `DOMContentLoaded` | Slots visibles + au premier `openWindow` |
| Icônes | Toutes résolues à l'inject | `loading="lazy"` + prefetch au hover dock |
| CSS skin app | Injecté par slot | Cache `<style data-capsule-slot="nemo">` réutilisable |

Compatible statique — pas de SSR.

### 6. Registres machine-lisibles

| Fichier | Rôle | Consommateurs |
|---------|------|---------------|
| `etc/capsuleos/os-registry.json` | Catalogue OS | Portail, agents, CI |
| `usr/share/capsuleos/assets/manifest.json` | Packs assets | `CapsuleResource`, embed build |
| `home/public/.capsule-manifest.json` | FS simulé | Explorateurs |
| `skin.profile.json` (par skin) | Boot déclaratif | Générateur index, validateur |

**Principe** : une vérité → N projections (HTML boot, pick-os, docs).

### 7. Internationalisation — FR par défaut, US/QWERTY en prévision

La plateforme vise à terme une **couverture internationale** (en-US, clavier QWERTY, sorties terminal anglophones). **Aujourd'hui et par priorité logique** : tout reste **fr-FR par défaut** — documentation, strings UI, inventaires VM, pédagogie.

```text
Ordre non contradictoire :
  1. Lj_fr (défaut projet)     → docs, strings, UX cible actuelle
  2. Parité VM (R-INV1)        → locale de l'inventaire pour reproduction (ex. dnf FR sur Rocky)
  3. Lj_en / Lk_qwerty         → projection additive future, jamais prioritaire sur (1)
```

| Couche | Défaut actuel | Cible scalable | Noyau |
|--------|---------------|----------------|-------|
| **UI** | `strings-default.js` + `content/strings.json` (FR) | `strings.<locale>.json`, `CAPSULE_LOCALE` | fusion `CAPSULE_STRINGS_MERGED` |
| **Terminal** | sorties EN simulées (legacy package-managers) | providers `family × locale` | `terminal-package-managers.js` |
| **Clavier** | AZERTY implicite (hôte FR) | `CAPSULE_KEYBOARD_LAYOUT` : `fr-FR-azerty` \| `en-US-qwerty` | planned |
| **FS XDG** | noms FR si VM FR (Bureau, Documents) | mapping locale dans manifeste / inventaire | `CapsuleUserFs` |

**Contrat** : `etc/capsuleos/contracts/locale-scalability.json` · prédicats **Lj**, **Lj_fr**, **Lj_en**, **Lk_*** dans [logique-formelle.md](logique-formelle.md).

**Anti-pattern** : fork `executeCommand.js` ou skin entier par langue — une implémentation, des **providers** et des fichiers de strings.

**Jalon S8 (prévu)** : providers terminal FR/EN + premier skin `en-US` dérivé (même toolkit, `strings.en.json`).

---

## CI légère (sans infrastructure lourde)

Script cible : `usr/lib/capsuleos/tools/validate-capsule.mjs`

```
validate-capsule.mjs
├── registry     — chaque facade active existe sur disque
├── scripts      — ordre capsule-window → shims → shell
├── assets       — packs référencés existent (ou status planned)
├── embed        — clés embedKey présentes dans capsule-app-embed.js
├── profiles     — skin.profile.json valides vs schema
└── dead-refs    — pas de import site/window*.js

validate-quality-all.mjs  (passe vanilla + JSON)
├── validate-json.mjs       — syntaxe + structure os-registry, manifest, profils, strings
└── validate-vanilla-js.mjs — runtime sans modules ES / frameworks / eval

validate-all.mjs            — validate-assets-all + validate-capsule + validate-quality-all
```

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

Formation agents avant scale catalogue : [parcours-agent.md](parcours-agent.md) · [ajouter-os-scalable.md](ajouter-os-scalable.md).

Exécutable en pre-commit ou manuellement — **pas de npm install**.

---

## Limites assumées (ne pas optimiser prématurément)

| Limite | Seuil confortable | Au-delà |
|--------|-------------------|---------|
| Entrées registre | 200 | Pagination portail, recherche |
| Taille embed Linux | ~2 Mo gzip | Partition obligatoire |
| Skins KDE partageant Dolphin | 10 | OK avec tokens |
| Versions Windows historiques | 15 | Kernel unique suffit |

---

## Anti-patterns à éviter

1. **Un repo fork par distro** inside CapsuleOS.
2. **Assets système dans home/public/**.
3. **Embed manuel** (édition directe de `capsule-app-embed.js`).
4. **CAPSULE_* ad hoc** non documentés dans le registre.
5. **Agent sans skill OS** sur un skin multi-toolkit.

---

## Jalons scalabilité

| Jalon | Livrable | Impact |
|-------|----------|--------|
| S1 | `os-registry.json` + docs | Catalogue unique ✓ |
| S2 | `assets/` + manifest | Routage assets ✓ — zones validées (`validate-asset-zones` juin 2026) |
| S3 | `skin.profile.schema.json` | Boot déclaratif ✓ |
| S4 | `validate-all.mjs` | CI locale (assets + capsule + quality) ✓ |
| S5 | `CapsuleResource.resolve()` | Amorcé ✓ — packs via `iconPacks`, shims `capsule-resource-url.js` |
| S6 | Embeds partitionnés | SW + offline à grande échelle |
| S7 | pick-os.js généré depuis registre | Portail toujours sync ✓ |
| S8 | Locale scalable (Lj) — contrat + providers terminal | FR défaut ; en-US/QWERTY sans fork |

---

## Métriques de suivi

- **Ratio réutilisation toolkit** : nb skins / nb toolkits (objectif > 3).
- **Lignes JS uniques par skin** (objectif < 200 hors index boot).
- **Temps regen embed** (objectif < 5 s).
- **Couverture validate-capsule** (objectif 100 % entrées actives).

*Document vivant — réviser à chaque jalon S4+.*
