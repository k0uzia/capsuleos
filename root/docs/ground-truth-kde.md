# Ground truth KDE Plasma — référence CapsuleOS

> **Pivot opérationnel** : `linux-kde-neon` · **Toolkit** : `kde` / cluster `toolkit.kde`  
> **Contrat machine** : [`etc/capsuleos/contracts/kde-ground-truth-chain.json`](../../etc/capsuleos/contracts/kde-ground-truth-chain.json)  
> **Branche détaillée** : [`branche-plasma-kde.md`](branche-plasma-kde.md) · **Paradigme multi-DE** : [`paradigme-toolkit-de.md`](paradigme-toolkit-de.md)

Ce document fixe la **référence bureau KDE** pour le cloisonnement toolkit, les branchements noyau et la modularité orientée composants — sur le modèle formel de Mint (`linux-mint-replication-state.json`, Cred*) mais **adapté Plasma**, sans copier aveuglément la campagne crédibilité Cinnamon.

---

## 1. RegistryId pivot et justification

| Clé | Valeur |
|-----|--------|
| **Pivot** | `linux-kde-neon` |
| **Skin canonique** | `home/Debian/KDE-Neon/` |
| **Façade** | `OS/linux/families/debian/kde-neon/index.html` |
| **VM lab** | `goupil@192.168.123.52` (virsh `KDE-Neon`) |
| **Π formel** | **100** ([`linux-kde-neon-parity-index.json`](inventaires/linux-kde-neon-parity-index.json)) |
| **Campagne** | v4–v9 clôturées · **ground** : [`linux-kde-neon-roadmap-ground.md`](inventaires/linux-kde-neon-roadmap-ground.md) |
| **Propagation** | **gelée** — dérivés après excellence produit Neon |

**Pourquoi Neon et pas `linux-debian-kde` ?**

- `linux-debian-kde` est l’**upstream registre** (`upstreamId: null` théorique debian+Plasma) mais le skin le **moins avancé** (~70 % roadmap, 90 lignes `mainMenu-data.js`).
- `linux-kde-neon` concentre les avancées juin 2026 : Discover Kirigami, `dolphin-neon.js`, tray partagé P4, 30 apps kickoff, interactions JSON, campagne v4.
- Analogie Rocky GNOME : Rocky = référence opérationnelle GNOME malgré la branche RHEL ; Neon = référence opérationnelle Plasma malgré `upstreamId: linux-debian-kde`.

**Dérivés toolkit** (propagation P4 — **gelée** juin 2026) :

| registryId | Tier | Statut | Rôle |
|------------|------|--------|------|
| `linux-opensuse` | P1 | frozen | Reprise après ground Neon |
| `linux-mx-kde` | P1 | frozen | idem |
| `linux-debian-kde` | P2 | frozen | idem |
| `linux-manjaro-kde` | P2 | planned | skin absent |

---

## 2. Prédicats ground truth (Kd*)

| Prédicat | Signification | Artefact / gate |
|----------|---------------|-----------------|
| **H₂** | Baseline dépôt | `validate-all.mjs` |
| **KdM** | État machine réplication | `linux-kde-neon-replication-state.json` |
| **KdI** | Inventaire VM | `linux-kde-neon-vm.json` |
| **KdA** | Assets zones autorisées | `validate-asset-zones.mjs` |
| **KdS** | Chemins runtime skin | `linux-kde-neon-css-assets-audit.md` |
| **KdΠ** | Parité interactionnelle | `linux-kde-neon-parity-index.json` (seuil ≥ 90) |
| **KdVc** | Captures Capsule baseline | `capture-capsule-kde-neon.mjs` |
| **KdVp** | Compare visuel VM ↔ Capsule | `capture-clone-surfaces.mjs --compare` |
| **KdP4** | Propagation dérivés | `smoke-kde-p4-propagation.mjs` |
| **H₆** | Clôture | `validate-all.mjs` |

**Cred* KDE Neon** (adapté Plasma, ≠ Mint 101 entrées) :

- Contrat : `etc/capsuleos/contracts/kde-fidelity-scenarios.json` · 33 scénarios · **CredΣ** clôturé v5.
- Passes : `run-kde-neon-pass.mjs` — ne réécrit pas l'inventaire sans échec smoke.
- Playbook Paramètres GNOME (`replication-chain.json`) — remplacé par surfaces Plasma (panel, kickoff, tray, System Settings stub).

Cartographie écarts :

```bash
node usr/lib/capsuleos/tools/lab/map-kde-ground-truth-gaps.mjs --id linux-kde-neon --write
```

---

## 3. Périmètre inventaire ground truth

### 3.1 Shell Plasma

