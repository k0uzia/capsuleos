# Ground truth KDE Plasma — Linux

> **Pilote** : `linux-kde-neon` · **Amont** : `linux-debian-kde` · **Toolkit** : `kde` / Plasma  
> **Contrat machine** : [`etc/capsuleos/contracts/kde-ground-truth-chain.json`](../../etc/capsuleos/contracts/kde-ground-truth-chain.json)  
> **Effets système** : [`etc/capsuleos/contracts/settings-effects-chain.json`](../../etc/capsuleos/contracts/settings-effects-chain.json) (Phase 2b)

KDE Plasma n'utilise **pas** GNOME Shell ni Cinnamon. CapsuleOS modélise Plasma comme toolkit `kde` distinct ([`paradigme-toolkit-de.md`](paradigme-toolkit-de.md)).

---

## Prédicats Kd* (v15)

| Symbole | Signification | Vérification |
|---------|---------------|--------------|
| **KdI** | Inventaire VM | `linux-kde-neon-vm.json` ou proc/ |
| **KdF** | Inventaire front System Settings | `linux-kde-neon-kde-settings-front-inventory.json` |
| **KdM** | ManΣ assets KDE | `validate-clone-assets.mjs --id linux-kde-neon` |
| **KdC** | Cloisonnement | `validate-toolkit-paradigm.mjs --id linux-kde-neon` |
| **KdS** | Shell Plasma | panel, kickoff, tray, Dolphin |
| **KdSe** | Effets Paramètres | `verify-kde-settings-parity-chain.mjs` (13 effets P0 v15) |
| **KdV** | Parité visuelle | Φ_norm ≥ 90 par shot P0 |
| **KdCred** | Scénarios pédagogiques | `validate-kde-settings-user-scenarios.mjs` |
| **KdΠ** | Parité globale | parity-index registry |
| **KdP4** | Propagation dérivés | debian-kde, mx-kde, openSUSE |
| **KdΣ** | Clôture KDE pilote | KdF ∧ KdC ∧ KdS ∧ KdSe ∧ KdV ∧ KdCred |

---

## Composants noyau / skin

| Composant | Chemin | Gate |
|-----------|--------|------|
| Explorateur | `dolphin` · slot `nemo` | paradigm |
| Panel | `home/Debian/KDE-Neon/style/plasma-panel-dock.css` | skin |
| Menu | `mainMenu-plasma.js` | paradigm |
| Paramètres | slot `themes` + registry `kde-settings-controls-registry.json` | Phase 2b v15 |
| A11y Se | `a11y-overrides.css` | settings-effects-chain |

---

## Commandes v15

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-kde-settings-inventory.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/lab/collect-vm-kde-settings-interaction.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/lab/sync-kde-settings-parity-matrix.mjs --write
node usr/lib/capsuleos/tools/lab/generate-kde-kconfig-bindings.mjs
node usr/lib/capsuleos/tools/lab/map-kde-ground-truth-gaps.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
```

Docs liées : [`procedure-kde-settings.md`](procedure-kde-settings.md) · [`ground-truth-cinnamon.md`](ground-truth-cinnamon.md) (modèle parallèle).
