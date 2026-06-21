# Plan maître — reproduction OS, noyau agnostique et orchestration

> **Statut** : document de travail partagé (juin 2026) — **validé** (architecture + fondements)  
> **Références** : [fondements-philosophiques.md](fondements-philosophiques.md) · [logique-formelle.md](logique-formelle.md) · [convention-manifest-vm.md](convention-manifest-vm.md) · [plan-phase-1-gnome-triplet.md](plan-phase-1-gnome-triplet.md) · [avancement-formel-2026-06-08.md](inventaires/avancement-formel-2026-06-08.md)  
> **Principe directeur** : *enrichir l’existant, ne pas empiler des modules parallèles*  
> **Décision agent** : `resolve-agent-action.mjs --scope pipeline` — pas d’intuition hors gates

---

## 1 bis. Architecture et cloisonnement (vision validée)

> Fondement philosophique : [fondements-philosophiques.md](fondements-philosophiques.md) §7  
> **Phrase-synthèse** : *Noyau `core` agnostique → adaptateur `kernelId` → comportements `toolkit` → skin scellé `vendor` → vérité machine `proc/` → façade `OS/` en projection.*

### Cinq zones (ne pas mélanger)

| Zone | Chemin | Rôle | Qui écrit |
|------|--------|------|-----------|
| **Z0** | `etc/` + `proc/` | Contrats, registre, manifestes VM | Pipeline lab uniquement |
| **Z1** | `usr/lib/` + `usr/share/` | Noyau + assets système | Intégrateur kernel |
| **Z2** | `home/<Vendor>/` | Skin éditable (source vérité UI) | Clone VM → H5 |
| **Z3** | `OS/.../index.html` | URL pick-os, `<base href>` | `sync-linux-skin-closure` |
| **Z4** | `var/.../generated/` | Embeds offline | Build opt-in |

**Flux épistémique** : Z0 → Z1/Z2 → Z3 → expérience navigateur. **Jamais** Z2 → Z0 (le skin ne devine pas la VM).

### Cloisonnement : toolkit-first, vendor-sealed, proc-backed

```text
toolkit (gnome | kde | cinnamon | cosmic)
  └── hérite : noyau usr/ + gabarits + chrome contexts + matrices VΣ de base
vendor (ubuntu | rocky | fedora | mint | …)
  └── scelle : tokens CSS, layout chrome, pack assets vendors/, profil CAPSULE_*
registryId (linux-ubuntu, …)
  └── leaf : proc/<id>/ + home/ + façade OS/
```

| Relation | Autorisé | Interdit |
|----------|----------|----------|
| Vendor → toolkit noyau | ✓ | — |
| Vendor → assets / chemins autre vendor | — | ✓ (gate isolation) |
| Skin → icônes sans `proc/` / playbook | — | ✓ |
| `upstreamId` registre → héritage technique auto | — | ✓ (doc seulement) |
| Noyau `core/` → mention vendor | — | ✓ |

### Vendor : allowlist + denylist

- **Allowlist** : `skin.profile.json`, `etc/capsuleos/profiles/*.json`, variables `CAPSULE_*`
- **Denylist** : `skin-vendor-isolation.json` (garde-fou CSS)

### Deux mondes assets (ontologie)

| Monde | Chemin | Visible par l’utilisateur simulé ? |
|-------|--------|-----------------------------------|
| Système UI | `usr/share/capsuleos/assets/` | Non (ressources internes) |
| Utilisateur | `home/public/` | Oui (explorateur, parcours) |

### Par famille kernel (Windows, macOS, mobile)

Même **forme** Z0–Z4 ; **autre** collecte Z0 (inventaires + docs officielles, pas SSH VM). Pas de branchement sur ManΣ GNOME.

### Ce que ce modèle refuse

- Noyau par distro · bundle npm par OS · vérité VM dans `home/` · micro-frontends par iframe · orchestrateur par vendor

---

## 0. Synthèse exécutive

