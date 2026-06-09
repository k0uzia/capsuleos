# Écarts fiche Discover VLC — KDE neon VM ↔ CapsuleOS

> Campagne **v4 P1** · Prédicats assets : **A** (fichier dépôt) · **S** (SHA256) · **T** (`SOURCE-VM.txt`)

| Métadonnée | Valeur |
|------------|--------|
| **registryId** | `linux-kde-neon` |
| **VM lab** | `goupil@192.168.123.52` |
| **Captures** | `vm-discover-detail-vlc.png` ↔ `capsule-discover-detail-vlc.png` |
| **AppStream VM** | `/usr/share/metainfo/vlc.appdata.xml` |

## Assets (logique formelle)

| Asset CapsuleOS | Source | SHA256 |
|-----------------|--------|--------|
| `discover/screenshots/vlc-screenshot-win7.jpg` | VideoLAN 2.0.0 (remplace gnome3-open cassé) | `17c9b92503b4a9caed72f545aebdfcf5c0aa01677800c285e4535de7921d46dc` |
| `discover/screenshots/vlc-screenshot-lion.jpg` | VideoLAN 2.0.0 | `4eceb7ec4d33d9b75dc4b4bfcfa51b116f524e579673f56a03e45b1a16085073` |
| `discover/screenshots/vlc-screenshot-poney.jpg` | VideoLAN 2.0.0 (AppStream VM) | `cce040bf089591ecf9ed2a112b2850fa94842a7cc2884a7369acdb7b548c02f7` |

Traçabilité : `usr/share/capsuleos/assets/images/vendors/neon/SOURCE-VM.txt`

## Layout Kirigami

| Zone | VM Plasma Discover | CapsuleOS v4 P1 | Statut |
|------|-------------------|-----------------|--------|
| Identité | Icône + titre + développeur ✓ + notes | `.kde-discover-app-detail__identity` | ✅ |
| Métadonnées | Version, Taille, Licences, Âges (colonne droite) | `.kde-discover-app-detail__facts` | ✅ |
| Barre d'actions | Partager · Supprimer · Lancer/Installer · origine dépôt (haut) | `.kde-discover-app-detail__toolbar` | ✅ |
| Carrousel | Hero gris + chevron + pastilles | `.kde-discover-app-detail__carousel` + JPG | ✅ Capsule · VM images réseau cassées |
| Description | Titre summary + corps AppStream | scroll panel `--app-detail` | ✅ |
| Popup MAJ | Pollue capture VM | KWin `dismiss_discover_update_dialog` | ✅ `--discover-detail-live` |

## Écarts résiduels

| Écart | Priorité | Note |
|-------|----------|------|
| VM offline : screenshots AppStream parfois gris | P2 | Capsule affiche les JPG réels (A/S) |
| Boutons Partager/Supprimer décoratifs | P2 | VM : actions natives backend |
| Note utilisateur / backend ratings live | P2 | Valeurs figées inventaire VM |

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs
KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/vm-kde-neon-capture-host.sh --discover-detail
```
