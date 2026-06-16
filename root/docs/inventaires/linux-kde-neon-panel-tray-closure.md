# Clôture Panel + zone de notification — KDE neon User Edition

> **Statut** : 🔄 réouvert (2026-06-11) — réaudit week-end 6–7 juin · clôture initiale 2026-06-06 · Registre `linux-kde-neon`  
> Parité globale skin : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)  
> Kickoff : [`linux-kde-neon-kickoff-closure.md`](linux-kde-neon-kickoff-closure.md)  
> Calendrier : déjà validé visuellement (popover Plasma, hors doc dédiée)

Panel inférieur Plasma : launcher, pins, system tray, horloge, coup d'œil sur le bureau.

## Fichiers source

| Rôle | Chemin |
|------|--------|
| Structure HTML | `home/Debian/KDE-Neon/index.html` |
| Footer / tray | `home/Debian/KDE-Neon/style/footer.css` |
| Thème panel | `home/Debian/KDE-Neon/style/debian-desktop.css` |
| Dock panel | `home/Debian/KDE-Neon/style/plasma-panel-dock.css` |
| Popovers tray | `home/Debian/KDE-Neon/style/tray-popover-kde.css` |
| JS tray | `home/Debian/KDE-Neon/js/tray-popover-kde.js` |
| JS calendrier | `home/Debian/KDE-Neon/js/calendar-popover-kde.js` |
| JS volume | `usr/lib/capsuleos/shells/linux/volume.js` |
| Icônes tray | `usr/share/capsuleos/assets/images/toolkits/kde/panel/tray/` |
| Show desktop | `…/panel/user-desktop-symbolic.svg` (pull VM) |
| Launcher KDE | `…/panel/start-here-kde.svg` + filtre `--opensuse-mono-logo-filter` |

## Parité validée

| Élément | VM | CapsuleOS |
|---------|-----|-----------|
| Launcher | start-here-kde noir (clair) / blanc (sombre) | filtre CSS par thème |
| Pins | Dolphin, Firefox, Konsole, Discover | idem |
| Tray (ordre) | Notifications → MAJ → Clipboard → Luminosité → Réseau → Volume → Expand | idem |
| Notifications | popover | `kde-tray-popover-notifications` |
| Mises à jour | badge + Discover | `data-update-manager-tray` → onglet Mises à jour |
| Presse-papiers | Klipper | popover (vide simulé) |
| Luminosité | slider | slider + `localStorage` |
| Réseau | connexion filaire | popover « Connecté » |
| Volume | popover Pulse | `volume-popover` existant |
| Expand | icônes masquées | grille batterie, BT, KDE Connect, clavier, saisie |
| Horloge + calendrier | popup Plasma | `calendar-popover-kde.js` ✅ |
| Coup d'œil bureau | `user-desktop-symbolic` | pull VM Breeze |

## Regénération / capture

```bash
python3 -m http.server 5500
bash root/tools/lab/vm-kde-neon-capture-host.sh          # vm-desktop.png
node root/tools/lab/capture-capsule-kde-neon.mjs         # capsule-desktop.png
```

## Écarts assumés (hors clôture panel/tray)

| Écart | Priorité | Note |
|-------|----------|------|
| Popovers tray simplifiés (contenu statique) | P2 | Fidélité chrome OK, pas Klipper réel |
| Icônes expand non cliquables individuellement | P2 | Affichage VM des icônes masquées |
| « Paramètres réseau… » | P2 | Retour accueil CapsuleOS (pas KCM réseau) |
| Pins VM incluent Config système | P2 | CapsuleOS : 4 pins lab (Dolphin, Firefox, Konsole, Discover) |

## Gates (2026-06-06)

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs   # OK
node usr/lib/capsuleos/tools/validate-all.mjs                    # OK
```

## Ground G8 — réaudit (2026-06-11)

| Check | Statut |
|-------|--------|
| VM `--panel-g8` | ✅ bureau sans fenêtre (`pkill -f firefox`) · kickoff |
| Capsule tray | ✅ `capsule-tray-{calendar,clipboard,network,volume}.png` |
| Smokes | ✅ shell-polish · calendar · v4-p4 |
| `run-kde-neon-pass` | ✅ |

## Réouverture

Réouvrir ce fichier ou l'inventaire parité si la VM change de layout tray ou si une capture côte à côte révèle un écart.
