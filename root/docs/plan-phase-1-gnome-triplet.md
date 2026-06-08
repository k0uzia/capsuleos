# Plan Phase 1 — Triplet GNOME VM (V1)

> **Statut** : vagues **1a–1d clôturées** · vague **1e** en cours (juin 2026)  
> **Parent** : [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) §6 · backlog **B1–B4** §16  
> **Références** : [fondements-philosophiques.md](fondements-philosophiques.md) (**P11**) · [logique-formelle.md](logique-formelle.md) (**R-LOC1**) · [convention-manifest-vm.md](convention-manifest-vm.md)

---

## 0. Contexte (juin 2026)

| Registry | ManΣ | H₂ | AppΣ | PbΣ | H₆ | Posture pipeline |
|----------|------|-----|------|-----|-----|------------------|
| **linux-ubuntu** | ✓ | ✓ | ✓ | ✗ | ✗ | Couche **playbook** — matrice Paramètres locale requise |
| **linux-rocky** | ✗ | ✓ | ✓ | ✓ | ✓ | **ManA** — migration ManΣ parallèle, skin gelé |
| **linux-fedora** | ✗ | ✓ | ✗ | ✓ | ✓* | **ManA** puis AppΣ ; pas de polish shell |

\*H₆ Fedora = ancienne chaîne — ne pas toucher le skin sans ManΣ.

**Orchestrateur** : `node usr/lib/capsuleos/tools/lab/run-capsule-pipeline.mjs --id <registryId>`

---

## 1. Objectif Phase 1

Aligner le **triplet GNOME lab** (Ubuntu, Rocky, Fedora) sur la même **forme épistémique** :

```text
ManΣ (proc/) → AppΣ → PbΣ → Vp → VΣ → Tf → H₆
```

Sans dupliquer de modules : enrichir chaînes et contrats existants (**P11** : vérité locale par `registryId`).

---

## 2. Vagues

### 1a — Ubuntu : AppΣ ✅

| Étape | Gate |
|-------|------|
| Enquête apps P0 | **AppΣ** ✓ |
| `run-apps-lab.mjs` | **AppL** ✓ |
| Fidélité Tf | ✓ |

Commit : `483f11b`.

---

### 1b — Rocky : collecte manifeste ✅

| Contrainte | Détail |
|------------|--------|
| **Interdit** | Modifier `home/RedHat/Rocky/` tant que H₆ est la référence |
| **Autorisé** | `proc/linux-rocky/`, playbook |

**Critère done 1b** : ManV ∧ ManS ∧ PbM — ✅

Commit : `59df508`.

---

### 1c — Fedora : manifeste + AppV ✅

**Critère done 1c** : ManV ∧ `linux-fedora-vm-apps-installed.json` — ✅

Commit : `e0b2a24`.

---

### 1d — drift icon-pack Ubuntu ✅

Extension `apply-manifest-refs` + `manifest-icon-pack-refs-lib.mjs` ; drift **0** ; `validate-all` OK.

Commit : `f4d2d70`.

---

### 1e — Clôture triplet V1 ⏳

**Bloquant Phase 2** ([plan-maitre](plan-maitre-reproduction-os.md) §6).

| Étape | Registry | Commande / livrable | Gate |
|-------|----------|---------------------|------|
| 1e.1 | **Tous** | Durcir `collect-vm-gnome-settings-assets` — **R-LOC1** (pas de fallback Rocky) | FAIL explicite |
| 1e.2 | **ubuntu** | `gnome-settings-assets-matrix-ubuntu.json` depuis VM/`proc/` | **S** local |
| 1e.3 | **ubuntu** | `run-capsule-pipeline.mjs --id linux-ubuntu` | **PbΣ** |
| 1e.4 | **rocky** | `approve-vm-distribution-manifest.mjs --id linux-rocky --write` | **ManA** |
| 1e.5 | **rocky** | Chaîne auto : staging → import → `apply-manifest-refs` | **ManΣ** |
| 1e.6 | **fedora** | Idem 1e.4–1e.5 | **ManΣ** |
| 1e.7 | **fedora** | `registryOverrides` + `generate-apps-catalog` | **AppΣ** |
| 1e.8 | **global** | `validate-all.mjs` + `generate-formal-advancement-report.mjs --write` | **H₂** |

**Critère done Phase 1** : triplet V1 stable = Ubuntu **PbΣ** (puis H₆) **et** Rocky **ManΣ** **et** Fedora **ManΣ ∧ AppΣ** **et** **H₂** global.

