# Plan dettes techniques et écarts — juin 2026

> Audit du dépôt CapsuleOS · baseline `validate-all` vert · ~52 fichiers équilibrage en attente de commit au moment de l’audit.
>
> Complète le [plan d’équilibrage couches OS](.cursor/plans/équilibrage_couches_os_fba0a4cb.plan.md) (phases 0–7) sans le remplacer.

---

## 1. Synthèse

| Zone | Santé | Dette prioritaire |
|------|-------|-------------------|
| **H₂** (`validate-all`) | Vert | Maintenir après chaque vague |
| **linux-mint** | Gel CredΣ Π=100 | Φ mintinstall P1 non mesuré |
| **linux-rocky** | H6 ✓, SeΣ ✗ | Dérive wallpaper playbook ↔ baseline (.png vs .webp) |
| **linux-ubuntu** | H6 ✓, Vc/Vp ✗ | 0/4 captures P0 malgré clôture H6 |
| **linux-fedora / alma** | H6 ✓, StoreΣ (Fedora) | Alma π=96 ; gaps apps Fedora |
| **linux-kde-neon** | Campagne v15 closed, SeΣ ✓ | KdV 4 shots ; assets theme-previews ¬A |
| **Dérivés KDE** | SeΣ ✓, smoke P6 ✓ | Ground-truth gaps incomplets (opensuse absent) |
| **Squelettes DE** | AccΣ | ¬I, ¬PbT (elementary, kali, lxqt) |
| **Non-Linux** | Z2 Windows/macOS | Hors chaîne pick-os / registry AccΣ |

Tableau de bord machine : [`root/docs/inventaires/dettes-techniques-dashboard-2026-06.json`](inventaires/dettes-techniques-dashboard-2026-06.json)

---

## 2. Dettes par priorité

### P0 — Intégrité formelle

| ID | Symptôme | Action |
|----|----------|--------|
| D-ROCKY-SeΣ | `verify-gnome-settings-parity-chain` échoue (wallpaper) | Aligner playbook/baseline sur URI `.webp` Capsule |
| D-UBUNTU-Vc | H6 ∧ ¬Vc (0 capture P0) | `collect-capsule-visual-investigation` + enrich parity |
| D-COMMIT | Travail équilibrage non versionné | Commit structuré + `sync-all-views` avant push |
| D-Cx | Touch Z1 Se sans preuve cross-régression | `run-cross-regression-gates.mjs --kernel-touch` |

### P1 — Parité visuelle / assets

| ID | Symptôme | Action |
|----|----------|--------|
| D-KDE-KdV | 4 shots KdV < Φ90 | `pull-vm-assets.sh` theme-previews ; re-capture |
| D-ALMA-Π | π=96, 3 gaps clone | Campagne ciblée ou gaps signés |
| D-MINT-INSTALL | mintinstall P1 non mesuré | Captures VM + smoke |
| D-FEDORA-GAPS | contentGaps inventaire apps | Triage via `linux-fedora-slot-gap-delta.json` |

### P2 — Architecture Se

| ID | Symptôme | Action |
|----|----------|--------|
| D-SE-SHELL | Buses livrés ; modules tray/WM locaux | Extraction derrière `se-toolkit-guards` |
| D-Π_se | Phases `2b-v15` vs `closed` | Uniformiser `*-settings-effects-state.json` |
| D-KDE-DERIV-GT | Gaps GT partiels dérivés KDE | Étendre `map-kde-ground-truth-gaps.mjs` |

### P3 — Squelettes

| Registry | Action |
|----------|--------|
| linux-elementary, linux-kali, linux-lxqt | Inventaire VM → `collect-playbook-tail` |
| windows-11, macos-sonoma | Registry + validation AccΣ dédiée |

---

## 3. Vagues d’exécution

### Vague A — Intégrité dépôt (immédiat)

1. Fix D-ROCKY-SeΣ
2. Cross-régression Cx
3. Commit équilibrage + vague A
4. `validate-all` exit 0

**Critères** : Rocky `SeΣ=true` ; Cx vert ; dépôt synchronisé.

### Vague B — GNOME tier (3–5 j)

Ubuntu Vc/Vp → Alma π → Fedora triage P0.

**Critère** : plus de H6 ✓ avec `Vc=false` sans gap documenté.

### Vague C — KDE KdV (3–5 j, VM)

Assets theme-previews → re-capture → clôture ou `contentGaps` signés.

### Vague D — Longue traîne

Se-Shell/WM · squelettes DE · non-Linux · stubs cosmic/android.

---

## 4. Anti-régression

- Pas de fusion gabarits Paramètres inter-toolkits
- Pas de régression Mint/Rocky pour accélérer KDE/Ubuntu
- ¬A → `pull-vm-assets.sh` (pas d’asset « proche »)
- Pas de patch skin sans inventaire VM (R-INV1)
- Mint : Cx obligatoire sur tout touch Z1

---

## 5. Indicateurs de suivi

| Indicateur | Source | Cible |
|------------|--------|-------|
| H₂ | `validate-all.mjs` | 0 |
| SeΣ | `*-settings-effects-state.json` | `phase: closed` |
| H6 ∧ Vc | `*-replication-state.json` | cohérent |
| KdV | `linux-kde-neon-replication-state.json` | 0 résiduel ou gaps signés |
| CredΣ Mint | `linux-mint-replication-state.json` | maintenu |
| Cx | `run-cross-regression-gates.mjs` | vert post-Z1 |

---

## Références

- [`root/docs/logique-formelle.md`](logique-formelle.md)
- [`root/docs/agent-validation-discipline.md`](agent-validation-discipline.md)
- [`root/docs/procedure-kde-settings.md`](procedure-kde-settings.md)
- [`root/docs/procedure-accueil-os-scaffold.md`](procedure-accueil-os-scaffold.md)
