# Référentiel — assets distribution sur VM (sources officielles)

> **Objectif** : ne manquer **aucun asset nécessaire** à la parité CapsuleOS lors de la collecte **ManV** (`vm-distribution-manifest.py`).  
> Complète [`convention-manifest-vm.md`](convention-manifest-vm.md) · [`convention-assets-depuis-vm.md`](convention-assets-depuis-vm.md).

**Contrats machine** :

- Catalogue attendu par vendor/toolkit : [`etc/capsuleos/contracts/vm-manifest-media-catalog.json`](../../etc/capsuleos/contracts/vm-manifest-media-catalog.json)
- Checklist découverte : [`etc/capsuleos/contracts/vm-asset-discovery-reference.json`](../../etc/capsuleos/contracts/vm-asset-discovery-reference.json)
- Sections manifeste : [`etc/capsuleos/contracts/vm-distribution-manifest.json`](../../etc/capsuleos/contracts/vm-distribution-manifest.json) → `mediaSections`

**Destination CapsuleOS** (unique) : `usr/share/capsuleos/assets/` + `home/public/Images/` — voir [`politique-assets.md`](politique-assets.md).

---

## 1. Normes et documentation officielles

| Domaine | Spécification / doc | URL |
|---------|---------------------|-----|
| **Thèmes d’icônes** (arborescence `apps/`, `mimetypes/`, `places/`, `symbolic/`) | Freedesktop Icon Theme Specification | https://specifications.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html |
| **Bases de données d’icônes** (`$XDG_DATA_DIRS/icons`) | XDG Base Directory Specification | https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html |
| **Entrées de menu / champ `Icon=`** | Desktop Entry Specification | https://specifications.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html |
| **Types MIME → icônes** | Shared MIME-Info Specification | https://specifications.freedesktop.org/shared-mime-info-spec/shared-mime-info-spec-latest.html |
| **Polices système** | fontconfig (`fc-list`, `/etc/fonts/`) | https://www.freedesktop.org/wiki/Software/fontconfig/ |
| **GNOME — interface & fonds** | GSettings / dconf (`org.gnome.desktop.*`) | https://help.gnome.org/admin/system-admin-guide/stable/dconf.html |
| **GNOME HIG (contexte visuel)** | GNOME Human Interface Guidelines | https://developer.gnome.org/hig/ |
| **Cinnamon** | Projet Linux Mint / Cinnamon (thèmes, Nemo) | https://projects.linuxmint.com/cinnamon/ · https://github.com/linuxmint/Cinnamon |
| **Linux Mint (branding, fonds)** | Dépôt `linuxmint-artwork`, paquets `mint-*` | https://github.com/linuxmint/linuxmint-artwork |
| **KDE Plasma — icônes** | KDE Human Interface Guidelines / Breeze | https://develop.kde.org/hig/ |
| **KDE — configuration** | `kdeglobals`, `lookandfeel` | https://userbase.kde.org/Plasma/Configuration |
| **Ubuntu Yaru** | Canonical design / Yaru theme | https://github.com/CanonicalLtd/yaru |
| **Fedora / RHEL logos** | `fedora-logos`, `redhat-*-fonts` (paquets RPM) | https://src.fedoraproject.org/rpms/fedora-logos |

---

## 2. Matrice assets × découverte × chemins VM

Légende **Capsule** : préfixe logique sous `usr/share/capsuleos/assets/` (résolu `./assets/…`).

| Section ManV | Obligatoire parité | Découverte VM (ordre) | Chemins VM typiques | Clé catalogue | Destination Capsule |
|--------------|-------------------|------------------------|---------------------|---------------|---------------------|
| **appIcons** | Oui (grille menu + lanceurs) | `.desktop` → `Icon=` puis résolution thème | Voir §3 · snap `/snap/*/…/meta/gui/` · flatpak `~/.local/share/flatpak/…` | — (dérivé apps) | `images/toolkits/{gnome\|cinnamon}/apps/<appId>` |
| **panel** | Oui (dock / panel P0) | `vm-manifest-media-catalog.json` → `panel[]` + `icon-theme` actif | `/usr/share/icons/<theme>/{scalable,48x48}/apps/` · `hicolor` | `panel[]` | `images/vendors/{vendor}/panel/` |
| **places** | Oui (explorateur) | Liste catalogue + thème actif | `…/scalable/places/*.svg` | `places[]` | `icons/{toolkit}/<pack>/places/` |
| **mimetypes** | Oui (explorateur) | Liste catalogue + thème | `…/scalable/mimetypes/*.svg` | `mimetypes[]` | `icons/…/mimetypes/` |
| **symbolic** | Oui (barre Nemo/Nautilus) | `actions/`, `places/`, `status/` sous `symbolic/` | Adwaita/Yaru/Mint-Y : `symbolic/<ctx>/` | `symbolic.*` | `icons/…/symbolic/{actions,places,status}/` |
| **emblems** | Si vendor (Ubuntu Yaru) | Catalogue vendor | `…/scalable/emblems/` | `emblems[]` | `icons/gnome/yaru/emblems/` |
| **wallpapers** | Oui (bureau + sélecteur) | 1) gsettings `picture-uri` 2) `wallpaperCandidates` 3) `find /usr/share/backgrounds` | §4 | `wallpaperCandidates[]` | `images/vendors/{vendor}/wallpaper/` |
| **fonts** | Oui (typographie UI) | 1) `vmCandidates` catalogue 2) gsettings `font-name` 3) `fc-list` | `/usr/share/fonts/**` | `fonts[].vmCandidates` | `fonts/vendors/{vendor}/` |
| **branding** | Oui (logo, watermark, À propos) | `branding.vmCandidates` | §5 | `branding` | `images/vendors/{vendor}/` ou `watermark/` |
| **applications** | Oui (menu, AppV) | Scan `.desktop` (contrat `desktopSearchPaths`) | §6 | — | `proc/<id>/` (JSON, pas binaire) |

