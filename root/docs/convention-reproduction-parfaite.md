# Convention — reproduction parfaite d'OS

> **Contrat machine** : `etc/capsuleos/contracts/os-reproduction-coherence.json`  
> **Formel** : [logique-formelle.md](logique-formelle.md) §2.15  
> **Store** : [procedure-store-replication-formelle.md](procedure-store-replication-formelle.md)

Cette convention inscrit dans les manifests et recettes de campagne les quatre piliers demandés pour atteindre des reproductions parfaites d'OS avant de poursuivre le travail store.

---

## 1. Logique de cohérence (C1–C9)

| Id | Principe | Règle opérationnelle |
|----|----------|----------------------|
| **C1** | VM prime | Baseline depuis inventaire VM ou contrat ground — jamais fallback vendor (P11) |
| **C2** | Flux Z0→Z3 | Contrat → noyau → skin → façade ; le skin ne définit pas la vérité machine |
| **C3** | Prédicats séquentiels | Pas de Vp / StoreVp sans Vc / StoreVc documenté |
| **C4** | Ground avant skin | ¬I → pas de patch skin ; contentSpec avant template/CSS |
| **C5** | Façade canonique | Playwright via `resolveCapsuleOsUrl` — pas `home/` direct |
| **C6** | Écart explicite | Chaque écart classé dans `contentGaps[]` (grille) |
| **C7** | Clôture déductive | Reproduction parfaite = toutes dimensions P0 à `ok` ou `accepted` documenté |
| **C8** | Composition par slots | Assembler l'OS depuis `slots-manifest` — ne pas cloner un OS déjà couvert |
| **C9** | Delta VM seulement | Comparer inventaire VM au dépôt ; extraire/analyser **uniquement** sur GapΔ explicite |

---

## 2. Logique déductive

### Prémices

- **M** — VM lab accessible  
- **I** — Inventaire VM  
- **H₂** — Socle `validate-all`  
- **V** — Enquête visuelle documentée  

### Règles d'inférence (extrait)

```text
D-STRUCT   : H₂ ∧ AppV ∧ AppC ∧ AppP0 ∧ AppL  →  AppΣ
D-VISUAL   : AppΣ ∧ AppVv ∧ AppVc ∧ AppVp     →  parité classée
D-STORE-G  : StoreG ∧ StoreΣ ∧ H₂             →  magasin branché
D-STORE-P  : StoreG-ready ∧ StoreVc ∧ StoreVp →  StoreΣ-perfect
D-OS-P     : ManΣ ∧ AppΣ ∧ PbΣ ∧ Tf ∧ H₆      →  OsΣ-registry
D-REAL     : AppVp ∧ VΣ ∧ SlotF-full           →  RealΣ (réalisme vécu P0)
D-REAL-REG : ∀ slot P0 : RealΣ                 →  RealΣ-registry
```

### Inférences interdites

| Pattern | Remède |
|---------|--------|
| AppVp sans AppVc | Captures Capsule slot |
| Patch skin sans contentSpec | `contentGaps` dans inventaire visuel |
| Ground vendor A sur registry B sans overlay | `byRegistry` ou `slotOverlays` |
| ¬H₂ ∧ implémentation | R-IMP1 — gate d'abord |
| Campagne complète VM alors que SlotMap couvre P0 et GapΔ vide | `campaignPhases` réduit ; corriger gaps ouverts seulement |
| Nouveau gabarit pour slot déjà Σ satisfait | `byRegistry`, slotOverlays, contrat contenu |
| `partial` P0 sans `contentGaps` ouverts | `resolve-slot-gap-delta --write` (matérialise RealΣ) |

---

## 2d. Réalisme vécu (RealΣ)

**Formule** : `RealΣ = Vp ∧ VΣ ∧ functionalDepth ∉ {partial}` (slots P0).

| Composante | Signification | Gap auto si manquant |
|------------|---------------|----------------------|
| **Vp** | `visualMatch ∈ {ok, accepted}` | `chrome` |
| **VΣ** | Matrice effets UI clôturée | `Vc` (registre) |
| **depth** | `functionalDepth = full` (ou full équivalent) | `interaction` |

`resolve-slot-gap-delta --write` ouvre automatiquement des `contentGaps` pour chaque **realSigmaDebt** (P0 sans RealΣ et sans gap ouvert) — prédicat **F-SILENT-PARTIAL** interdit le partial silencieux.

```bash
node usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs --id <registryId> --write
```

---

## 2b. Anticipation création OS (P-OS1–P-OS9)

Principes inscrits dans `os-reproduction-coherence.json` → `osAnticipationPrinciples` :

