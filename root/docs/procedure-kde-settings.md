# Procédure — Paramètres KDE Plasma

> **Pilote** : `linux-kde-neon` · **Slots** : `themes`, `kinfocenter`  
> **Contrats** : [`kde-ground-truth-chain.json`](../../etc/capsuleos/contracts/kde-ground-truth-chain.json) · [`kde-settings-controls-registry.json`](../../tools/lab/kde-settings-controls-registry.json)  
> **Statut** : v15 — front intégral, registry option-par-option, seuil Φ_norm 90

---

## Architecture (slot `themes`)

```text
systemsettings_kde_neon.html (gabarit unifié v15)
  ├─ surface hub   [data-kde-settings-surface="hub"] — 10+ catégories
  └─ surfaces KCM  [data-kde-settings-surface="kcm-*"]
       kcm-display · kcm-colors · kcm-keys · kcm-lookandfeel

kde-systemsettings-nav.js → prepareShot(shotId) — 10 investigations P0
kde-settings-parity.js + kde-kconfig-bindings.js → bus capsule:*
```

Registre canon : [`kde-settings-controls-registry.json`](../../tools/lab/kde-settings-controls-registry.json)

---

## Campagne v15 — séquence

```bash
node usr/lib/capsuleos/tools/lab/reset-kde-neon-campaign.mjs --write --campaign v15-kde-settings-full-front
node usr/lib/capsuleos/tools/lab/collect-vm-kde-settings-inventory.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/lab/collect-vm-kde-settings-interaction.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/lab/sync-kde-settings-parity-matrix.mjs --write
node usr/lib/capsuleos/tools/lab/generate-kde-kconfig-bindings.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:8766 node usr/lib/capsuleos/tools/lab/run-kde-settings-lab.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
```

---

## Captures par shot (P0)

| shotId | VM | Capsule (`prepareShot`) |
|--------|-----|-------------------------|
| `kcm-display-config` | `systemsettings kcm_kscreen` | `kcm-display` |
| `hub-sidebar` | `gtk-launch systemsettings.desktop` | hub |
| `appearance-panel` | `systemsettings kcm_lookandfeel` | `kcm-lookandfeel` |
| `accessibility-panel` | `systemsettings kcm_access` | hub + accessibilité |
| `desktop-panel` | `systemsettings kcm_desktoptheme` | hub + bureau |
| `workspace-panel` | `systemsettings kcm_workspace` | hub + espace de travail |
| `notifications-panel` | `systemsettings kcm_notifications` | hub + notifications |
| `applications-panel` | `systemsettings kcm_componentchooser` | hub + applications |
| `colors-panel` | `systemsettings kcm_colors` | `kcm-colors` |
| `about-panel` | `systemsettings kcm_about-distro` | hub + à propos |

Seuil clôture visuelle : **Φ_norm ≥ 90** (`kde-settings-controls-registry.json` · `phiThreshold`).

---

## Gates KdΣ v15

```bash
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/lab/smoke-kde-settings-front-inventory.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/validate-kde-settings-user-scenarios.mjs
node usr/lib/capsuleos/tools/lab/map-kde-ground-truth-gaps.mjs --id linux-kde-neon --write
```

---

## Propagation

| Dérivé | Héritage |
|--------|----------|
| `linux-debian-kde` | upstream neon |
| `linux-mx-kde` | upstream debian-kde |
| `linux-opensuse` | matrices vendor si GapΔ |

Smoke : `smoke-kde-v15-propagation.mjs`
