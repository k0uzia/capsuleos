# Procédure — réplication formelle applications (tous vendors)

> **Statut** : extension de [procedure-apps-catalog.md](procedure-apps-catalog.md) · **Modèle** : [procedure-replication-formelle.md](procedure-replication-formelle.md) (gsettings)  
> Contrat : `etc/capsuleos/contracts/apps-replication-chain.json`  
> Cohérence : `etc/capsuleos/contracts/os-reproduction-coherence.json` · [convention-reproduction-parfaite.md](convention-reproduction-parfaite.md)

**Principe** : la fidélité **gsettings** (structure → Playwright façade OS → VM → captures classées) devient le **patron** pour chaque application du catalogue. La **grille d'argumentation** (5 dimensions) et les **contentGaps** s'appliquent avant toute implémentation H5 (C3, C6).

---

## 1. Chaîne des prédicats

| Étape | Symbole | Signification | Gate |
|-------|---------|---------------|------|
| 1 | **AppV** | Inventaire VM apps | `*-vm-apps-installed.json` |
| 2 | **AppC** | Catalogue strict | `generate-apps-catalog` + `smoke-apps-catalog` |
| 3 | **AppP0** | Apps P0 `ok` | `summary.p0Gaps === 0` |
| 4 | **AppL** | Lab apps vert | **`run-apps-lab.mjs`** |
| 5 | **AppVv** | Enquête visuelle VM apps P0 | `*-apps-visual-investigation.json` |
| 6 | **AppVc** | Captures Capsule par slot | `capsuleCapturesP0 ≥ 1` |
| 7 | **AppVp** | Parité visuelle classée | `visualMatchClassifiedP0 ≥ 1` |
| 8 | **AppΣ** | Clôture structurelle | **AppV ∧ AppC ∧ AppP0 ∧ AppL** |

**AppVp** (parité pixel / comportement fine) est l’objectif long terme ; **AppΣ** structurel autorise la maintenance `validate-all` post-H6.

```mermaid
flowchart LR
  AppV[AppV VM] --> AppC[AppC catalogue]
  AppC --> AppP0[AppP0 gaps=0]
  AppP0 --> AppL[AppL run-apps-lab]
  AppL --> AppVv[AppVv VM]
  AppVv --> AppVc[AppVc Capsule]
  AppVc --> AppVp[AppVp classement]
```

---

## 2. Couches de smoke (miroir gsettings)

| Couche | gsettings (référence) | Applications |
|--------|----------------------|--------------|
| **Structure** | smoke-playbook, smoke-mappers, verify-parity-chain | `smoke-apps-catalog`, `smoke-apps-matrix`, `smoke-apps-interaction-playbook`, `smoke-apps-snapshot`, `smoke-visual-fidelity`, `validate-os-facade-fidelity` |
| **Runtime** | smoke-interactions, smoke-gsettings-snapshot | `smoke-apps-interactions`, `smoke-apps-snapshot`, `smoke-os-facade-rocky`, `smoke-gnome-nautilus-routing`, `smoke-rocky-overview-search-icons`, `smoke-window-resize-left` |
| **Shell** | smoke-h5-p0/p1 (effets Paramètres) | `smoke-rocky-gnome-ref`, `smoke-rocky-shell-polish*` |
| **VM** | collect playbook / visual VM | `collect-vm-apps-inventory --ssh`, `collect-vm-apps-visual-investigation` |
| **Visuel** | collect-capsule-visual, enrich-parity | `collect-capsule-apps-visual-investigation`, `enrich-apps-visual-investigation-parity` |

**URL canonique** : `resolveCapsuleOsUrl(registryId)` — jamais `home/.../index.html` en Playwright.

---

## 3. Orchestrateurs

```bash
# Gate AppL (structure)
node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id linux-rocky

# + runtime Playwright
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id linux-rocky --playwright

# Chaîne visuelle AppVv → AppVp
node usr/lib/capsuleos/tools/lab/run-apps-replication-chain.mjs --id linux-rocky --dry-run
node usr/lib/capsuleos/tools/lab/run-apps-replication-chain.mjs --id linux-rocky --auto
```

Paramètres GNOME restent sous **`run-gnome-settings-lab.mjs`** — ne pas fusionner les domaines.

---

## 4. Inventaires

```
root/docs/inventaires/<id>-apps-catalog.json
root/docs/inventaires/<id>-apps-lab-state.json
root/docs/inventaires/<id>-apps-visual-investigation.json
root/docs/inventaires/<id>-apps-replication-state.json
root/docs/inventaires/captures/<id>/apps-visual/
root/docs/inventaires/captures/<id>/apps-visual-capsule/
```

---

## 5. Règles formelles (complément)

```
R-APP-LAB   AppP0 ∧ ¬AppL  →  run-apps-lab.mjs (gate AppL)
R-APP-VV    AppL ∧ ¬AppVv  →  collect-vm-apps-visual-investigation --filter P0
R-APP-VC    AppVv ∧ ¬AppVc →  collect-capsule-apps-visual-investigation
R-APP-VP    AppVc ∧ ¬AppVp →  enrich-apps-visual-investigation-parity
```

---

## 6. Anti-patterns

1. Smoke app isolé sans passage par `run-apps-lab` (pas de gate AppL).
2. Playwright sur `home/` au lieu de la façade `/OS/`.
3. `statut: ok` catalogue sans template/skin/embed vérifié (`smoke-apps-matrix`).
4. Confondre **AppΣ** (structure) et **AppVp** (parité visuelle complète).