| Id | Essentiel |
|----|-----------|
| **P-OS1** | Pilote unique, dérivés explicites (`campaignPhases` réduit) |
| **P-OS2** | Σ structurel ≠ Vp parité |
| **P-OS3** | Contrat Z0 = prédicat + script + gate |
| **P-OS4** | Induction (VM) avant déduction (pipeline) |
| **P-OS5** | Grille 5 dimensions, zéro gap silencieux |
| **P-OS6** | Spine unique `run-capsule-pipeline` |
| **P-OS7** | Recette économe par registry |
| **P-OS8** | Façade canonique + rapport formel agrégé |
| **P-OS9** | **Réutiliser avant recréer** — SlotMap puis GapΔ seulement |

---

## 2c. Campagne différentielle (C9)

Workflow : **VmInventory → SlotMap → GapDelta → SelectiveCR → PatchGapOnly**

| Étape | Rôle |
|-------|------|
| **SlotMap** | Croiser `*-vm-apps-installed.json` avec `slots-manifest` + `apps-catalog` |
| **GapΔ** | Lister `contentGaps` ouverts, `p0Gaps`, slots absents |
| **SelectiveCR** | Exécuter seulement les phases CR non sautées (`differential-campaign-lib.mjs`) |

**Saut de phase** (si condition vraie) :

- **CR-1** : inventaire VM déjà présent  
- **CR-2** : P0 documenté sans `contentGaps` ouverts  
- **CR-4** : `byRegistry` store présent sans gaps catalog/content  

**Déclencher extraction / analyse** seulement si :

- `contentGaps[].status = open` sur la dimension concernée  
- ou slot VM sans mapping catalogue  
- ou `p0Gaps > 0`

**Outil** (avant toute campagne CR ou store) :

```bash
node usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs --id <registryId> --write
```

Artefacts : `root/docs/inventaires/<registryId>-slot-gap-delta.json` et `.md`.

---

## 3. Grille d'argumentation

Chaque slot **P0** (ex. `update_manager`) est évalué sur **cinq dimensions** :

| Dimension | Preuves attendues |
|-----------|-------------------|
| **chrome** | Captures VM/Capsule, ancres CSS, CSD |
| **content** | Inventaire VM, contrat contenu, contentGaps |
| **catalog** | apps-catalog, store catalog, apps installées VM |
| **interaction** | userScenarios, smoke Playwright, data-* |
| **detail** | Fiche app, champs meta, capture VM détail |

### Verdicts par dimension

`ok` · `partial` · `gap` · `accepted` (avec note et référence VM)

### Promotion globale

- **Parfaite** : ∀ dim P0 ∈ {ok, accepted}  
- **Merge-ready** : aucune dimension `gap`  
- **Bloquée** : ∃ dim P0 = `gap`  

Forme inventaire : `contentGaps[]` avec `id`, `dimension`, `severity`, `status`.

---

## 4. Liste de critères (reproduction parfaite)

### Par couche registre

| Couche | Prédicats | Critères |
|--------|-----------|----------|
| Socle | H₂ | `validate-all` exit 0 |
| Manifeste | ManΣ | vm-distribution-manifest approuvé |
| Apps | AppΣ, AppVp | p0Gaps=0, visualMatch documenté |
| Store | StoreΣ, StoreG, StoreVp | ground Fedora, 5 dimensions grille |
| Release | H₆, Tf | validate-all post-patch, sync skin si Z2 |

### Profil slot `update_manager`

- **Référence** : `linux-fedora`  
- **Vues VM minimales** : explore-grid, featured-hero, updates-banner, app-detail  
- **Contrats** : `gnome-software-store-content.json`, `store-installable-apps.json`  
- **Noyaux** : `gnome-software-ground.js`, `gnome-store-catalog.js`  

---

## 5. Recette de campagne (phases CR-0…CR-6)

Ordre obligatoire avant continuation store :

1. **CR-0** — `validate-all.mjs` (H₂)  
2. **CR-1** — Inventaire VM apps  
3. **CR-2** — Enquête visuelle VM P0  
4. **CR-3** — Grille + `contentGaps` (`enrich-apps-visual-investigation-parity`)  
5. **CR-4** — Ground contrat + `generate-store-catalog.mjs`  
6. **CR-5** — Captures Capsule store (`capture-capsule-software-views`)  
7. **CR-6** — Clôture StoreVp  

Gate : `validate-os-reproduction-coherence.mjs` (intégré **H₂**).

---

## 6. Liens contrats

| Fichier | Rôle |
|---------|------|
| `os-reproduction-coherence.json` | Cadre canonique (ce document) |
| `apps-replication-chain.json` | Chaîne apps + référence cohérence |
| `store-replication-chain.json` | Chaîne magasin GNOME |
| `lab-recipe-profiles.json` | Hooks campagne par registryId |
| `gnome-software-store-content.json` | Ground contenu store |
| `slots-manifest.json` | `groundReferenceRegistryId` slot |
