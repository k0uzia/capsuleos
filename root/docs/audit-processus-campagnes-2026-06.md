# Audit processus et campagnes — CapsuleOS (juin 2026)

> **Complète** : [audit-structure-depot-2026-06.md](audit-structure-depot-2026-06.md) · [convention-raisonnement-inductif-deductif.md](convention-raisonnement-inductif-deductif.md)

---

## 1. Orchestrateurs — carte des conflits

| Point d'entrée | Scope | Rôle |
|----------------|-------|------|
| `run-capsule-pipeline.mjs` | pipeline | Couches DAG §5.2 — **entrée unique cible** |
| `resolve-agent-action.mjs` | pipeline / formal / general / replication | Résolution R-AUTO |
| `run-formal-chain.mjs` | formal | R-H1…R-MAN*, R-APP*, R-PB4 |
| `run-playbook-general.mjs` | general | PbU→PbT→Pbτ |
| `run-replication-chain.mjs` | replication | Paramètres GNOME V→Vp |
| `run-manifest-replication-chain.mjs` | manifest | ManΣ |
| `run-apps-lab.mjs` | ad hoc | AppL — smokes Rocky hardcodés |
| `run-agent-auto.mjs` | repli | Enchaîne scopes |

**Conflit documenté** : pipeline couche `apps` avant `release` (H6) ; formal **R-APP-LAB** exige `gates.H6` → résolu par scission AppΣ / AppVp (§4).

**Conflit store** : couche `store` déclarée sans `defaultCommand` ni R-STORE-* → **corrigé** juin 2026 (`store-replication-lib`, `run-store-replication-chain`).

---

## 2. Tests `resolve-agent-action` (juin 2026)

| registryId | pipeline (première action) | formal (première action) | Écart |
|------------|---------------------------|--------------------------|-------|
| linux-rocky | R-MAN3 ManA humain | R-MAN3 idem | Aligné |
| linux-fedora | store StoreG/Σ/Vp | R-A1 assets | Pipeline avance store ; formal socle assets |
| linux-alma | R-H1 ¬H₂ (état stale H2) | R-H1 idem | Aligné |
| linux-ubuntu | store incomplet | R-A1 assets | Idem Fedora |
| linux-mint | R-H1 | R-H1 | Cinnamon — pas storeCampaign |
| linux-anduinos | R-H1 | R-H1 | VM absente — prédicats vides |
| linux-kde-neon | R-H1 | R-H1 | KDE — store N/A |
| linux-opensuse | R-H1 | R-H1 | Idem |
| linux-popos | R-H1 | R-H1 | cosmic stub |

**Note** : `H2: false` sur Alma/Mint dans formal-state alors que `validate-all` vert — gate H2 à rafraîchir via `run-formal-chain` après patch.

---

## 3. Recettes par famille

| Famille | Contrat recette | Runtime | Problème |
|---------|-----------------|---------|----------|
| GNOME | `lab-recipe-profiles` + CR OsRepro | pipeline + store chain | campaignPhases étaient mortes → **câblées** |
| GNOME settings | `replication-chain.json` | `run-replication-chain` | OK |
| Apps | `apps-replication-chain.json` | formal R-APP-* | H6 vs pipeline → scission |
| Store | `store-replication-chain.json` | `run-store-replication-chain` | **nouveau** |
| Mint | `skin-toolkit-recipe` + cinnamon chain | partiel | smokes P4 ad hoc |
| KDE | `kde-ground-truth-chain` | stub | ManΣ absent |

---

## 4. État campagne — sources de vérité

| Pattern | Count | Statut |
|---------|-------|--------|
| `*-pipeline-resolve.json` | 8 versionnés | **À purger** — gitignore existe |
| `*-formal-state.json` | 5 | Persisté OK |
| `*-replication-state.json` | 8+ | Domaine settings/apps |
| `*-store-replication-state.json` | nouveau | Domaine store |
| `avancement-formel-*.md/json` | généré | Tableau de bord cible |

**Décision D4** : `generate-formal-advancement-report.mjs --write` = vue agrégée ; `*-resolve.json` strictement éphémères.

---

## 5. Synthèse inductive — cas → patterns

| Cas | Pattern |
|-----|---------|
| Rocky R-MAN3 | Gate humaine bloque spine sans régression skin |
| Fedora StoreVp partial | Ground OK, parité incomplète — induction VM store à poursuivre |
| Alma drift playbook | Contenu Z0/proc dérive malgré H6 |
| Ubuntu grille avant assets | M≠E ontologique |
| run-apps-lab Rocky-only | Tooling vendor-centrique |
| 7 orchestrateurs | Priorités contradictoires |
| campaignPhases mortes | Contrat sans runtime |
| Mint Π sans Playwright | Dette invisible |
| Double validateurs assets | Tooling redondant |

---

## 6. Hypothèses H1–H6 — verdict audit

| Id | Hypothèse | Verdict | Action |
|----|-----------|---------|--------|
| **H1** | Tout step chaîne a script + règle | **Validée** (post-gate étendu) | `validate-os-reproduction-coherence` |
| **H2** | Ordre pipeline ≠ formal apps/H6 | **Validée** → **corrigée** | Scission AppΣ / AppVp ; R-APP-STRUCT sans H6 |
| **H3** | campaignPhases exécutables | **Validée** (post-câblage) | `loadCampaignPhases` + store chain |
| **H4** | Store branché runtime | **Validée** (post-câblage) | `store-replication-lib` + R-STORE-* |
| **H5** | resolve.json éphémères | **Validée** | purge + gitignore |
| **H6** | Deux modèles recette | **Partielle** | `recipeProfileId` — backlog liaison skin-toolkit |

---

## 7. Décisions architecture (juin 2026)

### D1 — Ordre apps / H6

- **AppΣ structurel** (AppV ∧ AppC ∧ AppP0 ∧ AppL) : couche pipeline `apps` — **avant H6**
- **AppVp parité** : nouvelle couche `apps-parity` — **après H6**
- Règles formal **R-APP-VV/VC/VP** : conservent `gates.H6`
- Règles **R-APP2-STRUCT**, **R-APP-LAB-STRUCT** : `ManΣ ∧ …` sans H6

### D2 — campaignPhases

Lues depuis `lab-recipe-profiles.profiles[id].storeCampaign.campaignPhases` ; filtrent steps store et phases CR OsRepro.

| registryId | Phases actives |
|------------|----------------|
| linux-fedora | CR-0…CR-6 |
| linux-rocky | CR-0, CR-3, CR-5, CR-6 |
| linux-alma, linux-anduinos | CR-0, CR-5, CR-6 |

### D3 — Chaînes domaine = bibliothèques

Agent unique : `--scope pipeline`. Chaînes invoquées par `run-*-replication-chain.mjs`, pas en parallèle concurrent.

### D4 — État campagne

Rapport formel généré ; resolve.json purgés du dépôt versionné.

### D5 — Store ground

`groundReferenceRegistryId: linux-fedora` ; dérivés héritent `byRegistry` — pas d'inventaire VM ground sur Rocky (gel ManA).

---

## 8. Go/no-go store Fedora (post-implémentation)

| Critère | Statut |
|---------|--------|
| Audits publiés | ✅ |
| Hypothèses tranchées | ✅ |
| `run-store-replication-chain.mjs` | ✅ |
| Pipeline store sans undefined | ✅ |
| H₂ | ✅ validate-all |

**Suite** : `run-store-replication-chain.mjs --id linux-fedora --auto` pour fermer StoreVp (partial → ok).
