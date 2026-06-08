# Convention — assets images et icônes depuis la VM (ground truth)

> **Règle obligatoire** pour tout clone de distribution à partir d’une VM lab : les icônes et fonds d’écran affichés dans CapsuleOS doivent provenir de la **VM réelle**, pas d’un autre skin (Fedora générique, Mint-Y, pack Cinnamon du dépôt) ni d’icônes « proches » réinventées.  
> Chemins VM + specs Internet : [referentiel-assets-vm-officiels.md](referentiel-assets-vm-officiels.md).

Formalisation : prédicats **A**, **S**, **T** et règles **R-A1**–**R-S2** dans [logique-formelle.md](logique-formelle.md).

## Pourquoi

- Sous **GNOME**, l’explorateur est **Nautilus** (thème **Adwaita**) ; le slot CapsuleOS reste **`nemo`** (gabarit partagé) — voir [`inventaires/linux-gnome-capsule-slots.md`](inventaires/linux-gnome-capsule-slots.md).
- Réutiliser les assets Cinnamon sur Rocky produit des **icônes cassées** et une parité visuelle fausse.
- Un seul pack VM par vendor limite le stockage navigateur : pas de copie du thème Adwaita entier, seulement le **sous-ensemble utile**.

## Zones CapsuleOS (inchangé)

| Type | Chemin | Exemple Rocky |
|------|--------|---------------|
| Fond d’écran | `usr/share/capsuleos/assets/images/vendors/<vendor>/wallpaper/` | `rocky-default-10-gemstone-skies-night.png` |
| Lanceurs dock / panel | `.../vendors/<vendor>/panel/` | `org.gnome.Nautilus.svg`, `firefox-48.png`, `org.gnome.Ptyxis.svg` |
| Dossiers Nautilus (places) | `usr/share/capsuleos/assets/icons/gnome/adwaita/places/` | `folder-documents.svg`, `user-desktop.svg`, … |
| Symboles UI Nautilus | `icons/gnome/adwaita/symbolic/{actions,places,status}/` | barre d’outils + sidebar (remap depuis gabarit `nemo-gnome`) |
| Apps (optionnel) | `assets/images/toolkits/gnome/apps/` | copie VM si le dock réutilise ce pack |

Traçabilité : fichier `SOURCE-VM.txt` dans `vendors/<vendor>/` (généré par le script).

## Workflow

### 1. Inventaire VM (avant copie)

Sur la VM (SSH) :

```bash
gsettings get org.gnome.desktop.interface icon-theme
gsettings get org.gnome.desktop.background picture-uri
grep ^Icon= /usr/share/applications/org.gnome.Nautilus.desktop
```

Noter : nom de l’app (**Nautilus**), thème icônes, fond par défaut.

### 2. Pull automatisé (Rocky / GNOME)

```bash
bash root/tools/lab/pull-vm-assets.sh --id linux-rocky
# ou : bash root/tools/lab/pull-vm-assets.sh --ssh capsule@192.168.122.234 --vendor rocky
```

Prérequis : `etc/capsuleos/lab-inventory.json`, clé SSH lab, session GNOME active sur la VM.

### 2bis. Normalisation web (post-pull)

Pipeline complet (pull + WebP + miniatures fonds + captures lab) :

```bash
node usr/lib/capsuleos/tools/lab/run-vendor-assets-pipeline.mjs --id linux-<vendor>
```

Ou manuellement — formats VM non affichables (ex. fonds **JXL**) :

```bash
node usr/lib/capsuleos/tools/prepare-web-media.mjs --vendor rocky --rewrite-refs --wallpaper-thumbnails
# ou opt-in : PREPARE_WEB_MEDIA=1 bash root/tools/lab/pull-vm-assets.sh --id linux-rocky
```

Voir [spec-prepare-web-media.md](spec-prepare-web-media.md). Les **SVG** et **polices** ne passent pas par WebP. Miniatures sélecteur fonds : `wallpaper/thumbnails/*-thumb.webp`.

### 3. Câblage noyau

- Profil skin : `iconPacks: ["icons/gnome"]` dans `etc/capsuleos/profiles/linux-rocky.json`.
- Runtime : `usr/lib/capsuleos/shells/linux/fileExplorer/explorer-icon-base.js` (remap `cinnamon/nemo` → `gnome/adwaita/places` pour `body#rocky` / `#fedora`).
- Dock : `index.html` du skin pointe vers `vendors/rocky/panel/` (icônes VM).
- Fond : variable `--fedora-bg` → `url(.../vendors/rocky/wallpaper/...)`.

### 4. Gates

```bash
# Playbook Paramètres GNOME — présence absolue assets référencés
node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry linux-rocky --strict
node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-assets.mjs --id linux-rocky

node usr/lib/capsuleos/tools/validate-asset-zones.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node root/tools/lab/capture-capsule-rocky.mjs   # vérif visuelle
```

Voir [procedure-creation-playbook-gnome-settings.md](procedure-creation-playbook-gnome-settings.md) §0 (logique formelle gates **A** / **S**).

## Ce qu’il ne faut pas faire

- Copier le répertoire entier `/usr/share/icons/Adwaita/` dans le dépôt.
- Utiliser les icônes Mint-Y pour un skin GNOME « parce que le slot s’appelle nemo ».
- Générer des PNG/SVG « à la main » sans passe VM quand une VM lab est disponible.
- Oublier de relancer `pull-vm-assets.sh` après changement de version Rocky ou de thème GNOME sur la VM.

## Références

- Phase clone : [`procedure-clonage-os-depuis-vm.md`](procedure-clonage-os-depuis-vm.md) § Phase 3
- Politique zones : [`politique-assets.md`](politique-assets.md)
- Lab Rocky : [`lab-vm-rhel-wayland.md`](lab-vm-rhel-wayland.md)
- Parité visuelle : [`inventaires/linux-rocky-comparaison-visuelle.md`](inventaires/linux-rocky-comparaison-visuelle.md)
