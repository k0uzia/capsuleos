# Analyse File Roller — VM Linux Mint 22.3 Wilma → CapsuleOS

**Objectif** : ground truth pour une reproduction **fidèle** du gestionnaire d'archives dans `home/Debian/Mint/` (slot `file_roller`, embed `usr/share/capsuleos/linux/apps/file_roller.html`).

**Collecte** : SSH `capsule@192.168.1.146` · script [`vm-mint-file-roller-inventory.sh`](../../tools/lab/vm-mint-file-roller-inventory.sh) · JSON [`linux-mint-file-roller-vm.json`](linux-mint-file-roller-vm.json) · campagne 2026-06-04.

Références : [`linux-mint-vm.json`](linux-mint-vm.json) · passe #8 [`linux-mint-apps-alphabetique.md`](linux-mint-apps-alphabetique.md)

---

## 1. Identité VM (paquet & distribution)

| Élément | VM |
|---------|-----|
| Version | **File Roller 43.0** |
| Paquet | `file-roller` **43.0+mint1+wilma** |
| `.desktop` | `org.gnome.FileRoller.desktop` — **Archive Manager** (EN) |
| Titre fenêtre (FR locale) | **Gestionnaire d'archives** (vide) · nom d'archive si ouverte (ex. `demo.zip`) |
| `Exec` | `file-roller %U` |
| `Icon` | `org.gnome.FileRoller` → Mint-Y |
| Binaire | `/usr/bin/file-roller` |
| WM class | `file-roller.File-roller` |

Pas de fichiers `.ui` GTK3 : File Roller 43 = **GTK4 / libadwaita** (UI compilée).

---

## 2. Contexte bureau Cinnamon

| Couche | VM (gsettings) |
|--------|----------------|
| Thème Cinnamon | **Mint-Y-Dark-Aqua** |
| GTK apps | **Mint-Y-Aqua** (contenu File Roller **clair**) |
| Icônes | **Mint-Y-Sand** |
| Géométrie fenêtre (échantillon) | **652×579** (gschema défaut 600×480) |

---

## 3. Anatomie visuelle VM (File Roller 43)

### État vide

File Roller 43 = **CSD libadwaita** : pas de barre Muffin séparée ; titre et contrôles fenêtre sont dans la **headerbar GTK** (`_MOTIF_WM_HINTS` présent, WM class `file-roller.File-roller`).

```text
┌─ Headerbar GTK (#ebebeb) — seule barre chrome ────────────────────────┐
│  [Extraire] [+]     Gestionnaire d'archives     [🔍] [≡] [_] [□] [×] │
├─ Zone contenu ────────────────────────────────────────────────────────┤
│  (blanc, vide)                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

CapsuleOS Mint : provider chrome `file-roller-gtk` — `#windowHeader` masqué, contrôles déplacés dans `.fr-app__header-end`, drag sur `.fr-app__headerbar`.

- **Extraire** : désactivé tant qu'aucune archive n'est ouverte.
- **+** : ajouter des fichiers / créer une archive.
- **Titre headerbar** : reprend le nom de l'archive ou « Gestionnaire d'archives ».

### Archive ouverte (`demo.zip`)

```text
├─ Headerbar ───────────────────────────────────────────────────────────┤
│  [Extraire] [+]           demo.zip                [🔍] [≡]             │
├─ Navigation ──────────────────────────────────────────────────────────┤
│  [←][→][⌂]  Emplacement: [📁 /]                                      │
├─ Liste (as-folder) ────────────────────────────────────────────────────┤
│  Nom ▾  │  Taille  │  Type  │  Modifié                                 │
│  demo.txt │ 11 octets │ Plain text do… │ 04 juin 2026, 18:21           │
└───────────────────────────────────────────────────────────────────────┘
```

Colonnes gschema : `show-size`, `show-type`, `show-time`, `show-path` (tous `true` par défaut). Tri : `sort-method=name`, `sort-type=ascending`.

---

## 4. Implémentation CapsuleOS (passe #8)

| Zone | Fichiers | Fidélité VM |
|------|----------|-------------|
| Gabarit | `file_roller.html`, `file_roller.base.css`, `file_roller.skin.css` | **P0** headerbar + nav + liste |
| JS | `file-roller.js` — états vide / archive, demo.zip pédagogique | **P1** simulation |
| Titre WM | `file_roller.windowTitle` → « Gestionnaire d'archives » | **OK** |
| Menu Cinnamon | `dataLink: file_roller`, icône `org.gnome.FileRoller.png` | **OK** |
| Smoke | `smoke-mint-file-roller.mjs` | menu → vide → demo.zip |

### Écarts assumés (P1/P2)

1. **Création / compression réelle** : pas de backend archive — prompts simulés.
2. **Menu hamburger** : sous-ensemble (Nouvelle, Ouvrir, Fermer, À propos).
3. **Recherche** : filtre client sur la liste, pas de surlignage GTK.
4. **Sidebar** : absente (gschema `view-sidebar=false` sur VM neuf).

---

## 5. Passe design — dimensions VM (2026-06-05)

Mesures `wmctrl` / capture `demo.zip` :

| Zone | VM |
|------|-----|
| Fenêtre totale (WM) | **652×579** px |
| Minimum gschema | 600×480 |
| Headerbar GTK | **46** px |
| Barre navigation | **44** px |
| Ligne en-tête tableau | **30** px |
| Ligne fichier | **30** px |
| Colonnes (Nom / Taille / Type / Modifié) | **42% / 16% / 16% / 26%** |
| Police UI / tableau | **13px / 12px** |

CapsuleOS : `--win-file_roller-*` dans `variables-linux.css` + tokens `--fr-*` dans `file_roller.skin.css` · smoke vérifie tolérance ±8 px.

---

## 6. Matrice P0

1. **Headerbar** : Extraire, +, titre centré, loupe, menu — **fait**.
2. **État vide** : corps blanc, Extraire grisé — **fait**.
3. **Archive ouverte** : barre Emplacement + colonnes FR — **fait** (demo.zip).
4. **Titre fenêtre** : bascule « Gestionnaire d'archives » ↔ nom archive — **fait**.
5. **Thème clair GTK** dans le client (Mint-Y-Aqua) — **fait** via tokens skin.

---

## 6. Commandes lab

```bash
# Inventaire VM
ssh capsule@192.168.1.146 'DISPLAY=:0 bash -s' < root/tools/lab/vm-mint-file-roller-inventory.sh

# Gates + smoke
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/smoke-mint-file-roller.mjs
```
