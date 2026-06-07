# Convention — reproduction d’un OS dans CapsuleOS

**Contrat unique** pour agents IA et contributeurs humains qui clonent un bureau réel (VM) vers une simulation web.  
Complète sans la remplacer : [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) (détail opératoire), [manifeste-noyau.md](manifeste-noyau.md) (vision noyau), [logique-formelle.md](logique-formelle.md) (prédicats **I**, **A**, **S**, **M**, règles **R-INV**), [convention-shell-global.md](convention-shell-global.md) (socle terminal **Ti–TΣ**, agnosticité noyau), [convention-fidelite-visuelle.md](convention-fidelite-visuelle.md) (prédicats **Tp–Tf** : typographie, vues, MIME, accessibilité), [convention-rafraichissement-vues.md](convention-rafraichissement-vues.md) (prédicats **Rv₁–Rv** : cohérence vue ↔ modèle après action).

---

## 1. Portée du projet (rappel)

CapsuleOS est une **sandbox statique** : bureaux simulés en HTML5 / CSS3 / ES6, sans framework, exécutables en `file://` ou HTTP minimal. Objectif pédagogique : laisser explorer des environnements familiers sans installer de VM.

**Stade actuel** : consolider un **noyau robuste** (`usr/lib/capsuleos/`, `usr/share/capsuleos/`) et des **skins** (`home/`) alignés sur des **ground truth VM**, avec conventions **imposées** (pas d’improvisation par distro).

---

## 2. Concepts techniques (vocabulaire imposé)

| Concept | Emplacement | Rôle |
|---------|-------------|------|
| **Noyau** | `usr/lib/capsuleos/`, `usr/share/capsuleos/` | Comportements et gabarits **partagés** (fenêtres, explorateur, embed) |
| **Skin** | `home/<Vendor>/<Distro>/` | **Source de vérité** HTML/CSS/JS d’une distro |
| **Façade pick-os** | `OS/linux/families/.../index.html` | URL stable + `<base href>` → skin ; **générée**, ne pas éditer à la main |
| **Registre** | `etc/capsuleos/os-registry.json` | Catalogue OS (id, tier, façade, toolkit, vendor) |
| **Profil skin** | `home/.../skin.profile.json`, `etc/capsuleos/profiles/linux-*.json` | `CAPSULE_*`, assets, chrome context |
| **Vendor pack** | `usr/share/capsuleos/assets/images/vendors/<vendor>/` | Logos, panel, fonds **propres au vendor** (jamais empruntés) |
| **Toolkit** | `gnome`, `cinnamon`, `kde`, `cosmic` | Patron DE (shell, chrome fenêtre, slots apps) |
| **Slot** | `data-link="nemo"`, `firefox`, `terminal`… | Fenêtre applicative dans le DOM bureau |
| **Socle shell** | `usr/lib/capsuleos/shells/linux/terminal/` | Moteur CLI agnostique + pont `CapsuleUserFs` — [convention-shell-global.md](convention-shell-global.md) |
| **Gabarit explorateur** | `nemo`, `nemo-gnome`, `dolphin`… | HTML embarqué via `build-linux-embed.mjs` |
| **Chrome context** | `etc/capsuleos/contracts/window-chrome-contexts.json` | Provider drag/header par toolkit — [window-chrome-contexts.md](window-chrome-contexts.md) |
| **Embed** | `var/lib/capsuleos/generated/` | Projection offline ; régénérer après gabarit/skin partagé |

**Règle d’or** : centraliser dans le noyau tout ce qui est **identique entre distros du même toolkit** ; ne dupliquer dans le skin que le **token visuel** et la **structure chrome** propre au vendor.

---

## 3. Les trois couches (ne pas mélanger)

| Couche | Document | Quand |
|--------|----------|-------|
| **Catalogue** | [ajouter-os-scalable.md](ajouter-os-scalable.md) | Entrée registre, pick-os, profil minimal |
| **Clonage** | [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) | Parité VM → skin (inventaire d’abord) |
| **Contrôle** | [procedure-controle-distributions-reelles.md](procedure-controle-distributions-reelles.md) | Sonde JSON, `compare-os-parity.mjs` |
| **Réplication formelle** | [procedure-replication-formelle.md](procedure-replication-formelle.md) | Chaîne **V → G → Vc → Vp** (Paramètres GNOME, tous vendors) |