| Surface | Module skin / noyau | Inventaire | Clôture |
|---------|---------------------|------------|---------|
| Panel + pins | `plasma-panel-dock.css`, HTML pins | `interactions/linux-kde-neon/panel.json` | [`linux-kde-neon-panel-tray-closure.md`](inventaires/linux-kde-neon-panel-tray-closure.md) |
| Kickoff | `mainMenu-data.js` (335 lignes Neon) | `mainMenu.json`, `linux-kde-neon-kickoff-apps.json` | [`linux-kde-neon-kickoff-closure.md`](inventaires/linux-kde-neon-kickoff-closure.md) |
| Tray + popovers | `tray-popover-kde.js` (noyau partagé) | panel-tray closure | P4 propagé 3 dérivés |
| Horloge / calendrier | `calendar-popover-kde.js` | — | smoke shell |

### 3.2 Apps P0 panel

| Slot | VM | Template | Smoke |
|------|-----|----------|-------|
| `nemo` | Dolphin | `dolphin` + `dolphin-neon.js` | `smoke-kde-neon-dolphin.mjs` |
| `firefox` | Firefox Proton | skin KDE | `smoke-kde-neon-firefox.mjs` |
| `terminal` | Konsole | chrome konsole | `smoke-kde-neon-terminal.mjs` |
| `update_manager` | Discover 6 Kirigami | `update_manager_kde_neon.html` | `smoke-kde-neon-discover.mjs` |

### 3.3 Assets

| Zone | Chemin | Rôle |
|------|--------|------|
| Toolkit | `usr/share/capsuleos/assets/images/toolkits/kde/` | Chrome Breeze, panel, discover |
| Icônes | `usr/share/capsuleos/assets/icons/kde/` | Breeze, MIME, nemo slot |
| Vendor neon | `usr/share/capsuleos/assets/images/vendors/neon/` | Wallpaper, branding |
| Cluster CSS | `usr/share/capsuleos/themes/clusters/toolkit-kde/` | Variables `--kde-plasma-*` |

Gate zones : **A** présent dépôt · **S** SHA VM aligné · **T** `vendors/neon/SOURCE-VM.txt` si applicable.

---

## 4. État vérifié vs gaps (juin 2026)

### Vérifié (sans VM live)

| Check | Résultat |
|-------|----------|
| `validate-all.mjs` | ✅ exit 0 |
| `validate-toolkit-paradigm --id linux-kde-neon` | ✅ |
| `validate-toolkit-paradigm --id linux-debian-kde` | ✅ |
| `smoke-kde-p4-propagation.mjs` | ✅ (3 dérivés tray Neon) |
| `smoke-kde-neon-shell-polish.mjs` (statique) | ✅ structure HTML/CSS/JS |
| `map-kde-ground-truth-gaps.mjs` | ✅ rapport JSON |

### Gaps documentés

| Gap | Priorité | Action |
|-----|----------|--------|
| VM hors `lab-inventory.json` | P1 | Entrée `goupil@192.168.123.52` ajoutée (SSH routine lab) |
| Smokes Playwright (dolphin, kickoff, discover) | P1 | Requiert `python3 -m http.server 5500` |
| `fileExplorerInfo.js` sur skins KDE | P0 cloisonnement | Fuite catalogue Cinnamon — retirer des 4 skins KDE |
| `smoke-plasma-opensuse.mjs` | P1 | Échoue sur `fileExplorerInfo.js` |
| Cred* pédagogique KDE | P2 | Après v4-P2 kickoff B2/B3 |
| `linux-mx-kde` absent `validate-toolkit-paradigm` | P2 | Ajouter entrée gate |
| VM SSH depuis agent CI | P2 | Réseau lab `192.168.123.52` non garanti |

---

## 5. Modularité — alimentation noyau et cloisonnement

### 5.1 Cloisonnement (zones assets, toolkit vs vendor)

```
toolkits/kde/          ← chrome Plasma partagé (panel, breeze, discover)
icons/kde/             ← pack Breeze noyau
vendors/{neon,mx,opensuse,debian}/  ← wallpaper, launcher, accents
```

- **Règle** : pas d’icônes GNOME/Cinnamon dans skins `toolkit.kde` — gate `validate-toolkit-paradigm`.
- **Tray P4** : `usr/lib/capsuleos/shells/linux/tray-popover-kde.js` + `tray-popover-kde.base.css` — un module, N vendors via `body#kde-neon|opensuse|mx-kde|debian-kde`.
- **Anti-pattern** : `fileExplorerInfo.js` (Cinnamon) sur Dolphin — voir [`toolkit-cloisonnement-audit.md`](inventaires/toolkit-cloisonnement-audit.md).

