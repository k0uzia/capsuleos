# Statut clone — linux-kde-neon (campagne v2 réouverte)

Procédure : [`procedure-clonage-os-depuis-vm.md`](../procedure-clonage-os-depuis-vm.md) · Discipline gates : [`agent-validation-discipline.md`](../agent-validation-discipline.md)

**registryId** : `linux-kde-neon` · **vendor** : `neon` · **toolkit** : `kde` / Plasma  
**Campagne** : **v2 réouverture post-merge** (2026-06-08) — état formel : [`linux-kde-neon-replication-state.json`](linux-kde-neon-replication-state.json)

**Ground truth** : [`linux-kde-neon-vm.json`](linux-kde-neon-vm.json) · [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)

> Les clôtures juin 2026 (Discover, Kickoff, panel, Dolphin P0 structurel) restent **documentées** mais sont **réouvertes** pour re-audit conventions Mint v2 + merge upstream.

---

## Phase 0 — Baseline post-merge

- [x] Merge `n0r3f/main` intégré (Mint v2, CI, agent-validation-discipline)
- [x] Correctifs régression HTTP (Mint `fileExplorerInfo` doublon, `bindFileExplorerInlineRename`, cinnamon-settings icônes)
- [x] Fix ES6 strict `dolphin-neon.js` (suppression `?.`)
- [x] `sync-all-views.mjs` + `validate-all.mjs` exit 0 (2026-06-08)
- [x] `capture-clone-surfaces.mjs --id linux-kde-neon --write-baseline` (2026-06-08)
- [x] `capture-clone-surfaces.mjs --id linux-kde-neon --compare` (stable — horloge figée 2026-06-08)

## Phase 1 — Réouverture documentaire

- [x] `linux-kde-neon-replication-state.json` (campagne v2)
- [x] Cette checklist + réouverture [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)
- [x] [`linux-kde-neon-dolphin-diff.md`](linux-kde-neon-dolphin-diff.md) — points 7–9 (interactionnel)
- [x] `interactions/linux-kde-neon/*.json` (nemo, firefox, update_manager)
- [ ] `linux-kde-neon-parity-index.json` (indice Π — optionnel P1)

## Phase 2 — Shell (réaudit)

| Zone | Clôture v1 | Statut v2 | Action |
|------|------------|-----------|--------|
| Panel + pins | 2026-06-06 | 🔄 réaudit | capture baseline + compare |
| Kickoff | 2026-06-06 | ✅ tokens | `--opensuse-*` → `--kde-neon-*` (2026-06-08) |
| Tray + popovers | 2026-06-06 | 🔄 réaudit | contenu dynamique P2 |
| Calendrier / volume | 2026-06-06 | 🔄 réaudit | smoke HTTP |

## Phase 3 — Discover (réaudit)

| Zone | Clôture v1 | Statut v2 | Action |
|------|------------|-----------|--------|
| 5 onglets Kirigami | 2026-06-06 | 🔄 réaudit | captures post-merge |
| Catalogue + icônes | 2026-06-06 | ✅ | revalider chemins `./assets/` |
| Filtres / fiches app | — | ⏳ P2 | backlog |

## Phase 4 — Dolphin (réaudit + interactionnel)

| Zone | Clôture v1 | Statut v2 | Action |
|------|------------|-----------|--------|
| Toolbar / vues / split | 2026-06-07 | 🔄 réaudit | captures VM ↔ Capsule |
| Barre recherche + filtre | — | 🟡 captures | paires VM/Capsule 2026-06-08 |
| Menu hamburger + flyouts | — | 🟡 captures | paires VM/Capsule 2026-06-08 |
| Menu contextuel P2 | — | ⏳ | flyouts, dupliquer, étiquettes |
| Périphériques sidebar | P2 | ⏳ | VM inventaire |

## Phase 5 — P1 ouvert

- [x] **Firefox** — skin Proton/KDE + smoke (`smoke-kde-neon-firefox.mjs`) ✅ 2026-06-08
- [ ] **Firefox** — inventaire VM détaillé + compare 04-firefox stable
- [ ] **Konsole** — polish terminal-konsole-chrome
- [ ] Convention assets : audit `resolveCapsuleResourceUrl` sur tout le skin

## Phase 6 — Clôture H₆ ✅ (2026-06-08)

- [x] `sync-linux-skin-closure.mjs`
- [x] `validate-all.mjs` exit 0
- [x] `capture-clone-surfaces --compare` (3 runs stables)
- [x] `smoke-kde-neon-firefox.mjs` exit 0
- [x] Brief agent [`linux-kde-neon.md`](../briefs/linux-kde-neon.md)

**Backlog P2** (hors clôture) : menu contextuel Dolphin §9, tray dynamique, audit assets CSS, Konsole polish.

---

## Commandes lab (rappel)

```bash
# Baseline Capsule
python3 -m http.server 5500 --bind 127.0.0.1
node root/tools/lab/capture-capsule-kde-neon.mjs

# VM
bash root/tools/lab/vm-kde-neon-capture-host.sh
bash root/tools/lab/vm-kde-neon-capture-host.sh --dolphin-hamburger

# Gates ciblées skin
node usr/lib/capsuleos/tools/print-validation-plan.mjs home/Debian/KDE-Neon/
```