CapsuleOS possède les **prédicats formels** (ManΣ, AppΣ, VΣ, PbΣ, H₆) et trois VM GNOME opérationnelles. **Phase 0 clôturée** (chemins, `apply-manifest-refs`, pipeline `run-capsule-pipeline`). **Phase 1 vagues 1a–1d livrées** (détail : [plan-phase-1-gnome-triplet.md](plan-phase-1-gnome-triplet.md)).

Faiblesses **restantes** (juin 2026) :

1. **Triplet V1 pas stable** — Ubuntu : couche **PbΣ** (matrice Paramètres locale manquante) ; Rocky/Fedora : **ManA → ManΣ** en parallèle sans toucher skin H₆ ;
2. **Fallback cross-vendor** encore possible dans certains outils (ex. matrice Rocky sur Ubuntu) — corrigé par **P11** / **R-LOC1** ;
3. **Mint (V3)** : collecte VM excellente, clôture design/effets incomplète ; dette « 1 app = N fichiers » à refactorer vers toolkit + données ;
4. **Recette clone** à unifier : **collecte Mint** (SSH, JSON) + **clôture Rocky** (gates visuels, PNG, polish) — pas deux philosophies concurrentes ;
5. **Documentation** : inventaires MD parfois parallèles au JSON — cible : rapports **générés**.

Ce plan aligne **toutes** les familles OS sur deux références complémentaires : **linux-rocky** (design, effets, PbΣ, H₆) et **linux-mint** (collecte VM, doc par composant), industrialisées par ManΣ et le pipeline unique.

---

## 1. Retour critique sur tes propositions

| Idée | Verdict | Précision |
|------|---------|-----------|
| Orchestrateur agnostique unique | **Oui, indispensable** | Ne pas créer un 7ᵉ orchestrateur : **unifier** `run-agent-auto` + résolveur de prédicats |
| Difficulté effets / interactions UI | **Oui, réelle** | VΣ exige séquence **VM burst → Capsule Playwright** ; pas parallélisable sans `lab-capture-session` |
| Recette clone fragile | **Oui** | Corriger l’ordre ManΣ et les chemins avant d’étendre |
| Systèmes logiques typés | **Oui, avec modération** | 3 types suffisent (§3) — éviter une 4ᵉ couche « meta-meta » |
| Optimiser chargement scripts | **Oui côté runtime** ; **non** côté lab CLI | Le goulot est `capsule-app-embed.js` synchrone, pas les scripts Node lab |
| ES2018–2019 / async | **Partiel** | `async/await` en outils Node : oui ; noyau navigateur : **`import()` lazy** par slot, pas rewrite massif |
| schema.org partout | **Non sur chaque fenêtre interne** | Oui sur **`/mnt`** (scénarios) et **`/OS`** (catalogue façades) — JSON-LD |
| CSS variables vs localStorage | **Oui pour l’état visuel** ; **non pour la persistance session** | Thème/accent → variables ; onglets/explorateur → localStorage légitime |
| Fondu noir à l’ouverture OS | **Oui, excellent rapport coût/UX** | Un voile `#capsule-boot-veil` dans le boot noyau — pas un nouveau package |

---

## 2. Modèle de maturité (qui sert de référence)

### 2.1 Références « or » (à copier, pas à réinventer)

| Registry | Rôle | Atouts à répliquer |
|----------|------|-------------------|
| **linux-rocky** | GNOME **référence design / effets** | H₆ Paramètres, shell polish, comparaison PNG VM↔Capsule, Tf, propagation `sync-gnome-*` |
| **linux-ubuntu** | GNOME **référence ManΣ** | Manifeste v2, AppΣ, Tf, drift 0, `apply-manifest-refs` icon-pack |
| **linux-fedora** | GNOME dérivé PbΣ | Playbook settings, VM lab — ManΣ en cours |
| **linux-mint** | Cinnamon **référence collecte** | `collect-mint-inventory`, docs par app (Nemo, Firefox…), tray — **pas** le modèle de volume de code cible |