```text
VM (ground truth) → inventaire JSON/MD → skin home/ → sync façades → validate-all
```

---

## 4. Workflow agent (obligatoire)

Spécialisation de [logique-formelle.md §5](logique-formelle.md) — prédicats **H₂**, **M**, **I**, **A**, **S**, **H₆**.

| # | Action | Gate / script |
|---|--------|----------------|
| 0 | `validate-all.mjs` baseline | **H₂** — exit 0 |
| 1 | Brief : `print-agent-brief.mjs <registryId>` | — |
| 2 | VM : SSH + sonde (`lab-inventory.json`) | Rocky : [lab-vm-rhel-wayland.md](lab-vm-rhel-wayland.md) |
| 3 | Inventaire versionné `root/docs/inventaires/<id>-vm.json` | — |
| 3b | **Audit profond VM** : [procedure-audit-vm-profonde.md](procedure-audit-vm-profonde.md) → `<id>-deep-audit.json` | `collect-vm-deep-audit.mjs` |
| 3c | **Fidélité visuelle** : typo, contextes de vue, MIME, a11y → `<id>-visual-fidelity.json` | `collect-visual-fidelity-inventory.mjs` · **bloquant avant H5 typo/MIME/a11y** |
| 4 | Implémentation **sous `home/`** (+ noyau si sync vues) | **Rv** sur scénarios slot — [convention-rafraichissement-vues.md](convention-rafraichissement-vues.md) |
| 4b | Slot **terminal** : inventaire `*-terminal-vm.json` (**Ti**), puis **TΣ** | [convention-shell-global.md](convention-shell-global.md) · `validate-terminal-commands.mjs` · `smoke-fs-terminal-explorer-sync.mjs` |
| 5 | Assets VM → `pull-vm-assets.sh` | [convention-assets-depuis-vm.md](convention-assets-depuis-vm.md) |
| 6 | Clôture Linux : `sync-linux-skin-closure.mjs` | façades ≡ home |
| 7 | `validate-all.mjs` + captures comparatives | — |
| 7a | **Passe visuelle shell** : `run-visual-parity-pass.mjs` | **Vp** — skill `visual-parity-lab` |
| 7b | **Apps VM** : `collect-vm-apps-inventory` → `generate-apps-catalog` | **AppV**, **AppC** |
| 7c | **États UI & effets** : `run-ui-state-effects-pass.mjs` | **Va → VΣ** — apps détectées étendent la matrice auto |

**Interdit** : patch massif du skin sans inventaire ; édition manuelle de `OS/linux/families/...` ; icônes d’un autre vendor ; `px` en dur si un token `--*` existe.

---

## 5. CSS — contrat strict

| Règle | Détail |
|-------|--------|
| **Pas de nesting** | CSS plat (pas de `@nest`, pas de SCSS) |
| **Ordre des propriétés** | position → display → width → height → margin → padding → border → font → color → background → transform → animation → transition → overflow → z-index |
| **Variables** | Toute `var(--x)` doit être définie dans la chaîne d’import du skin |
| **Calcul** | Préférer `calc(var(--head) / n)` aux valeurs magiques |
| **Chaîne Linux** | `variables.css` → `variables-linux.css` → `variables-linux-computed.css` → `window-chrome.base.css` → skin |
| **Surcharge skin** | Tokens sous `body#<bodyId>` ou `html:has(#<bodyId>)` |
| **Typographie** | Une pile `--font-ui` / `--font-mono` par skin ; `var(--font-ui)` partout — voir [convention-fidelite-visuelle.md](convention-fidelite-visuelle.md) |
| **Accessibilité** | Hooks `html[data-font-scale]`, `data-contrast-mode`, etc. — effet visible obligatoire |
| **Spécificité** | Les IDs legacy (`#nemoHeaderContainer`, `#nemoMainContainer`) priment souvent sur les classes — surcharger par **sélecteur ID + classe gabarit** (ex. Nautilus N47) |

Gate : `validate-css-variables-contract.mjs`, `validate-css-selectors-contract.mjs`.