### 5.2 Branchements noyau

| Composant | Branche KDE | Pas de fork |
|-----------|-------------|-------------|
| `contentLoader.js` | `CAPSULE_EXPLORER_TEMPLATE: dolphin` | ❌ pas de `contentLoader` KDE |
| `capsule-resource.js` | `resolveCapsuleResourceUrl('./assets/...')` | chemins relatifs skin |
| `explorer-icon-base.js` | `usesKdeIcons()` remap | catalogue Cinnamon remappé si chargé |
| `fileExplorerCore.js` | `isDolphinTemplate()` | branche Dolphin |
| `window-chrome-contexts.json` | contexte `kde` | chrome Breeze |
| Embed Linux | `embedKey: kde-neon` | `build-linux-embed.mjs` |

Référence : [`processus-branchement-noyau.md`](processus-branchement-noyau.md) · slot `data-link="nemo"` universel, template change le gabarit.

### 5.3 Composants réutilisables

| Composant | Partagé | Spécifique vendor |
|-----------|---------|-------------------|
| `tray-popover-kde.js` | ✅ 4 skins | icônes tray par vendor |
| `dolphin-neon.js` | Neon only (v4) | propagation P4 backlog |
| `discover-neon.js` | Neon only | MX/openSUSE → `update_manager_kde.html` |
| `plasma-panel-dock.css` | ✅ par skin | tokens `--kde-plasma-*` |
| `mainMenu-data.js` | ❌ par vendor | Neon 335 lignes vs Debian 90 |

---

## 6. Commandes de reprise

```bash
# Baseline
node usr/lib/capsuleos/tools/validate-all.mjs

# Ground truth — cartographie
node usr/lib/capsuleos/tools/lab/map-kde-ground-truth-gaps.mjs --id linux-kde-neon --write

# Smokes statiques (sans VM)
node usr/lib/capsuleos/tools/lab/smoke-kde-p4-propagation.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-shell-polish.mjs
node usr/lib/capsuleos/tools/lab/smoke-plasma-opensuse.mjs
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-kde-neon

# Smokes runtime (serveur requis)
python3 -m http.server 5500 --bind 127.0.0.1
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-dolphin.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-kickoff.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs

# VM lab (si SSH OK)
bash root/tools/lab/vm-kde-neon-inventory.sh
KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/vm-kde-neon-capture-host.sh
node root/tools/lab/capture-capsule-kde-neon.mjs
node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare

# Skin touché
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
```

---

## 7. Comparaison Mint (crédibilité Cred*)

| Dimension | Mint (`linux-mint`) | KDE pivot (`linux-kde-neon`) |
|-----------|---------------------|----------------------------|
| Référence VM | `capsule@192.168.1.146` | `goupil@192.168.123.52` |
| État machine | `linux-mint-replication-state.json` | `linux-kde-neon-replication-state.json` |
| Π global | 100 (CredΣ clôturé) | 93 (v4 en cours) |
| Campagne apps | Cred* 130 scénarios / 43 apps | v4 kickoff B2/B3 — pas Cred* |
| Explorateur | Nemo Cinnamon | Dolphin |
| Shell | Panel Cinnamon + menu | Panel Plasma + Kickoff |
| Playbook toolkit | cinnamon stub | `kde-ground-truth-chain.json` |
| Propagation | toolkit cinnamon seul | P4 → openSUSE, MX, Debian-KDE |

---

## 8. Prochaines vagues recommandées

1. **P0 cloisonnement** — retirer `fileExplorerInfo.js` des 4 skins KDE + `sync-linux-skin-closure` + smokes verts.
2. **v4-P2** — Spectacle, Info-centre, System Monitor (kickoff B2/B3).
3. **v4-P3/P4** — propagation `dolphin-neon.js` / Discover vers dérivés · Π ≥ 95 %.
4. **Cred* KDE** — **clôturé** (`v5-credibility-pass`) · 33 scénarios · 11 slots · `CredΣ=true` · contrat `kde-fidelity-scenarios.json`.
5. **VM lab** — intégrer `linux-kde-neon` dans routine `lab-inventory` + sonde `os-probe.sh` branche Plasma.

---

## Voir aussi

- [`inventaires/linux-kde-neon-replication-state.json`](inventaires/linux-kde-neon-replication-state.json)
- [`inventaires/linux-kde-neon-roadmap-v4.md`](inventaires/linux-kde-neon-roadmap-v4.md)
- [`procedure-playbook-general.md`](procedure-playbook-general.md) § toolkit KDE
- [`campagne-credibilite-pedagogique.md`](campagne-credibilite-pedagogique.md) — modèle Mint, adaptation KDE future
