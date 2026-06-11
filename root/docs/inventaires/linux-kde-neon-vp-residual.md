# Écarts visuels résiduels (Vp) — KDE neon post-v3

> Classés pour clôture P5 · Campagne **v4** = traiter les **P0** et remonter **Π ≥ 95**.

| Priorité | Surface | Écart | Fichier / slot | Pallier v4 |
|----------|---------|-------|----------------|------------|
| **P0** | Dolphin | Sélection indépendante volet droit (split) | `dolphin-neon.js` §6 | ✅ v4 |
| **P0** | Dolphin | Section Périphériques sidebar (empty-state) | `dolphin-neon.js` §3 | ✅ v4 |
| **P1** | Discover | Fiche VLC Kirigami + assets + compare | `discover-neon.js` | ✅ v4 |
| **P1** | Firefox | Proton clair + baseline régénérée | `firefox.skin.css` | ✅ v4 |
| **P1** | Kickoff | Batches B2/B3 surfaces dédiées (Spectacle, Info-centre, Moniteur) | `spectacle_kde_neon.html`, `kinfocenter_kde_neon.html`, `system_monitor` | ✅ v4 |
| **P2** | Kickoff | KDEConnect (×3) → stub dédié | `kdeconnect_kde_neon.html` | ✅ v4 P4 |
| **P2** | Tray | Polish calendrier (smoke dédié) | `calendar-popover-kde.js` | ✅ v7 |
| **P2** | Dolphin | Menu contextuel flyouts + icônes KDE | `dolphin-kde-chrome.js` §ctx | ✅ pass Neon |
| **P2** | Kickoff | Konversation | — | **hors VM** (desktop absent juin 2026) |
| **P2** | Dérivés | Discover Kirigami full sur dérivés | openSUSE, MX, Debian | ✅ v6 P1 |
| **P2** | Dérivés | Baselines captures Capsule | `capture-derived-kde-baselines.mjs` | ✅ v7 |
| **P2** | Debian-KDE | Icônes Firefox `toolkits/gnome/apps` (fuite) | `index.html`, kickoff | ✅ v6 P0 |

## Verdict v4 P1

**Clôturé** (2026-06-09) — handoff : [linux-kde-neon-v4-p1-handoff.md](linux-kde-neon-v4-p1-handoff.md)

- Discover fiche VLC : Kirigami + assets VideoLAN · `07-discover-detail-vlc` baseline
- Firefox : Proton clair · baseline `04-firefox` mise à jour
- **V4-P2** clôturé (Spectacle, Info-centre, Moniteur) — smoke `smoke-kde-neon-v4-p2.mjs` vert
- **V4-P4** clôturé — Π_global **95** · KDEConnect stub · interactions tray
- **V7** clôturé — calendrier tray · baselines dérivés · Cred* échantillon · Π **98**
- **Pivot** clôturé Π=100 (v9) · Konversation hors VM
- **Propagation dérivés gelée** — excellence ground Neon d'abord
- **Ground G1–G8** clôturé (2026-06-11) — prochaine priorité : propagation dérivés (gel levé progressivement)

## Références

- Matrice Dolphin : [linux-kde-neon-dolphin-diff.md](linux-kde-neon-dolphin-diff.md)
- Propagation P4 : [linux-kde-p4-propagation-ecarts.md](linux-kde-p4-propagation-ecarts.md)
- Roadmap v4 : [linux-kde-neon-roadmap-v4.md](linux-kde-neon-roadmap-v4.md)
