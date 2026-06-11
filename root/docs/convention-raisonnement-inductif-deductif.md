# Convention — raisonnement inductif et déductif (campagnes OS)

> **Complète** : [fondements-philosophiques.md](fondements-philosophiques.md) §3 · [convention-reproduction-parfaite.md](convention-reproduction-parfaite.md) · [logique-formelle.md](logique-formelle.md) §2.15  
> **Contrat** : `etc/capsuleos/contracts/os-reproduction-coherence.json`

CapsuleOS articule deux mouvements complémentaires pour atteindre des reproductions parfaites — sans ajouter une 4ᵉ couche « meta-meta » (limite plan maître §3).

---

## 1. Induction opérationnelle (amont)

**Mouvement** : cas concrets → **SlotMap(VM, dépôt)** → **GapΔ** → patterns → hypothèses architecture.

| Étape | Action | Artefacts |
|-------|--------|-----------|
| I1 Observer | VM SSH, inventaire apps installées | `*-vm-apps-installed.json` |
| I1b SlotMap | Croiser VM avec slots/contrats existants | `slots-manifest`, `apps-catalog` |
| I2 GapΔ | Ne retenir que les écarts explicites | `contentGaps[]` ouverts, `p0Gaps` |
| I3 Classer | Grille 5 dimensions sur GapΔ seulement | `contentGaps[]` |
| I4 Généraliser | Patterns récurrents (ex. contrat sans runtime) | audits, hypothèses H1–H6 |
| I5 Hypothétiser | Proposition architecture testable | décisions dans audit processus |

**Rang épistémique** (fondements §3.1) : **R** (référent VM) prime sur doc officielle ; **M** (modèle `proc/` + inventaires) prime sur **E** (expérience DOM).

**Règles inductives** :

- **R-INV1** : pas de patch skin sans inventaire **I**
- **C1 VM prime** : baseline depuis VM ou contrat ground explicite
- **C6 écart explicite** : tout partial/gap documenté — pas de silence sur P0

---

## 2. Déduction opérationnelle (aval)

**Mouvement** : prédicats vérifiés → règle unique → action R-AUTO ou blocage.

| Étape | Action | Artefacts |
|-------|--------|-----------|
| D1 Prémices | M, I, H₂, V… | `*-formal-state.json` |
| D2 Inférer | Règles D-*, R-* (première admissible) | `resolve-agent-action` |
| D3 Exécuter | Commande unique si `autoExecute` | logs campagne |
| D4 Clôturer | OsΣ-slot, OsΣ-registry | gates, validate-all |

**Inférences interdites** (déductives) :

- AppVp sans AppVc
- StoreVp sans StoreVc
- Implémentation H5 sous ¬H₂ (R-IMP1)
- Fallback artefact vendor d′ ≠ d (R-LOC1)

---

## 3. Falsification (Peirce)

Une hypothèse d'architecture est **rejetée** si un gate ciblé échoue après implémentation.

| Hypothèse | Test falsifiable |
|-----------|------------------|
| H1 Contrat = runtime | `validate-os-reproduction-coherence.mjs` (steps ↔ scripts) |
| H2 Ordre pipeline = formal | `resolve-agent-action --scope pipeline` vs `--scope formal` même registryId |
| H3 campaignPhases actives | `run-store-replication-chain.mjs --dry-run` liste phases filtrées |
| H4 Store branché | StoreG vrai après `run-store-replication-chain` |
| H5 État éphémère | absence `*-resolve.json` versionnés |
| H6 AppΣ / AppVp séparés | couche `apps` (AppΣ) complétable avant H6 ; `apps-parity` après H6 |

---

## 4. Boucle campagne (CR-0…CR-6)

```text
Induction :  VM observe → inventaire → contentGaps (grille)
Déduction :  H₂ → StoreG → StoreVc → StoreVp
Falsification : validate-all + smokes slot
```

Phases CR (contrat OsRepro) — filtrées par `campaignPhases` **puis** par `differentialCampaign.skipWhen` (C9) via `differential-campaign-lib.mjs` :

**Ne pas** lancer CR-2 (enquête VM complète) si P0 déjà documenté sans gap ouvert — corriger uniquement le delta.

| Phase | Prédicat produit | Registry pilote |
|-------|------------------|-------------------|
| CR-0 | H₂ | tous |
| CR-1 | AppV | linux-fedora (ground) |
| CR-2 | AppVv | linux-fedora |
| CR-3 | contentSpec | dérivés + pilote |
| CR-4 | StoreG | linux-fedora |
| CR-5 | StoreVc | tous GNOME store |
| CR-6 | StoreVp | tous GNOME store |

---

## 5. Usage agent

1. **Avant H5** : induction — inventaire VM, grille, contentGaps
2. **Décision** : `resolve-agent-action.mjs --scope pipeline` (une entrée)
3. **Après patch** : déduction — gates zone touchée, pas `validate-all` sur typo doc seule
4. **Clôture** : falsification — H₂ vert, prédicats aval documentés

Références audit juin 2026 : [audit-structure-depot-2026-06.md](audit-structure-depot-2026-06.md) · [audit-processus-campagnes-2026-06.md](audit-processus-campagnes-2026-06.md).
