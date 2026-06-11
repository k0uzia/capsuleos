# Roadmap v4 — linux-kde-neon (profondeur Plasma)

> **Suite** de la campagne v3 clôturée P5 (2026-06-08) · Référence Plasma **P1** active.  
> Écarts résiduels : [linux-kde-neon-vp-residual.md](linux-kde-neon-vp-residual.md)

| Métadonnée | Valeur |
|------------|--------|
| **registryId** | `linux-kde-neon` |
| **Tier** | P1 (maintenu) |
| **Maturité actuelle** | ~91 % (Π v3) → cible **≥ 95 %** |
| **VM lab** | `goupil@192.168.123.52` · virsh `KDE-Neon` |
| **État machine** | [linux-kde-neon-replication-state.json](linux-kde-neon-replication-state.json) |

---

## Objectif v4

Combler les écarts **P0/P1** laissés en backlog v3 et pousser la parité interactionnelle vers le niveau Mint (~98 % Π).

---

## Palliers

### V4-P0 — Dolphin profond (8–16 h)

**Objectif** : clôturer §3 Périphériques + §6 sélection split.

- [x] Inventaire VM section Périphériques (`vm-kde-neon-inventory.sh`) — `/media` vide
- [x] UI sidebar Périphériques (empty-state Neon)
- [x] Sélection indépendante volet droit en mode Scinder (`paneSelection` noyau)
- [x] Captures VM ↔ Capsule paires
- [x] `smoke-kde-neon-dolphin.mjs` étendu (split selection + périphériques)
- [x] Mise à jour [linux-kde-neon-dolphin-diff.md](linux-kde-neon-dolphin-diff.md) §3 + §6 → ✅

**Clôturé** : 2026-06-08 · suite → **V4-P1** Discover fiches

```bash
KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/vm-kde-neon-capture-host.sh --dolphin-split
node root/tools/lab/capture-capsule-kde-neon.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-dolphin.mjs
```

**Critère sortie** : aucun écart P0 Dolphin · diff §3/§6 clôturés. ✅

---

### V4-P1 — Discover + Firefox détail (6–12 h) ✅

**Objectif** : fiches Discover et toolbar Firefox au niveau VM.

**Handoff** : [linux-kde-neon-v4-p1-handoff.md](linux-kde-neon-v4-p1-handoff.md)

- [x] Layout Kirigami fiche VLC + assets VideoLAN (A/S/T)
- [x] Dismiss popup MAJ (KWin) · captures VM/Capsule paires
- [x] Firefox Proton clair · baseline `04-firefox` régénérée
- [x] `07-discover-detail-vlc` ajouté aux scénarios capture
- [x] `capture-clone-surfaces --compare` OK (2026-06-09)

**Clôturé** : 2026-06-09 · suite → **V4-P2**

---

### V4-P2 — Kickoff B2/B3 (10–20 h) ✅

**Objectif** : utilitaires et apps système avec surfaces dédiées (pas seulement `profile`).

**Audit** : [linux-kde-neon-v4-p2-kickoff-audit.md](linux-kde-neon-v4-p2-kickoff-audit.md)

- [x] Smoke structurel 30/30 (`smoke-kde-neon-kickoff.mjs`)
- [x] Spectacle → slot dédié (`spectacle_kde_neon.html` + override profil)
- [x] Info-centre (kinfocenter) → slot dédié (`kinfocenter_kde_neon.html`)
- [x] System Monitor → slot dédié (`system_monitor.skin.css` tokens Breeze)
- [ ] KDEConnect → stub UI (backlog — reste `profile`)
- [x] Smoke étendu (`smoke-kde-neon-v4-p2.mjs` — runtime Playwright OK)

**Clôturé** : 2026-06-09 · suite → **V4-P3**

**Critère sortie** : apps B2/B3 prioritaires ouvrent un slot documenté · smoke étendu vert. ✅

---

### V4-P3 — Propagation profonde dérivés (8–14 h) ✅

**Objectif** : porter Dolphin/Discover Neon vers openSUSE, MX-KDE, Debian-KDE.

- [x] Audit delta post-P4 ([linux-kde-p4-propagation-ecarts.md](linux-kde-p4-propagation-ecarts.md))
- [x] `dolphin-kde-chrome.js` partagé (`usr/lib`) · 4 skins KDE
- [x] `discover-kde.js` partagé — **pivot Neon** ; dérivés conservent `update_manager_kde.html`
- [x] Tokens `--debian-kde-*` + alias legacy (Debian-KDE)
- [x] `smoke-kde-v4-p3-propagation.mjs` + extension `smoke-kde-p4-propagation.mjs`
- [x] `validate-all` vert sur 4 skins KDE

**Clôturé** : 2026-06-09 · suite → **V4-P4**

```bash
node usr/lib/capsuleos/tools/lab/smoke-kde-v4-p3-propagation.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-p4-propagation.mjs
```

**Critère sortie** : doc écarts v4 · 4 skins KDE gates verts. ✅

---

### V4-P4 — Clôture Π ≥ 95 % (4–8 h) ✅

**Objectif** : équivalent Mint deep-pass sur les 5 slots panel.

- [x] `linux-kde-neon-parity-index.json` : Π_global **95**, status ok
- [x] Interactions JSON à jour (+ `tray.json`, panel/mainMenu v4)
- [x] Stub **KDEConnect** (`kdeconnect_kde_neon.html` + kickoff ×3)
- [x] `smoke-kde-neon-v4-p4.mjs` vert
- [x] `validate-all` vert
- [x] `capture-clone-surfaces --compare` stable (fix `discover-kde.js` globalThis)
- [ ] Historique campagnes § v4 dans [linux-kde-neon-roadmap.md](linux-kde-neon-roadmap.md)

**Clôturé** : 2026-06-09 · campagne v4-deep-parity prête merge

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare
```

---

## Gates transverses (chaque pallier)

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## Prochaine action immédiate

**V4-P2** — Spectacle + Info-centre : [linux-kde-neon-v4-p2-kickoff-audit.md](linux-kde-neon-v4-p2-kickoff-audit.md)