### 2.2 Grille de maturité par registre (cible plan)

Chaque `registryId` doit atteindre progressivement :

```
M → ManΣ → AppΣ → Vp → VΣ → Tf → H₆
```

| Vague | Registries | Toolkit | VM lab | Priorité |
|-------|------------|---------|--------|----------|
| **V0** | Fondation code | — | — | P0 bloquant |
| **V1** | ubuntu, rocky, fedora | gnome | ✓ les 3 | P0 |
| **V2** | alma, anduinos, popos | gnome/cosmic | partiel | P1 |
| **V3** | linux-mint | cinnamon | à brancher | P1 |
| **V4** | kde-neon, debian-kde, mx-kde, opensuse | kde/plasma | à brancher | P1 |
| **V5** | windows-10, windows-11 | — | N/A | P0 actifs |
| **V6** | windows-95…vista, 7, 8, 8.1 | — | N/A | P2 |
| **V7** | macos-sonoma (+ monterey…) | — | N/A | P1 |
| **V8** | android-lineage, ios-15 | material/ios | N/A | P2 |

**Règle** : une vague ne démarre pas si la vague précédente sur le **même toolkit** n’a pas livré le **contrat de chemins** (§4).

---

## 3. Trois types de logique (pas plus)

Éviter la prolifération de frameworks. Le projet tient avec :

### Type A — Logique propositionnelle (gates)

- **Où** : `logique-formelle.md`, `formal-rules-lib.mjs`, contrats `*.json`
- **Forme** : prédicats booléens, règles `R-*`, première admissible prime
- **Usage** : décision agent, CI, smoke

### Type B — Logique de pipeline (DAG ordonné)

- **Où** : un seul **graphe d’étapes** par domaine (manifeste, apps, settings, VΣ)
- **Forme** : étapes avec `requires[]`, `negates[]`, `manualGate`, `artifactOut`
- **Usage** : ordre strict collecte → analyse → traitement → import → intégration

### Type C — Logique de contrat (données)

- **Où** : JSON Schema (`os-registry`, `vm-distribution-manifest`, `apps-catalog`)
- **Forme** : champs requis, `capsuleTarget` normalisé, versioning
- **Usage** : une seule source de vérité machine (`proc/<id>/`)

**Interdit** : un 4ᵉ moteur de règles par vendor.

---

## 4. Source de vérité unique — contrat de chemins

### 4.1 Normalisation `capsuleTarget` (correctif V0)

Pour **toute** icône / média :

```
{zone}/{vendor|toolkit}/{category}/{id}.{ext}
```

| Catégorie | Exemple Ubuntu |
|-----------|----------------|
| app overview | `images/toolkits/gnome/apps/overview/firefox.webp` |
| app dash | `images/toolkits/gnome/apps/dash/org.gnome.Nautilus.svg` |
| mime | `icons/gnome/yaru/mimetypes/text-x-generic.png` |
| wallpaper | `images/vendors/ubuntu/wallpaper/adwaita-d.jxl` |

**Actions V0** (code, pas nouveau module) :

1. Corriger `vm-distribution-manifest.py` → `capsuleTarget` **avec extension**
2. Corriger `manifest-playbook-lib.mjs` → résolution `capsuleAbs` avec ext
3. Réécrire `generate-overview-apps-grid.mjs` → lire `manifest.media.appIcons` ou playbook, **zéro** map hardcodée
4. Implémenter **`apply-manifest-refs.mjs`** (unique) : exécute `rewrite-ref` du playbook sur `home/` + sync façade
5. Déprécier `pull-vm-assets.sh` **après** ManΣ sur un registry (garder en fallback documenté)

### 4.2 Ordre pipeline obligatoire (recette clone résiliente)

