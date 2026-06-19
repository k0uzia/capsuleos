# Clôture Kickoff — KDE neon User Edition

> **Statut** : 🔄 réouvert (2026-06-11) — réaudit week-end 6–7 juin · clôture initiale 2026-06-06 · Registre `linux-kde-neon`  
> Parité globale skin : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)  
> Panel + tray : [`linux-kde-neon-panel-tray-closure.md`](linux-kde-neon-panel-tray-closure.md)

Menu Démarrer Plasma (Kickoff) : layout VM, apps inventoriées, catégories sidebar, favoris, recherche et déduplication « Toutes les applications ».

## Fichiers source

| Rôle | Chemin |
|------|--------|
| Template HTML | `home/Debian/KDE-Neon/apps/mainMenu.html` |
| CSS skin | `home/Debian/KDE-Neon/style/apps/mainMenu.skin.css` |
| Thème / alpha | `home/Debian/KDE-Neon/style/debian-desktop.css` |
| Données (généré) | `home/Debian/KDE-Neon/content/mainMenu-data.js` |
| JS Plasma skin | `home/Debian/KDE-Neon/js/mainMenu-plasma.js` |
| Noyau menu | `usr/lib/capsuleos/shells/linux/mainMenu.js` |
| Inventaire apps VM | [`linux-kde-neon-kickoff-apps.json`](linux-kde-neon-kickoff-apps.json) |
| Générateur | `root/tools/lab/generate-kde-neon-kickoff-data.mjs` |
| Icônes apps | `usr/share/capsuleos/assets/images/vendors/neon/kickoff/` |
| Icônes catégories | `…/kickoff/actions/` (Breeze actions/22, pull VM) |

## Parité validée

| Aspect | VM | CapsuleOS |
|--------|-----|-----------|
| Dimensions popup | ~677×513 px | tokens `--opensuse-menu-width/height` |
| Transparence + blur | fond translucide Breeze | tokens `--opensuse-menu-*` |
| Header | user gauche · recherche + filtres droite | grille 2 colonnes |
| Favoris (ordre) | Firefox → Config système → Dolphin → Discover | idem, pas de tri alpha |
| Catégories sidebar | 10 entrées (sans Jeux/Éducation/Récents) | `MENU_CATS` généré |
| Apps | 30 entrées XDG | `mainMenu-data.js` |
| Toutes les applications | sans doublons | dédup par `desktop` dans `mainMenu.js` |
| Onglet Emplacements | raccourcis dossiers | `MENU_SHORTCUTS` |
| Pied de page | Applications / Emplacements + veille/redémarrage | `mainMenu.html` + power → accueil CapsuleOS |

## Regénération

```bash
node root/tools/lab/generate-kde-neon-kickoff-data.mjs
python3 -m http.server 5500
node root/tools/lab/capture-capsule-kde-neon.mjs   # capsule-kickoff.png
```

## Écarts assumés (hors clôture Kickoff)

| Écart | Priorité | Note |
|-------|----------|------|
| Boutons Filtres / Épingler | P2 | Décoratifs |
| Catégorie Aide | P2 | Désactivée (decorative) |
| Captures par catégorie | P2 | `vm-kickoff.png` suffit pour clôture |
| Tokens `--opensuse-*` hérités | P2 | Renommage `--kde-neon-*` |

## Gates (2026-06-06)

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs   # OK
node usr/lib/capsuleos/tools/validate-all.mjs                    # OK
```

## Réouverture

Modifier l'inventaire JSON VM, regénérer `mainMenu-data.js`, ou rouvrir ce fichier en ⏳ si une régression visuelle est signalée.
