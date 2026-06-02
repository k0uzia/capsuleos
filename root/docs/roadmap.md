# Roadmap CapsuleOS

Plan de livraison pour aboutir les bureaux simulés déjà amorcés, prioriser la pédagogie terrain et consolider le socle technique.  
Document vivant — à mettre à jour à chaque jalon ou retour utilisateur.

**Références :**

- [Applications Linux par distro](apps-linux-par-distro.md) — inventaire apps + mappings `data-link`
- [Familles d’OS](familles-os.md) — cartographie dépôt
- [Arborescence](arborescence.md) — flux noyau / skins / embeds
- [CONTRACT_CHECKLIST.md](../../CONTRACT_CHECKLIST.md) — critères release

---

## Vision et critères de succès

CapsuleOS est une **sandbox web** (HTML/CSS/JS, hors ligne) pour s’approprier les interfaces de bureau, s’entraîner aux usages courants et gagner en autonomie face aux démarches en ligne — par l’expérimentation et la gamification.

Un jalon est **réussi** lorsque :

1. Un conseiller numérique peut guider un public illectronique sur **au moins un bureau complet** sans serveur HTTP (double-clic / offline SW).
2. Les **applications par défaut** du système cible sont reconnaissables (noms, icônes, emplacement shell).
3. Le parcours **checklist / missions** est adapté au vocabulaire local (Nemo vs Dolphin vs Fichiers).
4. La [checklist contrat](../../CONTRACT_CHECKLIST.md) est validée pour les skins livrés.

---

## État des lieux (juin 2026)

### Socle technique — solide

| Composant | État |
|---|---|
| Portail `index.html` + `pick-os.js` | ✅ 8 Linux + Windows + macOS + Android listés |
| Noyau Linux `usr/lib/capsuleos/shells/linux/` | ✅ fenêtres, explorateurs, embed offline |
| FS simulé `home/public/` + manifestes | ✅ partagé inter-OS |
| Pipeline embed | ✅ `build-linux-embed.mjs` — 21 templates, 8 skins |
| Doc agents `root/` | ✅ skills, AGENTS.md |
| Mappings apps erronés (Fedora, Pop!_OS, Debian-KDE) | ✅ corrigés juin 2026 |
| App `text_editor` | ✅ créée ; skins et épinglages partiels |

### Linux — maturité par skin

| Distribution | Bureau | Maturité estimée | Priorité roadmap |
|---|---|---|---|
| **Linux Mint** | Cinnamon | ~95 % — référence | P0 — figer |
| **MX Linux KDE** | Plasma | ~85 % | P1 |
| **openSUSE** | Plasma | ~85 % | P1 |
| **Ubuntu 25.10** | GNOME | ~75 % | P1 |
| **Debian KDE** | Plasma | ~70 % | P2 |
| **Fedora** | GNOME | ~65 % | P1 |
| **Pop!_OS** | COSMIC | ~55 % | P2 |
| **AnduinOS** | GNOME Win11-like | ~50 % | P3 |

### Autres familles — amorcées

| Famille | Entrées | État indicatif |
|---|---|---|
| Windows | 11 versions sous `OS/windows/versions/` | Coquilles / styles variés — noyau `kernel/` |
| macOS | Sonoma | Façade + Finder |
| Android | Vanilla Ice Cream | Apps messages, contacts, appels |
| iOS | 15 | Entrée minimale |
| Arch / Slackware Linux | — | Prévus, non démarrés |

### Dépôt

- Premier commit et historique Git à formaliser (Phase 0).
- `.gitignore` `.cursor/` en place.

---

## Définition du « skin abouti » (DoD)

Checklist applicable à **chaque** bureau Linux avant badge « complet » sur le hub :

