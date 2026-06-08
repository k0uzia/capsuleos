# Plan Phase 1 — Triplet GNOME VM (V1)

> **Statut** : en cours (juin 2026)  
> **Suite de** : [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) Phase 0 (clôturée Ubuntu ManΣ + H₂)  
> **Références** : [fondements-philosophiques.md](fondements-philosophiques.md) · [procedure-apps-replication-formelle.md](procedure-apps-replication-formelle.md) · [convention-manifest-vm.md](convention-manifest-vm.md)

---

## 0. Contexte

| Registry | ManΣ | H₂ | AppΣ | Posture |
|----------|------|-----|------|---------|
| **linux-ubuntu** | ✓ | ✓ | en cours | Pipeline couche **apps** |
| **linux-rocky** | ✗ | ✓ (H₆) | ✓ | Skin H₆ référence — **ne pas régresser** |
| **linux-fedora** | ✗ | partiel | ✗ | Pas de `proc/` manifeste |

**Orchestrateur** : `node usr/lib/capsuleos/tools/lab/run-capsule-pipeline.mjs --id <registryId>`

---

## 1. Objectif Phase 1

Aligner le **triplet GNOME lab** (Ubuntu, Rocky, Fedora) sur la même **forme épistémique** :

```
ManΣ (proc/) → AppΣ (catalogue + lab apps) → Vp (parité visuelle P0) → …
```

Sans dupliquer de modules : enrichir chaînes et contrats existants.

---

## 2. Vagues

### 1a — Ubuntu : clôturer AppΣ

| Étape | Commande | Gate |
|-------|----------|------|
| Enquête apps P0 (squelette) | `collect-vm-apps-visual-investigation.mjs --id linux-ubuntu --filter P0 --write` | documentedP0 ≥ 1 |
| Suite lab structure | `run-apps-lab.mjs --id linux-ubuntu` | **AppL** |
| Captures Capsule P0 (optionnel 1a+) | `collect-capsule-apps-visual-investigation.mjs` | AppVc |
| Parité classée | `enrich-apps-visual-investigation-parity.mjs` | AppVp → **AppΣ** complet |

**Critère done 1a** : `evaluateAppsReplicationPredicates('linux-ubuntu').state.AppΣ === true` (AppL ∧ catalogue P0 sans gap).

**Dette acceptée en 1a** : 54 drift icon-pack (mimetype/place/symbolic) — reportée à **1d**.

---

### 1b — Rocky : collecte manifeste parallèle

| Contrainte | Détail |
|------------|--------|
| **Interdit** | Modifier `home/RedHat/Rocky/` tant que H₆ est la référence shell |
| **Autorisé** | `proc/linux-rocky/distribution-manifest.json`, playbook, inventaires |

```bash
node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id linux-rocky --write --max-steps 3
# ensure-vendor-catalog → collect-manifest → smoke-manifest
```

**Critère done 1b** : ManV ∧ ManS ∧ PbM (sans ManA ni import).

---

### 1c — Fedora : manifeste + AppV

```bash
node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id linux-fedora --write --max-steps 4
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-fedora --write --ssh
```

**Critère done 1c** : ManV ∧ `linux-fedora-vm-apps-installed.json` présent.

---

### 1d — Transversal : drift icon-pack → refs skin

Étendre `apply-manifest-refs.mjs` pour réécrire les refs mimetype/place/symbolic/emblem dans les gabarits Nemo / shell (pas seulement overview).

**Critère done 1d** : playbook Ubuntu `drift=0` après `apply-manifest-refs --write`.

---

## 3. Ordre d'exécution recommandé

```text
1a Ubuntu AppΣ     (bloquant pipeline ubuntu)
  ∥
1b Rocky collecte   (parallèle, lecture seule skin)
  ∥
1c Fedora collecte  (après 1b ou en parallèle si VM OK)

→ H₂ global (validate-all)

1d drift icon-pack  (après H₂ Ubuntu stable)
```

---

## 4. Commits par jalon

| Jalon | Contenu commit |
|-------|----------------|
| **P1-doc** | Ce plan + éventuelle màj `plan-maitre` § renvoi |
| **P1a** | `*-apps-visual-investigation.json`, `*-apps-lab-state.json`, catalogue |
| **P1b** | `proc/linux-rocky/distribution-manifest.json` + playbook |
| **P1c** | `proc/linux-fedora/` + inventaire apps |
| **P1d** | Extension `apply-manifest-refs` + skin refs |

---

## 5. Hors scope Phase 1

- Playwright / captures VM temps réel (Phase 1a+ ou VΣ burst)
- KDE, Cinnamon, Windows
- CI rapport avancement (Phase 0.6 optionnel)

---

## 6. Prochain plan (Phase 2)

GNOME étendu : alma, anduinos, popos — héritage `extends` du catalogue manifeste, une fois le triplet V1 stable.