---

## 3. Ordre d'exécution (1e)

```text
1e.1 R-LOC1 (code)
  ∥
1e.2 Matrice Ubuntu
  → 1e.3 Pipeline Ubuntu

1e.4 ManA Rocky  ∥  1e.4 ManA Fedora
  → 1e.5 ManΣ chaque
  → 1e.7 AppΣ Fedora

→ 1e.8 validate-all + rapport
```

---

## 4. Commits par jalon

| Jalon | Statut | Contenu |
|-------|--------|---------|
| **P1-doc** | ✅ | Plan Phase 1 + plan maître |
| **P1a** | ✅ | AppΣ Ubuntu |
| **P1b** | ✅ | `proc/linux-rocky/` |
| **P1c** | ✅ | `proc/linux-fedora/` |
| **P1d** | ✅ | icon-pack refs |
| **P1e** | ⏳ | R-LOC1 + triplet V1 stable |

---

## 5. Recette lab adaptative (algorithme — juin 2026)

Objectif : modifier la recette **à la volée** (matrices, profils, flags) sans redéployer le code — cloisonnement **P11** / **R-LOC1**.

### Modèle

```text
P(d)     profil registryId d     → etc/capsuleos/contracts/lab-recipe-profiles.json
A(d,k)   artefact kind k         → root/tools/lab/gnome-settings-*-matrix-{vendor}.json
G        graphe gates            → replication-chain.json + capsule-pipeline-layers.json
next(d)  min prédicat faux       → resolve-lab-recipe.mjs / run-capsule-pipeline.mjs
```

**Hot-reload** : éditer le profil ou une matrice JSON, ou `CAPSULE_RECIPE_OVERRIDE=/chemin/patch.json` — le prochain collect/pipeline lit la nouvelle recette.

**Profils lab** (`lab-recipe-profiles.json` → `labProfiles`) :

| Profil | Commande | Gate |
|--------|----------|------|
| `visual-prereq` | `run-gnome-settings-lab --profile visual-prereq` | **L** |
| `visual-vm` | `collect-vm-gnome-settings-visual-investigation --filter P0` | **V** |

**Capsule HTTP** : `resolveCapsuleHttpBase(id)` lit `capsuleUrl` dans `lab-inventory.json` (Ubuntu :8765, Rocky :5500).

**Ubuntu P0 visuel** : 4 contrôles automatisables sans gcc (theme, night-light, dynamic-workspaces, dnd) ; 11 autres enquêtes = P1/P2 (panneaux Paramètres).

### Outils

| Commande | Rôle |
|----------|------|
| `resolve-lab-recipe.mjs --id <registryId>` | Écarts recette + prochaine action pipeline |
| `bootstrap-gnome-settings-matrices.mjs --id <id> --write` | Créer matrices locales (proc / toolkit) |
| `lab-recipe-resolver.mjs` | Bibliothèque — `resolveLabMatrix`, `resolveChainNextAction` |

### R-LOC1 (durci)

- Plus de fallback silencieux vers `gnome-settings-assets-matrix.json` (Rocky).
- Matrice vendor absente → **FAIL** explicite + hint bootstrap.
- Assets VM optionnels : champ `optionalOnVm` dans la matrice (ex. adwaita JXL Ubuntu Wayland).

### Phase 1e — état exécution (VMs actives)

| Étape | Statut |
|-------|--------|
| 1e.1 R-LOC1 code | ✅ `lab-recipe-resolver` + collectors |
| 1e.2 Matrice Ubuntu | ✅ bootstrap + collect VM (gate S) |
| 1e.3 Pipeline Ubuntu PbΣ | ⏳ V/G/Vc OK · Vp + Pbτ en cours (4 P0 shell documentés) |
| 1e.4 ManA Rocky/Fedora | ✅ manifestes approuvés |
| 1e.5 ManΣ Rocky | ⏳ bloqué — `apply-manifest-refs` : marqueurs overview absents sur skin H₆ gelé |
| 1e.5 ManΣ Fedora | ⏳ après Rocky ou patch agnostique import |

---

## 6. Hors scope Phase 1

- Phase 2 GNOME étendu (alma, anduinos, popos)
- Refactor Mint toolkit (Phase 3)
- CI rapport avancement obligatoire (optionnel 0.6)

---

## 7. Suite (Phase 2)

GNOME étendu — **uniquement après** critère done §2 **1e**.

Voir [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) §6 Phase 2.
