# openSUSE Tumbleweed — checklist réparation (post Phase 0.5)

Référence visuelle : captures `home/public/Images/screen_OpenSUSE/`.  
Skin canonique : `home/SUSE/openSUSE/index.html`.

## Écarts identifiés (audit code, juin 2026)

| Zone | Problème | Sévérité | Correctif |
|------|----------|----------|-----------|
| Boot | `CAPSULE_SKIN_PROFILE_ID` absent | Major | `linux-opensuse` avant `capsule-skin-boot` |
| Boot | `mainMenu.skin.css` absent du `<head>` | Blocker | Lien stylesheet head |
| Panel | Pas de `plasma-panel-mode.js` | Blocker | Module noyau partagé |
| Panel | Pas de `plasma-panel-dock.css` | Blocker | Import + tokens opensuse |
| Scripts | Ordre noyau vs KDE Neon | Major | Réordonnancement index |
| Menu | `resolveCapsuleResourceUrl` absent | Major | `mainMenu-plasma.js` |
| Panel UX | Discover décoratif (`<span>`) | Major | Lien `update_manager` |
| Panel UX | Konsole absent des pins | Major | Pin terminal |
| Panel UX | Show-desktop sans icône | Minor | `menu-burger.svg` |
| Profil | `CAPSULE_TERMINAL_PROFILE: debian` vs `suse.js` | Major | Profil `suse` |
| Profil | Pas de `CAPSULE_TEMPLATE_OVERRIDES` MAJ | Major | `update_manager_kde.html` |
| Façade | 33 fichiers fantômes sous `OS/.../opensuse/` | Major | Façade = index seul |
| CI | `validate-all` vert sans smoke Plasma | Major | `smoke-plasma-opensuse.mjs` |

## Statut post-réparation (juin 2026)

Correctifs appliqués sur `home/SUSE/openSUSE/` : boot profil, `plasma-panel-mode` noyau, dock CSS, menu Plasma (`resolveCapsuleResourceUrl`), panel UX (Discover, Konsole, show-desktop), façade réduite à `index.html` + `skin.profile.json`, smoke `smoke-plasma-opensuse.mjs`. `validate-all` et `validate-linux-facades` verts.

## Checklist parité (à valider manuellement)

### Panel

- [ ] Launcher Geeko ouvre le Kickoff
- [ ] Pins : pager (déco), Paramètres, Discover (cliquable), Dolphin, Firefox, Konsole
- [ ] Tray : MAJ, réseau, volume, horloge
- [ ] Show-desktop avec icône burger
- [ ] Fenêtre maximisée → panel pleine largeur

### Kickoff

- [ ] Popup positionnée au-dessus du panel (ancrage dock)
- [ ] En-tête : avatar utilisateur + recherche + filtres/épingler
- [ ] Catégories avec icônes KDE
- [ ] Favoris : Firefox, Kontact, Writer, Dolphin, Kate, Konsole, Paramètres…
- [ ] Pied : Veille, Redémarrer, Éteindre, Session

### Fenêtres

- [ ] Apps panel ouvrent les slots sous `object#desktop`
- [ ] Maximisation / restauration cohérente avec le panel

### Apps

- [ ] Dolphin, Firefox, Konsole, Paramètres, Discover (MAJ KDE)

## Gates techniques

```bash
node usr/lib/capsuleos/tools/lab/smoke-plasma-opensuse.mjs
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/linux/validate-linux-facades.mjs
```
