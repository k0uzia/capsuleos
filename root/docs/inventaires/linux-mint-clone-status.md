# Statut clone — linux-mint (référence gold)

Procédure : [`procedure-clonage-os-depuis-vm.md`](../procedure-clonage-os-depuis-vm.md) · Checklist : [`templates/clone-os-checklist.md`](../templates/clone-os-checklist.md)

**registryId** : `linux-mint` · **vendor** : `mint` · **toolkit** : `cinnamon` · **Dernière campagne** : 2026-06-04

---

## Phase 0 — Prérequis

- [x] VM accessible en SSH (`lab-inventory.json` local)
- [x] `validate-all.mjs` baseline vert
- [x] `print-agent-brief.mjs linux-mint` disponible

## Phase 1 — Discovery

- [x] `linux-mint-vm.json` versionné
- [x] `inventaire-parite-mint-vm.md` enrichi (apps, FS, backlog)

## Phase 2 — Catalogue

- [x] `os-registry` + profil + skin `home/Debian/Mint/`
- [x] Façade `OS/linux/.../mint/` avec `<base href>`
- [x] `profile-data.js` 22.3 Zena + `stackLine` composants

## Phase 3 — Assets

- [x] `vendors/mint/panel/` (Mint-Y 48px)
- [x] `default_background.jpg`
- [x] Tray xapp-status, cornerbar, printers, keyboard, power

## Phase 4 — Shell / panel

- [x] Noyau panel partagé (running-link, window-list)
- [x] Effets `cinnamon-window-effects` (180ms)
- [x] `compare-os-parity` VM : étapes 1 et 4 = **P1 lab** (Firefox multi-fenêtres, minimize Cinnamon) — documenté
- [x] `run-capsule-panel-browser` CapsuleOS **6/6**

## Phase 5 — Applications

- [x] Favoris bureau VM (Calculator, Calendar, xed, Logithèque, Paramètres)
- [x] `text_editor` + menu raccourci xed
- [x] `librewriter` / `checklist` = CapsuleOnly

## Phase 6 — FS pédagogique

- [x] Nemo sidebar Documents (comparateur P0)
- [x] Section FS documentée dans rapport parité

## Phase 7 — Clôture

- [x] `collect-mint-inventory.mjs --write-doc` final
- [x] `validate-all.mjs` vert post-patch
- [x] `briefs/linux-mint.md` (généré `--write`)

---

## Écarts P1 assumés (modèle pour autres OS)

- Lanceurs fixes vs `grouped-window-list`
- Calculatrice → terminal
- Lab VM Firefox focus fragile

## Prochain OS suggéré

Fedora KDE ou Ubuntu GNOME — même phases, inventaire manuel annexe B.