```
ensure-vendor-catalog
  → collect-manifest (SSH)
  → smoke-manifest
  → generate-playbook
  → [APPROBATION HUMAINE]
  → staging-vm
  → import-staging
  → apply-manifest-refs      ← NOUVEAU (remplace intégration manuelle)
  → derive AppV + AppC
  → generate-overview-grid   ← APRÈS import uniquement
  → sync-linux-skin-closure
  → validate-all (H₂)
```

**Règle** : aucun patch `home/` référençant un asset non présent sur disque.

### 4.3 Vérité locale — **P11** / **R-LOC1** (juin 2026)

Tout artefact ground truth (matrice Paramètres, manifeste, playbook, inventaire) est lié à un **`registryId`**.

| Situation | Comportement outil | Interdit |
|-----------|-------------------|----------|
| `gnome-settings-assets-matrix-<vendor>.json` absent | **FAIL visible** + créer depuis VM/`proc/` | Fallback vers matrice d’un autre vendor |
| `proc/<id>/` absent | `run-manifest-replication-chain` | Emprunter chemins Rocky sur Ubuntu |
| Playbook PbΣ sans **S** local | Bloquer couche playbook | Mesurer avec matrice voisine |

Référence : [fondements-philosophiques.md](fondements-philosophiques.md) §9 **P11** · [logique-formelle.md](logique-formelle.md) **R-LOC1**.

**Implémentation** (juin 2026) : `lab-recipe-resolver.mjs` · `etc/capsuleos/contracts/lab-recipe-profiles.json` · `resolve-lab-recipe.mjs` · `bootstrap-gnome-settings-matrices.mjs`. Détail Phase 1e : [plan-phase-1-gnome-triplet.md](plan-phase-1-gnome-triplet.md) §5.

### 4.4 Recette économe — données avant lignes

Objectif : **moins de lignes**, **moins de Playwright**, **même fluidité UX**.

```text
VM (SSH) → proc/ + inventaire JSON
         → tokens / refs / grilles générés
         → skin vendor minimal (overrides + assets)
         → smokes paramétrés (toolkit × contrat apps-catalog)
         → gates validate-all
```

| Anti-pattern (dette Mint pionnier) | Cible |
|-------------------------------------|-------|
| 1 app = 1 smoke Playwright dédié | `smoke-app-slot.mjs --id <registry> --slot <slot>` + exceptions (Firefox, Nemo) |
| CSS couleur copié VM → `.skin.css` 500+ lignes | Inventaire → variables `--vendor-*` / cluster `toolkit-*` |
| `content/<vendor>-tray.js` monolithique | Provider `toolkit-cinnamon` / bindings GNOME partagés |
| MD parité rédigé en double du JSON | `generate-formal-advancement-report` + dérivés parité |

**Pyramide ressources** : SSH/JSON (faible) → `validate-all` (faible) → 1 smoke shell Playwright (moyen) → burst VΣ (lourd, après ManΣ ∧ AppΣ).

---

## 5. Orchestrateur agnostique unique

### 5.1 Problème actuel

| Orchestrateur | Domaine |
|---------------|---------|
| `run-formal-chain.mjs` | Règles H₂…H₆ |
| `run-manifest-replication-chain.mjs` | ManΣ |
| `run-replication-chain.mjs` | GNOME settings |
| `run-playbook-general.mjs` | PbΣ |
| `run-agent-auto.mjs` | Repli |
| `run-vendor-assets-pipeline.mjs` | Assets legacy |
| `run-ui-state-effects-pass.mjs` | VΣ |

→ L’agent ne sait pas quoi lancer ; les priorités se contredisent (R-H1 vs R-MAN3).

### 5.2 Cible : `run-capsule-pipeline.mjs` (extension, pas duplication)

**Ne pas** créer un fichier vide : **étendre** `run-agent-auto.mjs` + `resolve-agent-action.mjs` avec :

