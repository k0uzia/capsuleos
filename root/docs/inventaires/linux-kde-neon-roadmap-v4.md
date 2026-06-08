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

### V4-P1 — Discover + Firefox détail (6–12 h)

**Objectif** : fiches Discover et toolbar Firefox au niveau VM.

- [ ] Captures VM fiche app sans popup MAJ (`dismiss_discover_update_dialog`)
- [x] `discover-neon.js` : layout Kirigami + carrousel screenshots VM
- [x] Assets VLC depuis `vlc.appdata.xml` (prédicats **A/S/T**)
- [ ] Capture VM `vm-discover-detail-vlc.png` régénérée (sans popup)
- [x] Firefox Proton **clair** aligné `vm-firefox.png`
- [x] Inventaire VM toolbar Firefox → matrice écarts
- [ ] `smoke-kde-neon-discover.mjs` + compare visuel Vp classé

**Statut** : 🔄 réouvert (2026-06-08) — clôture prématurée corrigée

```bash
KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/vm-kde-neon-capture-host.sh --discover-detail
node root/tools/lab/capture-capsule-kde-neon.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs
```

**Critère sortie** : fiche VLC navigable avec assets VM · popup absent des captures · Firefox toolbar claire classée Vp.

---

### V4-P2 — Kickoff B2/B3 (10–20 h)

**Objectif** : utilitaires et apps système au-delà des stubs B1.

- [ ] Batch B2 : KCalc, Spectacle, Info-centre, KFind, …
- [ ] Batch B3 : Paramètres système, Sauvegarde, Imprimantes, …
- [ ] Slots CapsuleOS manquants → créer ou stub enrichi (icône + titre VM)
- [ ] `generate-kde-neon-kickoff-data.mjs` + `smoke-kde-neon-kickoff.mjs` (ouverture B2/B3)

**Critère sortie** : kickoff B2/B3 ouverts sans erreur · dataLink ou stub documenté.

---

### V4-P3 — Propagation profonde dérivés (8–14 h)

**Objectif** : porter Dolphin/Discover Neon vers openSUSE, MX-KDE, Debian-KDE.

- [ ] Audit delta post-P4 ([linux-kde-p4-propagation-ecarts.md](linux-kde-p4-propagation-ecarts.md))
- [ ] Propagation ciblée `dolphin-neon.js` overrides par vendor
- [ ] Propagation `discover-neon.js` où applicable
- [ ] Renommer tokens `--opensuse-*` → `--debian-kde-*` (Debian-KDE)
- [ ] `smoke-kde-p4-propagation.mjs` étendu
- [ ] `validate-all` vert sur 4 skins KDE

**Critère sortie** : doc écarts v4 · 4 skins KDE gates verts.

---

### V4-P4 — Clôture Π ≥ 95 % (4–8 h)

**Objectif** : équivalent Mint deep-pass sur les 5 slots panel.

- [ ] `linux-kde-neon-parity-index.json` : Π_global ≥ 95, status ok
- [ ] Interactions JSON à jour (panel, tray, nemo, discover, firefox, terminal)
- [ ] `capture-clone-surfaces --compare` stable
- [ ] Brief + parité v4 clôturés
- [ ] Historique campagnes § v4 dans [linux-kde-neon-roadmap.md](linux-kde-neon-roadmap.md)

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

**V4-P2** — batches kickoff B2/B3 (utilitaires + système).
