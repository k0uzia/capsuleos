# Roadmap Discover VM — réalisme 100 % · `linux-kde-neon`

> **Campagne** : `discover-vm-kde-neon` · VM lab `goupil@192.168.123.52` · virsh `KDE-Neon`  
> **Orchestrateur VM** : `vm-kde-neon-capture-host.sh --discover-vm-100`

## Objectif

Atteindre **Π Discover = 100** ancré sur la VM Plasma Discover 6.6.5 : paires capture VM↔Capsule, onglets complets, fiche VLC, recherche filtrante.

## Phases

| # | Phase | Livrable | Gate |
|---|-------|----------|------|
| V1 | Captures VM | `vm-discover*.png` (5 onglets + detail VLC) | `--discover-vm-100` |
| V2 | Paires Capsule | `capsule-discover*.png` alignées | `capture-capsule-kde-neon.mjs` |
| V3 | Recherche | filtre accueil + installé | `smoke-kde-neon-discover.mjs` |
| V4 | Clôture | smoke paires + parity-index 100 | `smoke-discover-vm-parity.mjs` |

## Extension Capsule (hors VM)

La section **« À découvrir »** (catalogue magasin CapsuleOS) n’existe pas sur la VM réelle — documentée comme surcouche produit (`discover-store-kde-neon`), sans pénalité Π VM.

## Assets icônes Installé(s)

| Outil | Rôle |
|-------|------|
| `pull-kde-neon-discover-icons.sh` | Pull VM → `vendors/neon/discover/` (R-A1) |
| `smoke-discover-neon-icons.mjs` | Gate **S** — SHA256 VM ↔ dépôt |

```bash
KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/pull-kde-neon-discover-icons.sh
node usr/lib/capsuleos/tools/lab/smoke-discover-neon-icons.mjs
```

## Recette

```bash
KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/vm-kde-neon-capture-host.sh --discover-vm-100
python3 -m http.server 5500 --bind 127.0.0.1
node root/tools/lab/capture-capsule-kde-neon.mjs
node usr/lib/capsuleos/tools/lab/smoke-discover-vm-parity.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs
```

## État (2026-06-11)

| Phase | Statut |
|-------|--------|
| V1 | ✅ captures VM rafraîchies (5 onglets + VLC) |
| V2 | ✅ paires `screen_KDE-Neon/` présentes |
| V3 | ✅ recherche filtrante |
| V4 | ✅ `smoke-discover-vm-parity` · Π Discover 100 |

## Références

- [`linux-kde-neon-discover-closure.md`](linux-kde-neon-discover-closure.md)
- [`linux-kde-neon-discover-detail-diff.md`](linux-kde-neon-discover-detail-diff.md)
- [`linux-kde-neon-roadmap-discover-store.md`](linux-kde-neon-roadmap-discover-store.md)