```json
{
  "layers": [
    { "id": "socle", "predicates": ["H2"] },
    { "id": "ground-truth", "predicates": ["ManΣ"] },
    { "id": "apps", "predicates": ["AppΣ"] },
    { "id": "store", "predicates": ["StoreG", "StoreΣ", "StoreVp"] },
    { "id": "playbook", "predicates": ["PbΣ"] },
    { "id": "visual", "predicates": ["Vp", "VΣ"] },
    { "id": "fidelity", "predicates": ["Tf"] },
    { "id": "release", "predicates": ["H6"] }
  ],
  "registryProfile": "etc/capsuleos/profiles/<id>.json"
}
```

- **Une** résolution : `resolve-agent-action.mjs --scope pipeline`
- Les chaînes existantes deviennent des **étapes** du DAG, pas des entrées concurrentes
- `generate-formal-advancement-report.mjs` devient le **tableau de bord** hebdomadaire

### 5.3 Multitâche : ce qui peut être parallèle

| Parallèle OK | Séquentiel obligatoire |
|--------------|------------------------|
| Collecte manifeste Rocky **∥** revue ManA Ubuntu | import → refs → grille |
| Rapport avancement **∥** dev correctifs V0 | VΣ burst VM (session SSH unique) |
| Smoke validate zone **∥** doc | Playwright Capsule après sync façade |

---

## 6. Phases détaillées

### Phase 0 — Fondation ✅ (clôturée juin 2026)

| # | Livrable | Statut |
|---|----------|--------|
| 0.1 | Contrat chemins §4.1 | ✅ |
| 0.2 | `apply-manifest-refs.mjs` | ✅ drift Ubuntu → 0 |
| 0.3 | Chaîne ordonnée §4.2 | ✅ |
| 0.4 | `run-capsule-pipeline.mjs` | ✅ |
| 0.5 | Ubuntu ManΣ + H₂ | ✅ |
| 0.6 | Rapport avancement CI | ⏳ optionnel |

### Phase 1 — Triplet GNOME VM (V1) — voir [plan-phase-1-gnome-triplet.md](plan-phase-1-gnome-triplet.md)

| Vague | Statut | Reste à faire |
|-------|--------|---------------|
| **1a** Ubuntu AppΣ + Tf | ✅ | — |
| **1b** Rocky manifeste | ✅ | ManA → staging → import → integrate-skin (**sans** patch skin H₆) |
| **1c** Fedora manifeste + AppV | ✅ | ManA ; `registryOverrides` AppΣ |
| **1d** drift icon-pack Ubuntu | ✅ | — |
| **1e** Clôture triplet V1 | ✅ | Triplet stable — H₂ global |

**1e — Clôture triplet V1 (bloquant Phase 2)**

| Registry | Actions | Gate |
|----------|---------|------|
| **ubuntu** | `gnome-settings-assets-matrix-ubuntu.json` ; durcir fallback **R-LOC1** ; `run-capsule-pipeline` → PbΣ → H₆ | PbΣ ∧ pas de matrice empruntée |
| **rocky** | `approve-vm-distribution-manifest` → chaîne ManΣ parallèle | ManΣ sans régression H₆ |
| **fedora** | Idem ManΣ ; **pas** `R-SHELL-POLISH` tant que skin gelé ; AppΣ après ManA | ManΣ ∧ AppΣ |

**Critère triplet V1 stable** : Ubuntu **H₆** (ou PbΣ vert + H₂) **et** Rocky **et** Fedora **ManΣ** **et** **H₂** global.

### Phase 2 — GNOME étendu (V2) — **en cours**

| Registry | Upstream | Première passe | Bloquant |
|----------|----------|----------------|----------|
| **linux-alma** | rocky | Profil P11 + matrices bootstrap + marqueurs overview skin | VM lab + ManΣ |
| **linux-anduinos** | ubuntu | Profil P11 + matrices bootstrap | VM lab + ManΣ |
| **linux-popos** | ubuntu (cosmic) | Hors GNOME pur — toolkit cosmic | VM + recette dédiée |

