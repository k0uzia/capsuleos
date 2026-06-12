# Ground truth KDE Plasma — Linux

> **Pilote** : `linux-kde-neon` · **Amont** : `linux-debian-kde` · **Toolkit** : `kde` / Plasma  
> **Contrat machine** : [`etc/capsuleos/contracts/kde-ground-truth-chain.json`](../../etc/capsuleos/contracts/kde-ground-truth-chain.json)  
> **Effets système** : [`etc/capsuleos/contracts/settings-effects-chain.json`](../../etc/capsuleos/contracts/settings-effects-chain.json) (Phase 2b)

KDE Plasma n'utilise **pas** GNOME Shell ni Cinnamon. CapsuleOS modélise Plasma comme toolkit `kde` distinct ([`paradigme-toolkit-de.md`](paradigme-toolkit-de.md)).

---

## Prédicats Kd*

| Symbole | Signification | Vérification |
|---------|---------------|--------------|
| **KdI** | Inventaire VM | `linux-kde-neon-vm.json` ou proc/ |
| **KdM** | ManΣ assets | `validate-clone-assets.mjs --id linux-kde-neon` |
| **KdC** | Cloisonnement | `validate-toolkit-paradigm.mjs --id linux-kde-neon` |
| **KdS** | Shell Plasma | panel, kickoff, tray, Dolphin |
| **KdSe** | Effets Paramètres | `verify-kde-settings-parity-chain.mjs` (Phase 2b) |
| **KdΠ** | Parité globale | parity-index registry |
| **KdP4** | Propagation dérivés | mx-kde, debian-kde, openSUSE |
| **KdΣ** | Clôture KDE pilote | KdI ∧ KdC ∧ KdS ∧ (KdSe ∨ accepted) |

---

## Composants noyau / skin

| Composant | Chemin | Gate |
|-----------|--------|------|
| Explorateur | `dolphin` · slot `nemo` | paradigm |
| Panel | `home/Debian/KDE-Neon/style/plasma-panel-dock.css` | skin |
| Menu | `mainMenu-plasma.js` | paradigm |
| Paramètres | slot `themes` + `kinfocenter` | Phase 2b `kde-settings-parity.js` |
| A11y Se | `a11y-overrides.css` | settings-effects-chain |

---

## Commandes

```bash
node usr/lib/capsuleos/tools/lab/map-kde-ground-truth-gaps.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-kde-neon
```

Docs liées : [`procedure-kde-settings.md`](procedure-kde-settings.md) · [`ground-truth-cinnamon.md`](ground-truth-cinnamon.md) (modèle parallèle).