**Hors manifeste ManV** (ne pas oublier en clone complet, mais pas des fichiers raster importés en masse) :

| Besoin | Source VM | Note |
|--------|-----------|------|
| Thème GTK/CSS (chrome fenêtres) | `/usr/share/themes/<gtk-theme>/` | Tokens CSS CapsuleOS, pas copie intégrale |
| Curseurs | `/usr/share/icons/<cursor-theme>/cursors/` | Rarement importé ; CSS simulé |
| Sons événements | `/usr/share/sounds/` | Optionnel P2 |
| Fichiers Glade/UI Mint | `/usr/share/linuxmint/`, `/usr/share/cinnamon/` | Comportement, pas assets navigateur |

---

## 3. Résolution des icônes (algorithme officiel)

Aligné sur **Icon Theme Spec** + implémentation `vm-distribution-manifest.py` :

1. **Bases** : `$HOME/.icons`, `$XDG_DATA_DIRS/icons` (souvent `/usr/share/icons`), `/usr/share/pixmaps`
2. **Thème actif** : voir §7 (gsettings / kreadconfig6)
3. **Contextes** : `apps`, `mimetypes`, `places`, `emblems`, `categories`, `devices`, `status`, `symbolic/<sous-ctx>/`
4. **Tailles** (ordre de préférence) : `scalable` → `512x512` → `256x256` → `48x48` → …
5. **Fallbacks** : variantes `-dark`/`-light` du thème, puis `hicolor`, puis thèmes du catalogue `iconThemeFallbacks`
6. **Chemins absolus** dans `.desktop` (snap/flatpak) : conserver tels quels

Commande de vérification manuelle :

```bash
# Thème actif + fichier résolu (exemple Firefox)
ICON_THEME=$(gsettings get org.cinnamon.desktop.interface icon-theme | tr -d "'")
gtk4-icon-browser   # si installé — visualisation GTK4
find /usr/share/icons/"$ICON_THEME" -name 'firefox.*' 2>/dev/null | head
```