Héritage catalogue manifeste, matrices locales **P11** (`lab-recipe-profiles.json` + `bootstrap-gnome-settings-matrices.mjs --id`).

### Phase 3 — Cinnamon (V3) — Mint

| # | Sujet | Action |
|---|--------|--------|
| 3.1 | ManΣ cinnamon | `run-manifest-replication-chain --id linux-mint` ; `extends: toolkit:cinnamon` |
| 3.2 | Refactor dette code | Remonter tray/effets vers `clusters/toolkit-cinnamon` + `usr/lib` ; réduire `home/Debian/Mint/content/` |
| 3.3 | Smokes | Fusionner vers smoke paramétré ; garder Playwright ciblé (Nemo, Firefox) |
| 3.4 | Clôture design | Passe « Rocky-like » : PNG shell, effets P2→P0, playbook Paramètres Cinnamon (à définir) |
| 3.5 | VM lab | Entrée `lab-inventory.json` si absente |

**Ne pas** continuer la passe alphabétique « 1 app = 3 fichiers » sans gate de consolidation toolkit.

### Phase 4 — KDE (V4) — Neon, Debian KDE, MX, openSUSE

| Spécificité | Action |
|-------------|--------|
| Explorateur Dolphin | `explorer-registry.js` déjà prêt |
| Manifeste | `toolkit:kde` ; icônes breeze |
| VΣ | Matrice Plasma distincte de `ui-state-effects-matrix-gnome.json` |

**Ne pas** forcer les prédicats GNOME (G, Vc settings panneaux) sur KDE.

### Phase 5 — Windows (V5–V6)

**Référence** : windows-10 + windows-11 (P0 actifs).

| Modèle | Contenu |
|--------|---------|
| Pas de VM manifeste | Ground truth = inventaires + assets packs + contrats chrome |
| `proc/` adapté | `proc/windows-11/desktop-manifest.json` (même **forme** que Linux, contenu différent) |
| Chaîne | inventaire → assets → skin → validate-window-chrome |

Versions rétro (95–Vista) : **hériter** contrats win10/11 où possible ; pas de pipeline séparé.

### Phase 6 — macOS Sonoma (V7)

Même pattern Windows : pas de VM ; inventaire + HIG Apple ; `proc/macos-sonoma/`.

### Phase 7 — Android / iOS (V8)

| Point | Décision |
|-------|----------|
| Manifeste VM | Non — APK/simulateur hors scope lab actuel |
| `proc/` | Liste apps + icônes Material / SF Symbols depuis contrats |
| VΣ | Gestes/touch — matrice séparée |

---

## 7. Effets graphiques et interactions (VΣ)

### 7.1 Pourquoi c’est difficile

- Effets = **fonction(contexte, état, durée)** — pas une capture statique
- VM Wayland : `virsh screenshot` ≠ timing transition
- Capsule : `getComputedStyle` sans rejouer l’action = faux négatif

### 7.2 Recette robuste — **VΣ apps complètes** (décision actée)

```
ManΣ ∧ AppΣ
  → run-visual-parity-pass (Vp)          # pixel shell + apps P0
  → lab-capture-session.sh -- run-ui-state-effects-pass
      → extend matrix (--ensure-apps)   # toutes apps VM → matrice
      → collect VM burst (shell + apps)
      → collect Capsule --capsule (shell + apps)
      → smoke VΣ                        # clôture P0
```

**Renforcement plan** :

1. Lier **Va** aux icônes réellement importées (post-ManΣ)
2. Matrice KDE/Cinnamon/Windows **séparées**, même **prédicats** Ve…Vμ
3. Ne pas lancer VΣ avant **H₂** zone skin (refs valides)
4. **P0 non clôturé** sans **Vp ∧ VΣ** — la fidélité expérientielle n’est pas optionnelle ([fondements](fondements-philosophiques.md) §1.2)

---

## 8. Livraison runtime (scripts navigateur)

### 8.1 Diagnostic