- [ ] Façade `OS/linux/families/...` et skin `home/...` synchronisées (ou `<base href>` documenté)
- [ ] Variables `CAPSULE_*` conformes ([CONTRACT_CHECKLIST](../../CONTRACT_CHECKLIST.md) § Linux)
- [ ] Shell navigable : menu / dock / panel, horloge, tray, retour accueil
- [ ] Explorateur branché sur `home/public/` avec le bon template (`nemo`, `dolphin`, `nemo-gnome`, `nemo-cosmic`)
- [ ] Apps par défaut épinglées selon [apps-linux-par-distro.md](apps-linux-par-distro.md)
- [ ] `*.skin.css` pour chaque app ouverte depuis le shell (14 cibles max.)
- [ ] `content/strings.json` — titres fenêtre et textes checklist spécifiques
- [ ] Embed régénéré ; test `file://` + coupure réseau (SW)
- [ ] Revue manuelle checklist contrat cochée

---

## Phases

```mermaid
flowchart LR
    P0[Phase 0\nFondations] --> P1[Phase 1\nParité apps Linux]
    P1 --> P2[Phase 2\nShells UX]
    P2 --> P3[Phase 3\nPédagogie]
    P3 --> P4[Phase 4\nExtension]
```

---

### Phase 0 — Fondations (priorité immédiate)

**Objectif :** base de travail reproductible et testable.

| # | Livrable | Détail |
|---|---|---|
| 0.1 | **Premier commit Git** | Code applicatif + `.gitignore` + doc `root/` |
| 0.2 | **Matrice de smoke tests** | 8 Linux : explorateur, Firefox, terminal, checklist ; HTTP + `file://` |
| 0.3 | **Script ou checklist release** | `generate-public-manifest.mjs` + `build-linux-embed.mjs` documentés dans le flux merge |
| 0.4 | **Hub Linux** | Badges « complet / beta » sur `home/Debian/index.html` selon DoD |

**Critère de sortie :** un contributeur peut cloner, servir en local, ouvrir Mint + un skin beta sans blocage.

---

### Phase 1 — Parité applications Linux

**Objectif :** chaque skin atteint le catalogue apps de son OS réel (voir [apps-linux-par-distro.md](apps-linux-par-distro.md)).

#### 1.A — Compléter les gabarits manquants

| App CapsuleOS | Skins à couvrir | Notes |
|---|---|---|
| `text_editor` | Mint, Ubuntu, Fedora, Pop!_OS, KDE, AnduinOS | Skins GNOME / KDE / COSMIC / xed |
| `update_manager` | Fedora (GNOME Software), MX-KDE | Overrides `_ubuntu` / `_kde` |
| Skins CSS manquants | Fedora, Pop!_OS, AnduinOS | 14 × `*.skin.css` cible |

#### 1.B — Épingler et brancher le shell

| Skin | Actions |
|---|---|
| **Mint** | Panel : Celluloid, visionneurs ; menu : Logithèque → `update_manager`, xed → `text_editor` |
| **Ubuntu** | Overview : lier apps GNOME ; dock : missions optionnelles |
| **Fedora** | Dock : `update_manager` ; overview : Showtime → `lecteur_multimedia` |
| **Pop!_OS** | Skin Nautilus Cosmic ; compléter 9 skins restants |
| **MX-KDE** | Discover panel + menu → `update_manager_kde` |
| **openSUSE** | Kate → `text_editor` ; Discover panel cliquable |
| **AnduinOS** | 12 favoris menu restants (coquilles GNOME) ; raccourci bureau « À propos » |

#### 1.C — Ordre de traitement recommandé

1. **Mint** — figer la référence (polish uniquement)
2. **Ubuntu + Fedora** — duo GNOME présentable
3. **MX-KDE + openSUSE** — duo KDE (assets déjà riches)
4. **Debian-KDE** — alignement sur MX/openSUSE
5. **Pop!_OS** — COSMIC (dépend du socle GNOME stable)
6. **AnduinOS** — différenciateur Win11-like

**Critère de sortie :** les 8 Linux passent le DoD apps (colonnes ✅ sur au moins panel + menu dans apps-linux-par-distro).

---

### Phase 2 — Fidélité UX des shells

**Objectif :** l’enveloppe du bureau (pas seulement les apps) ressemble à l’original.

Regroupement par **famille de bureau** pour mutualiser le JS :

