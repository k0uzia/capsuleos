# Rapport conformité clone — Linux Mint (VM ↔ CapsuleOS)

**Campagne** : recette intégrale moteur de clonage · **2026-06-08T14:15:00Z**  
**Ground truth** : `capsule@192.168.1.146` · [`linux-mint-vm.json`](linux-mint-vm.json) (`collectedAt: 2026-06-08T14:07:17Z`)  
**Clone** : `http://127.0.0.1:5501/home/Debian/Mint/index.html` · `registryId: linux-mint`

---

## Matrice VM vs clone

| Dimension | Seuil / cible | Résultat | Statut |
|-----------|---------------|----------|--------|
| **P0 — Inventaire VM** | JSON + MD frais | `collect-mint-inventory.mjs --write-doc` | ✅ |
| **P0 — Panel checklist VM** | 6/6 SSH | `run-panel-checklist.mjs --id linux-mint` | ✅ |
| **P1 — Géométrie shell** | maxΔ ≤ 1 px | `measure-mint-shell-geometry.mjs` → **0,7 px** | ✅ |
| **P1 — Panel browser** | 6/6 | `run-capsule-panel-browser.mjs` (:5501) | ✅ |
| **P1 — Parité VM+Capsule** | 6/6 | `compare-os-parity.mjs --capsule-json` | ✅ |
| **P2 — Surfaces UI (8)** | capsuleMatch ok | mainMenu·panel·tray·desktop·clock·theme·**altTab·windowChrome** | ✅ 8/8 |
| **P3 — Apps surface (priorité)** | smoke + ouverture | 8 slots prioritaires + interaction drag/menu | ✅ |
| **P4 — Catalogue Π** | tous slots ≥ 90 | 42 apps mesurées · **0 NON-CONFORME** · Π_global **98** | ✅ |
| **P4 — Menu VM vs clone** | 101 entrées VM | `linux-mint-apps-catalog.json` régénéré (101 VM) | ✅ |
| **P5 — ManΣ pull** | pull = 0 | `report-manifest-drift.mjs` → pull **0** | ✅ |
| **P5 — ManΣ drift refs** | drift documenté | drift **68** (icônes app GTK → chemin `gnome/apps`) | ⚠️ P2 assumé |
| **P5 — Assets clone** | zones + profil | `validate-clone-assets.mjs --id linux-mint` | ✅ |
| **P5 — Paradigme toolkit** | cloisonnement Cinnamon | `validate-toolkit-paradigm.mjs --id linux-mint` | ✅ |
| **P6 — validate-all** | exit 0 | gate complète | ✅ |
| **P6 — Sync vues** | façades + embed | `sync-linux-skin-closure` + `sync-all-views` | ✅ |
| **P6 — CapsuleOnly** | 0 en clôture stricte | `librewriter`, `checklist` (pédagogie — documentés P1) | ⚠️ exception |

---

## Non-conformités résiduelles (documentées)

| ID | Sévérité | Description | Action |
|----|----------|-------------|--------|
| MAN-DRIFT-68 | P2 | 68 entrées ManΣ `rewrite-ref` — icônes apps GTK héritées (`toolkits/gnome/apps`) sur skin Cinnamon | Exception paradigme § apps GNOME upstream ; pull=0 |
| CAPS-ONLY-2 | CapsuleOnly | Slots panel `librewriter`, `checklist` absents VM | Hors clôture VM stricte — pédagogie |
| MENU-CTX-50 | P2 | `mainMenu` dimension ctx Π=50 (menu contextuel apps secondaires) | Non bloquant shell P0 |
| DESKTOP-CTX | P2 | `desktop` ctx Π partiel (comme campagne v2) | Non bloquant |

---

## Captures & métriques

| Artefact | Chemin |
|----------|--------|
| Baseline VM | `root/docs/inventaires/captures/linux-mint/baseline/` |
| Clone baseline | `root/docs/inventaires/captures/linux-mint/clone-baseline/` |
| Métriques shell | `clone-baseline/metrics.json` (menu 600×480, gap 2 px, panel 40 px) |
| Indice parité | [`linux-mint-parity-index.json`](linux-mint-parity-index.json) |

---

## Correctifs appliqués (cette passe)

1. **Lab smokes** : viewport **1280×800** unifié (`mint-smoke-open.mjs`), URL défaut **:5501**.
2. **`smoke-mint-interaction`** : ancrage menu via `#tableau` (évite faux `footer` embarqué), attente `.menu-root` + 300 ms.
3. **`run-ui-state-effects-pass`** : surfaces **altTab** et **windowChrome** implémentées (Π=100).

---

## Références

- Recette : [`../recette-clone-mint-integral.md`](../recette-clone-mint-integral.md)
- État : [`linux-mint-replication-state.json`](linux-mint-replication-state.json)
- Spéc pixel-perfect : [`linux-mint-pixel-perfect-spec.md`](linux-mint-pixel-perfect-spec.md)