Référence : [Icon Theme Specification — Directory layout](https://specifications.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html#directory_layout).

---

## 4. Fonds d’écran (wallpapers)

| Toolkit | Clé gsettings (fond actif) | Répertoires système à scanner |
|---------|---------------------------|------------------------------|
| **GNOME** | `org.gnome.desktop.background` → `picture-uri` | `/usr/share/backgrounds/gnome/`, `/usr/share/backgrounds/<distro>/` |
| **Cinnamon / Mint** | `org.cinnamon.desktop.background` → `picture-uri` | `/usr/share/backgrounds/linuxmint/`, `/usr/share/backgrounds/` |
| **KDE** | `lookandfeel` / fichier plasma | `/usr/share/wallpapers/`, `/usr/share/backgrounds/` |

Collecte automatique : `discover_wallpapers()` dans `vm-distribution-manifest.py` (find + candidats catalogue).

**Mint 22.x** (ground truth lab) :

```text
/usr/share/backgrounds/linuxmint/*.jpg
/usr/share/backgrounds/linuxmint/*.png
gsettings get org.cinnamon.desktop.background picture-uri
```

Enrichir **`wallpaperCandidates`** dans `vm-manifest-media-catalog.json` → vendor `mint` avant chaque nouvelle VM Mint.

---

## 5. Branding & logos vendor

| Vendor | Candidats VM (paquets) | Doc / source |
|--------|------------------------|--------------|
| **mint** | `/usr/share/icons/hicolor/scalable/apps/mint-logo.svg`, `/usr/share/linuxmint/logo.png` | [linuxmint-artwork](https://github.com/linuxmint/linuxmint-artwork) |
| **ubuntu** | `/usr/share/icons/hicolor/scalable/apps/ubuntu-logo-icon.svg` | [Yaru](https://github.com/CanonicalLtd/yaru) |
| **rocky / alma / fedora** | `/usr/share/*-logos/*.svg` | Paquets `rocky-logos`, `fedora-logos`, `almalinux-logos` |
| **opensuse** | `YaST-icon.svg` sous hicolor | openSUSE branding guidelines |
| **popos** | `/usr/share/pop-desktop-icons/pop-os-logo.svg` | System76 / Pop branding |

---

## 6. Applications (`.desktop`)

Chemins de recherche (contrat `vm-distribution-manifest.json`) :

```text
/usr/share/applications/
/usr/local/share/applications/
/var/lib/snapd/desktop/applications/
/var/lib/flatpak/exports/share/applications/
~/.local/share/flatpak/exports/share/applications/
~/.local/share/applications/
/usr/share/applications/kde4|kde5/   # KDE
```

Spécification champ `Icon` : [Desktop Entry Spec — Recognized keys](https://specifications.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html#recognized-keys).

Chaque entrée `gridVisible` génère un **appIcon** avec `vmPaths[]` résolus.

---

## 7. gsettings / configuration par toolkit

### 7.1 Cinnamon (Linux Mint)

| Donnée | Commande |
|--------|----------|
| Thème Cinnamon | `gsettings get org.cinnamon.theme name` |
| GTK | `gsettings get org.cinnamon.desktop.interface gtk-theme` |
| Icônes | `gsettings get org.cinnamon.desktop.interface icon-theme` |
| Fond | `gsettings get org.cinnamon.desktop.background picture-uri` |
| Police UI | `gsettings get org.cinnamon.desktop.interface font-name` |
| Police mono | `gsettings get org.cinnamon.desktop.interface monospace-font-name` |
| Favoris panel | `gsettings get org.cinnamon favorite-apps` |
| Applets | `gsettings get org.cinnamon enabled-applets` |

Référence interne : [`procedure-clonage-os-depuis-vm.md`](procedure-clonage-os-depuis-vm.md) annexe B.1.

### 7.2 GNOME (Ubuntu, Rocky, Fedora, …)

| Donnée | Schéma gsettings |
|--------|------------------|
| GTK / icônes / curseur | `org.gnome.desktop.interface` |
| Fond | `org.gnome.desktop.background` |
| Favoris dock | `org.gnome.shell favorite-apps` |
| Accent (GNOME 45+) | `org.gnome.desktop.interface accent-color` |

### 7.3 KDE Plasma

| Donnée | Commande |
|--------|----------|
| Thème icônes | `kreadconfig6 --file kdeglobals --group Icons --key Theme` |
| Fond | configuration `lookandfeel` / `~/.config/plasma-org.kde.plasma.desktop-appletsrc` |

---

## 8. Checklist agent avant collecte ManV

```bash
# 1. Vendor présent dans le catalogue médias
node usr/lib/capsuleos/tools/lab/ensure-vm-manifest-vendor.mjs --id linux-<vendor> --write

# 2. Affiner vm-manifest-media-catalog.json (panel, fonts, wallpaperCandidates, branding)

# 3. VM joignable + session graphique
node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id linux-<vendor> --dry-run

# 4. Collecte
node usr/lib/capsuleos/tools/lab/collect-vm-distribution-manifest.mjs --id linux-<vendor> --write --ssh

# 5. Vérifier sections media dans proc/<id>/distribution-manifest.json
#    entryCount > 0 pour : mimetypes, places, symbolic, panel, wallpapers, appIcons, fonts

# 6. Smoke + playbook
node usr/lib/capsuleos/tools/lab/smoke-vm-distribution-manifest.mjs --id linux-<vendor>
```

**Seuils Mint (référence lab 22.3)** :

| Section | Attendu |
|---------|---------|
| `applications.gridVisibleCount` | ~90+ |
| `media.wallpapers` | ~40 (find `linuxmint/`) |
| `media.appIcons` | = gridVisible |
| `media.panel.entryCount` | ≥ 2 (nemo, firefox) |
| `media.places.entryCount` | 8 (Mint-Y) |
| `media.symbolic` | ≥ 7 actions/places |

---

## 9. Enrichir le catalogue pour un nouveau vendor

1. Copier le bloc toolkit (`gnome` | `cinnamon` | `kde`) via `extends`
2. Renseigner **obligatoirement** :
   - `iconPack`, `iconThemeFallbacks`
   - `panel[]` (lanceurs P0 du panel/dock VM)
   - `fonts[].vmCandidates` (polices RPM/DEB du vendor)
   - `branding.vmCandidates`
   - `wallpaperCandidates` (au moins le fond par défaut)
   - extensions vendor : `emblems`, `mimetypes` supplémentaires (ex. Yaru)
3. Lancer une collecte à blanc, comparer `playbook` (`pull` vs `drift` vs `skip`)
4. Documenter les écarts dans `proc/<id>/` puis **ManA**

---

## 10. Liens projet

| Document | Rôle |
|----------|------|
| [`convention-manifest-vm.md`](convention-manifest-vm.md) | Chaîne ManΣ |
| [`politique-assets.md`](politique-assets.md) | Zones autorisées |
| [`procedure-replication-formelle.md`](procedure-replication-formelle.md) | Parité post-import |
| Skill `vm-distribution-manifest` | Routage agent |