| Famille | Skins | Travaux |
|---|---|---|
| **Cinnamon** | Mint | Menu contextuel bureau ; liste fenêtres panel |
| **GNOME** | Ubuntu, Fedora, AnduinOS | Overview, calendrier, quick settings ; factoriser `overview.js` |
| **COSMIC** | Pop!_OS | Workspaces, catalogue Applications, menu alimentation |
| **KDE Plasma** | MX-KDE, Debian-KDE, openSUSE | Discover, popovers volume/calendrier, icônes panel |

#### Coquilles utilitaires (P1 → P2)

| App | Usage |
|---|---|
| `calculator` | GNOME, Mint, AnduinOS |
| `clocks` / `calendar` | Fedora dash, Ubuntu overview, AnduinOS menu |
| `photos` | AnduinOS — variante enrichie de `visionneur_images` |

**Critère de sortie :** retours terrain « je reconnais mon bureau » sur 4 distros minimum (Mint, Ubuntu, Fedora, une KDE).

---

### Phase 3 — Pédagogie et contenu

**Objectif :** la gamification sert les démarches en ligne, pas seulement la découverte UI.

| # | Livrable | Détail |
|---|---|---|
| 3.1 | **Checklist par distro** | Missions et libellés dans `content/strings.json` (ex. « Lance Dolphin ») |
| 3.2 | **Scénarios `home/public/`** | Documents, Téléchargements, démarches simulées |
| 3.3 | **Parcours multi-OS** | Comparer Cinnamon vs GNOME vs KDE en 3 sessions |
| 3.4 | **Tests terrain** | Conseillers numériques ; itérations ciblées |
| 3.5 | **Accessibilité** | Contraste, clavier, lecteurs d’écran sur portail + 2 skins |

**Critère de sortie :** au moins un parcours complet validé en situation réelle (MFN / France Services).

---

### Phase 4 — Extension et consolidation

**Objectif :** élargir le catalogue et industrialiser la maintenance.

| # | Livrable | Détail |
|---|---|---|
| 4.1 | **Linux Arch + Slackware** | Pattern `os-stub`, façades `OS/linux/families/` |
| 4.2 | **Windows** | Prioriser 95, XP, 7, 10, 11 ; DoD adapté explorateur |
| 4.3 | **macOS / Android** | Aligner sur DoD Linux simplifié |
| 4.4 | **CI légère** | Régénération embed + smoke HTTP sur entrées `pick-os.js` |
| 4.5 | **Perf offline** | Poids embed, lazy load gabarits lourds (LibreWriter) |
| 4.6 | **iOS / BSD / ChromeOS** | Stubs ou report explicite |

---

## Calendrier indicatif

Estimation **effort relatif**, pas des dates figées — ajuster selon disponibilité équipe.

| Phase | Durée indicative | Dépendances |
|---|---|---|
| Phase 0 | 1 semaine | — |
| Phase 1 | 3–4 semaines | Phase 0 |
| Phase 2 | 3–4 semaines | Phase 1 (partiel OK par famille) |
| Phase 3 | 2 semaines | Phase 1 sur Mint + 1 GNOME + 1 KDE |
| Phase 4 | continu | Phases 1–3 |

---

## Risques et mitigations

| Risque | Mitigation |
|---|---|
| Duplication home / façades `OS/` | DoD : toute mod shell → vérifier les deux entrées (`pick-os.js` vs hub `home/`) |
| Embed stale après merge | Hook ou checklist release obligatoire |
| Scope creep (trop d’apps) | Coquilles UI statiques OK ; pas de logique métier complète |
| Poids repo (assets KDE) | Mutualiser icônes ; pas de duplication inutile |
| Confusion checklist / apps OS | `checklist` = pédagogie CapsuleOS uniquement ; jamais mapper sur Calendrier / Discover |

---

## Suivi des jalons

Cocher ici ou dans les PR associées :

- [ ] Phase 0 — fondations
- [ ] Phase 1 — parité apps (8/8 Linux DoD apps)
- [ ] Phase 2 — shells UX (4 bureaux reconnus terrain)
- [ ] Phase 3 — pédagogie validée terrain
- [ ] Phase 4 — Arch + CI + 1 jalon Windows

**Dernière mise à jour :** juin 2026 — création roadmap ; mappings apps corrigés (Fedora, Pop!_OS, Debian-KDE, AnduinOS).
