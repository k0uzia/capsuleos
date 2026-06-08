# Handoff V4-P1 — Discover fiche VLC + Firefox toolbar

> **Dernière session** : 2026-06-08 (round 1 + round 2)  
> **Statut** : 🔄 **non clôturé** — reprise prioritaire avant V4-P2  
> **registryId** : `linux-kde-neon` · VM : `goupil@192.168.123.52` · virsh `KDE-Neon`

---

## Contexte

La clôture P1 initiale (2026-06-08 matin) était **prématurée** : popup MAJ sur captures VM, layout Discover ≠ Kirigami, placeholders CSS au lieu d’assets, Firefox en Proton **sombre** alors que la VM est en Proton **clair**.

La campagne a été **réouverte** le même jour. Deux rounds de travail ont avancé Discover ; Firefox skin clair livré ; clôture Vp formelle encore à faire.

---

## Ce qui est fait ✅

### Discover — fiche VLC (CapsuleOS)

| Livrable | Chemin / détail |
|----------|-----------------|
| Layout Kirigami | Barre actions haut · identité + métadonnées · carrousel · description |
| JS | `home/Debian/KDE-Neon/js/discover-neon.js` — `renderAppDetail`, carrousel + pastilles |
| CSS | `home/Debian/KDE-Neon/style/apps/update_manager.skin.css` — classes `kde-discover-app-detail__*` |
| Catalogue | `home/Debian/KDE-Neon/content/discover-catalog.json` — `appDetails.vlc` |
| Assets (A/S/T) | `usr/share/capsuleos/assets/images/vendors/neon/discover/screenshots/` |
| Traçabilité | `usr/share/capsuleos/assets/images/vendors/neon/SOURCE-VM.txt` |
| Matrice écarts | [linux-kde-neon-discover-detail-diff.md](linux-kde-neon-discover-detail-diff.md) |

**3 screenshots** (VideoLAN officiels, remplacement des URLs AppStream cassées / composites) :

| Fichier dépôt | Source net | SHA256 |
|---------------|------------|--------|
| `vlc-screenshot-win7.jpg` | `http://images.videolan.org/vlc/screenshots/2.0.0/vlc-2.0-win7.jpg` | `17c9b925…` |
| `vlc-screenshot-lion.jpg` | `…/vlc-2.0-lion.jpg` | `4eceb7ec…` |
| `vlc-screenshot-poney.jpg` | `…/vlc-2.0-poney.jpg` | `cce040bf…` |

Métadonnées alignées VM : version `3.0.20-3build6`, taille `0 o`, licence `GPL-2.0+`, origine `ubuntu-noble-universe`, texte AppStream depuis `/usr/share/metainfo/vlc.appdata.xml`.

### Captures

| Fichier | État |
|---------|------|
| `capsule-discover-detail-vlc.png` | ✅ layout + JPG visibles |
| `capsule-discover-detail-vlc-scrolled.png` | ✅ variante scroll panel |
| `vm-discover-detail-vlc.png` | ✅ sans popup (mode live) · carousel VM **gris** (images réseau non chargées par Discover) |
| `vm-discover-detail-vlc-scrolled.png` | ⚠️ scroll VM peu visible (Page_Down xdotool limité Wayland) |

### Script capture VM

`root/tools/lab/vm-kde-neon-capture-host.sh` :

| Flag | Rôle |
|------|------|
| `--discover-detail` | kill apps → ouvre `plasma-discover --application appstream://org.videolan.vlc` → dismiss → 2 captures |
| `--discover-detail-live` | **sans redémarrer Discover** — dismiss popup KWin + capture (VM déjà sur fiche VLC) |

Dismiss popup : script KWin inline (`dismiss_discover_update_dialog`) — **ne pas** envoyer Escape (ferme Discover entier). `xdotool` ne voit pas les fenêtres Wayland natives.

Référence KWin : `root/tools/lab/kde-neon-discover-capture-kwin.js`

### Firefox toolbar

| Livrable | Chemin |
|----------|--------|
| Skin Proton **clair** | `home/Debian/KDE-Neon/style/apps/firefox.skin.css` |
| Matrice | [linux-kde-neon-firefox-toolbar-matrix.md](linux-kde-neon-firefox-toolbar-matrix.md) |

