# Procédure — Paramètres KDE Plasma

> **Pilote** : `linux-kde-neon` · **Slots** : `themes`, `kinfocenter`  
> **Contrats** : [`kde-ground-truth-chain.json`](../../etc/capsuleos/contracts/kde-ground-truth-chain.json) · [`settings-effects-chain.json`](../../etc/capsuleos/contracts/settings-effects-chain.json)  
> **Statut** : Phase 2b — matrice et `kde-settings-parity.js` à implémenter

---

## Cible Phase 2b

```text
UI Paramètres KDE
  → kde-settings-parity.js (EFFECT_HANDLERS)
  → kde-kconfig-store.js
  → CustomEvent capsule:* (mêmes noms Se-A11y que Cinnamon/GNOME)
  → consommateurs Plasma (panel, kickoff, Dolphin)
```

---

## Gates (après implémentation)

```bash
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/lab/map-kde-ground-truth-gaps.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-kde-neon
```

---

## Propagation

| Dérivé | Héritage |
|--------|----------|
| `linux-debian-kde` | upstream neon |
| `linux-mx-kde` | upstream debian-kde |
| `linux-opensuse` | matrices vendor si GapΔ |

Voir [`ground-truth-kde.md`](ground-truth-kde.md).