- `build-linux-embed.mjs` produit un **monolithe** `capsule-app-embed.js`
- Init slots vanilla existants — **bon pattern**, à étendre

### 8.2 Plan (sans surcharger)

| Action | Module ? |
|--------|----------|
| `import()` dynamique par `CAPSULE_EMBED_SKIN_KEY` + slot | Étendre `build-linux-embed.mjs` |
| P0 apps dans embed initial ; P1+ lazy | Config `apps-catalog` `priorite` |
| `defer` / `requestIdleCallback` pour smokes non critiques | Boot noyau |
| Scripts lab Node | Rester synchrones — OK |

**ES2018–2019** : utiliser `async/await` dans **nouveaux** outils lab uniquement ; noyau : **`import()`** (ES2020 dynamique) pour lazy apps.

### 8.3 Fondu noir ouverture OS

Implémentation minimale (Phase 0.7 ou 1) :

```css
#capsule-boot-veil {
  position: fixed; inset: 0; background: #000; z-index: 999999;
  opacity: 1; transition: opacity 400ms ease-out; pointer-events: none;
}
#capsule-boot-veil.is-ready { opacity: 0; }
```

- Hook : `CapsuleBoot.onReady()` après embed + première frame shell
- pick-os → navigation OS : même voile
- **Pas** de librairie animation

---

## 9. schema.org (périmètre acté)

Aligné [fondements-philosophiques.md](fondements-philosophiques.md) §10.

### Où oui

- **`/OS/`** — métadonnées des entrées OS (façades, catalogue pick-os) : `ItemList`, `SoftwareApplication` ou équivalent pédagogique
- **`/mnt/`** — scénarios pédagogiques injectables cross-OS : `LearningResource`, `Course` selon le module
- Portail racine `index.html` si hub catalogue

### Où non

- Intérieur du bureau simulé (fenêtres, menus, apps ouvertes) — pas de JSON-LD par slot

### Livrable

- `usr/lib/capsuleos/tools/build-schema-org.mjs` — génère JSON-LD depuis `os-registry.json` + manifestes `/mnt` · gate `validate-schema-org.mjs`
- Référence : [convention-schema-org.md](convention-schema-org.md)

---

## 10. CSS variables vs localStorage

### Règle de décision

| Donnée | Stockage |
|--------|----------|
| Accent, thème, échelle UI (gsettings-like) | `--capsule-*` CSS + optionnel session |
| Fond d’écran sélectionné (id) | localStorage **léger** (id seulement) + CSS `background-image` |
| Onglets explorateur/terminal | localStorage (état session) |
| Parité VM mesurée | JSON inventaire, pas localStorage |

### Action

- Audit `capsule-theme-storage.js` : migrer clés **visuelles** vers variables déjà lues par le skin
- Ne pas vider localStorage onglets — ce n’est pas la même dette

---

## 11. Automatisations proposées

| Automatisation | Déclencheur | Action |
|----------------|-------------|--------|
| Rapport avancement | Hebdo / avant PR skin | `generate-formal-advancement-report.mjs --write` |
| Gate chemins | CI | smoke post-import : refs HTML ⊆ disque |
| Pipeline dispatcher | Agent / hook Cursor | `resolve-agent-action --scope pipeline` |
| ManA reminder | Playbook `pull > 0` | commentaire PR automatique (optionnel) |

**Pas** de nouvelle automation Cursor tant que Phase 0 non verte.

---

## 12. Ce que nous ne ferons pas (garde-fous)

- ❌ Un orchestrateur par vendor
- ❌ Un module `capsule-async-kernel-v2` parallèle
- ❌ schema.org dans chaque fenêtre simulée (OK sur `/OS` et `/mnt`)
- ❌ Suppression localStorage session utilisateur
- ❌ Migration ES modules complète du noyau d’un coup
- ❌ Collecte manifeste sur Windows/macOS/mobile (autre modèle `proc/`)
- ❌ Nouveaux scripts si une lib existante peut être étendue