Skill : `css-variables-contract`, `role-web-designer`.

---

## 6. JavaScript — contrat strict

| Règle | Détail |
|-------|--------|
| **ES6 strict** | Modules IIFE `'use strict'` ; pas de framework |
| **API globales explicites** | `CapsuleWindow`, `CapsuleResource`, `window.CAPSULE_*` |
| **Pas de fork par distro** | Étendre le noyau ou le provider chrome, pas copier `fileExplorerCore.js` |
| **Rafraîchissement vues** | Toute mutation **M** (navigation, FS, onglets) synchronise **V** — **Rv₁** ; pas de re-render au seul focus — **Rv₂** |
| **Init slots** | `data-link` + `capsule-window-shell` ; drag selon chrome context |
| **Embeds** | Après modif gabarit `usr/share/capsuleos/linux/` → `build-linux-embed.mjs` |

Gate : `validate-vanilla-js.mjs`, `validate-vanilla-interactivity.mjs`, `validate-window-chrome-contexts.mjs`.

Skill : `vanilla-js-interactivity`, `role-developer`.

---

## 7. Classification des écarts VM ↔ Capsule

Chaque écart doit être tagué dans le rapport de parité :

| Tag | Signification |
|-----|----------------|
| **P0** | Bloquant fidélité pédagogique |
| **P1** | Documenté, assumé |
| **P2** | Souhaitable, non bloquant |
| **CapsuleOnly** | Exclusif sandbox (checklist, lien accueil) |

---

## 8. Rocky Linux — référence GNOME (juin 2026)

Rocky est la **base canonique** du toolkit GNOME (comme Mint pour Cinnamon). Les skins Fedora, Ubuntu et dérivés héritent de `home/RedHat/Rocky/` pour shell, overview et Nautilus.

**Nemo** = Cinnamon/Mint uniquement. **Nautilus** = GNOME (slot logique `data-link="nemo"` + template `nemo-gnome` + skin `nautilus.skin.css`). Propagation CSS : `node usr/lib/capsuleos/tools/linux/sync-gnome-nautilus-skin.mjs`.

| Élément | Valeur |
|---------|--------|
| `registryId` | `linux-rocky` |
| Tier / upstream | **P1**, `upstreamId: null` |
| Skin | `home/RedHat/Rocky/` |
| VM | `capsule@192.168.122.234` (Wayland + Xwayland) |
| Toolkit | GNOME 49 — Nautilus (`CAPSULE_EXPLORER_SKIN_KEY: nautilus`), Ptyxis → `terminal` |
| Dérivés | `linux-fedora` → `linux-rocky` ; `linux-alma` → `linux-rocky` |
| Script clôture Nautilus | `./root/tools/lab/update-rocky-nautilus.sh` |

Inventaire : [linux-rocky-vm.md](inventaires/linux-rocky-vm.md) · JSON : [linux-rocky-vm.json](inventaires/linux-rocky-vm.json) · Parité : [inventaire-parite-rocky.md](inventaire-parite-rocky.md).

**Documentation maître branche RHEL + GNOME** : [branche-redhat-gnome.md](branche-redhat-gnome.md) · **Procédure lab anti-échecs** : [procedure-lab-linux-rocky-gnome.md](procedure-lab-linux-rocky-gnome.md).

---

## 9. Skills à charger (clone OS)

1. `onboarding`
2. `os-clone-from-vm` (cette convention)
3. `os-linux` + `capsuleos-distro-<id>` + `capsuleos-vendor-<vendor>`
4. `visual-parity-lab` puis `ui-state-effects-replication` (fidélité visuelle complète)
5. `role-integrator` ; `asset-pipeline` si assets ; `css-variables-contract` si CSS

---

## 10. Références croisées

- [contrib.md](../../contrib.md) — formation H0–H6
- [politique-assets.md](politique-assets.md)
- [contrats-ui-bureau.md](contrats-ui-bureau.md)
- [convention-rafraichissement-vues.md](convention-rafraichissement-vues.md)
- [view-refresh-vigilance-playbook.json](inventaires/view-refresh-vigilance-playbook.json)
- [linux-gnome-capsule-slots.md](inventaires/linux-gnome-capsule-slots.md)