### Gates (dernière exécution session)

```bash
node usr/lib/capsuleos/tools/validate-all.mjs          # OK
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs   # OK
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-firefox.mjs    # OK (session précédente)
```

---

## Ce qui reste 🔄

### P1 — Discover (priorité reprise)

| Tâche | Détail |
|-------|--------|
| **Compare visuel Vp** | `node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare` — pas exécuté post-fix layout |
| **Scroll VM fiable** | Pastilles description bas de page : améliorer `scroll_discover_detail` (Wayland) ou scroll manuel avant `--discover-detail-live` |
| **Bouton Lancer vs Installer** | VM installée affiche « Lancer » ; Capsule accueil affiche « Installer » — OK fonctionnel, documenter ou bifurquer si fiche depuis onglet Installé(s) |
| **Icônes barre actions** | VM : pictos Partager/Supprimer/Lancer — Capsule texte seul (P2 polish) |
| **Licence lien externe** | VM : GPL-2.0+ vert + icône lien — Capsule texte vert sans icône |

### P1 — Firefox

| Tâche | Détail |
|-------|--------|
| **Compare capture** | Regénérer baseline `04-firefox.png` + compare post skin clair |
| **Verdict Vp formel** | Matrice marquée « réalignée » mais compare non rejoué |

### Clôture pallier

Ne pas marquer V4-P1 clôturé tant que :

1. Compare visuel Discover + Firefox classé sans écart P0
2. `linux-kde-neon-vp-residual.md` et `replication-state.json` synchronisés
3. Roadmap v4 § P1 cochée entièrement

---

## Commandes reprise (ordre suggéré)

```bash
# 1. VM — Discover déjà ouvert sur VLC (recommandé)
KDE_NEON_SSH=goupil@192.168.123.52 \
  bash root/tools/lab/vm-kde-neon-capture-host.sh --discover-detail-live

# 2. VM — cycle complet (ferme/réouvre Discover)
KDE_NEON_SSH=goupil@192.168.123.52 \
  bash root/tools/lab/vm-kde-neon-capture-host.sh --discover-detail

# 3. Capsule — serveur HTTP racine dépôt
python3 -m http.server 5500
node root/tools/lab/capture-capsule-kde-neon.mjs   # ou captures ciblées discover detail

# 4. Gates
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-firefox.mjs
node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## Fichiers modifiés (session P1)

```
home/Debian/KDE-Neon/js/discover-neon.js
home/Debian/KDE-Neon/style/apps/update_manager.skin.css
home/Debian/KDE-Neon/style/apps/firefox.skin.css
home/Debian/KDE-Neon/content/discover-catalog.json
usr/share/capsuleos/assets/images/vendors/neon/discover/screenshots/*.jpg
usr/share/capsuleos/assets/images/vendors/neon/SOURCE-VM.txt
root/tools/lab/vm-kde-neon-capture-host.sh
root/tools/lab/kde-neon-discover-capture-kwin.js
root/tools/lab/capture-capsule-kde-neon.mjs
usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs
root/docs/inventaires/linux-kde-neon-discover-detail-diff.md
root/docs/inventaires/linux-kde-neon-firefox-toolbar-matrix.md
root/docs/inventaires/linux-kde-neon-roadmap-v4.md
home/public/Images/screen_KDE-Neon/capsule-discover-detail-vlc*.png
home/public/Images/screen_KDE-Neon/vm-discover-detail-vlc*.png
```

---

## Pièges connus

1. **`kstart --activate plasma-discover`** — casse le lancement ; garder `nohup plasma-discover --application …`
2. **Escape sur dismiss** — ferme Discover, pas seulement la popup
3. **`require_discover_window` via xdotool** — échoue sur Wayland ; utiliser `pgrep plasma-discover` uniquement
4. **VM carousel gris** — backend Discover ne charge pas les URLs AppStream distantes ; **normal** · Capsule = ground truth visuel assets
5. **Bouton Retour smoke** — `[data-discover-app-back]` en `sr-only` ; smoke utilise `evaluate(() => back.click())`

---

## Suite campagne (après clôture P1)

→ **V4-P2** Kickoff B2/B3 — voir [linux-kde-neon-roadmap-v4.md](linux-kde-neon-roadmap-v4.md)