---

## 13. Jalons et critères de succès

| Jalon | Statut | Critère |
|-------|--------|---------|
| **J0** | ✅ | Ubuntu H₂ vert post-ManΣ |
| **J1** | ✅ | Rocky + Fedora `proc/` ManV ∧ PbM |
| **J2** | ✅ | `run-capsule-pipeline` + plan Phase 1 |
| **J1e** | ⏳ | Triplet V1 stable (§6 Phase 1e) |
| **J3** | ⏳ | Mint ManΣ **ou** KDE neon ManV (après J1e) |
| **J4** | ⏳ | win10/11 proc manifest + lazy embed P0 |
| **J5** | ⏳ | VΣ triplet GNOME ; refs cohérentes **P11** |

---

## 14. Prochaine action (résolution pipeline — juin 2026)

Ordre décidé par `resolve-agent-action.mjs --scope pipeline` et **P11** :

1. **Code** — `collect-vm-gnome-settings-assets.mjs` : FAIL si matrice vendor absente (**R-LOC1**)
2. **Ubuntu** — créer `gnome-settings-assets-matrix-ubuntu.json` ; `run-capsule-pipeline --id linux-ubuntu`
3. **Rocky ∥ Fedora** — `approve-vm-distribution-manifest.mjs --write` puis chaîne ManΣ (skin intact)
4. **Rapport** — `generate-formal-advancement-report.mjs --write` après J1e

**Reporté** : Phase 2 GNOME étendu ; polish Fedora shell ; passe apps Mint alphabétique.

---

## 15. Documents à maintenir (pas à multiplier)

| Document | Rôle |
|----------|------|
| **[README.md](README.md)** | **Point d’entrée unique** — vision, canon, anti-parasites |
| [convention-clean-code.md](convention-clean-code.md) | **P12** — obligation d’écriture (intègre README) |
| [fondements-philosophiques.md](fondements-philosophiques.md) | Constitution — pourquoi (**P11**, **P12**) |
| **Ce plan** | Roadmap — quand / ordre / backlog intégré |
| [plan-phase-1-gnome-triplet.md](plan-phase-1-gnome-triplet.md) | Détail V1 GNOME (vagues 1a–1e) |
| `avancement-formel-*.md` | État hebdo (généré) |
| [logique-formelle.md](logique-formelle.md) | Prédicats (**R-LOC1**) |
| [convention-manifest-vm.md](convention-manifest-vm.md) | Recette clone ManΣ |
| [convention-reproduction-os.md](convention-reproduction-os.md) | Recette économe §4.4 |
| Skills existants | Projections — **enrichir**, pas dupliquer |

---

## 16. Backlog intégré (sujets session juin 2026)

| ID | Sujet | Phase | Priorité |
|----|--------|-------|----------|
| B1 | Triplet V1 stable (1e) | 1 | P0 |
| B2 | P11 / R-LOC1 — `lab-recipe-resolver` + collectors | 1/1 | P0 |
| B3 | Matrice Paramètres Ubuntu | 1 | P0 |
| B4 | ManΣ Rocky + Fedora (parallèle) | 1 | P0 |
| B5 | Recette hybride Mint collecte + Rocky clôture | transversal | P1 |
| B6 | Refactor Mint → toolkit-cinnamon | 3 | P1 |
| B7 | Smokes paramétrés (réduction 13→N) | transversal | P1 |
| B8 | Docs parité générés depuis JSON | transversal | P2 |
| B9 | Phase 2 alma / anduinos / popos | 2 | P1 après B1 |
| B10 | ManΣ linux-mint | 3 | P1 après B1 |
| B11 | VΣ burst triplet | 7 | P1 après B1 |
| B12 | Lazy embed P0 / boot veil | 8 | P2 |

---

*Dernière mise à jour : 2026-06-09 — Phase 0–1a–1d clôturées ; backlog §16 ; P11 / recette économe §4.3–4.4.*
