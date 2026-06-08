# Recette régression — Rocky Linux (GNOME)

> **Registry** : `linux-rocky` · **Skin** : `home/RedHat/Rocky/` · **Toolkit** : GNOME / Nautilus  
> **Paradigme** : [paradigme-toolkit-de.md](paradigme-toolkit-de.md) · **Audit** : [inventaires/toolkit-cloisonnement-audit.md](inventaires/toolkit-cloisonnement-audit.md)

---

## Prérequis

```bash
python3 -m http.server 5501 --bind 127.0.0.1
```

URLs de test :

| Surface | URL |
|---------|-----|
| Skin (vérité) | `http://127.0.0.1:5501/home/RedHat/Rocky/index.html` |
| Façade pick-os | `http://127.0.0.1:5501/OS/linux/families/redhat/rocky/index.html` |

---

## Checklist gates (obligatoire)

- [ ] `node usr/lib/capsuleos/tools/validate-all.mjs` → exit 0
- [ ] `node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-rocky`
- [ ] `node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-rocky`
- [ ] `node usr/lib/capsuleos/tools/validate-toolkit-chrome-isolation.mjs`
- [ ] `node usr/lib/capsuleos/tools/validate-skin-vendor-isolation.mjs`
- [ ] Spot-check multi-DE : `node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --all`

---

## Checklist smokes Playwright

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-interactions.mjs --profile=linux-rocky
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-routing.mjs --profile=linux-rocky
```

Vérifications couvertes par `smoke-gnome-nautilus-interactions` :

- [ ] Ouverture slot `nemo` (gabarit `nemo-gnome`, classe `.nautilus-app--n47`)
- [ ] Sidebar : Récent, Corbeille, Bureau, Favoris (`data-link`)
- [ ] Menu contextuel `#nemo-context-menu` initialisé (`nemoContextMenuInit`)
- [ ] Headerbar : fil d'Ariane, recherche
- [ ] Nouveau dossier, raccourcis clavier, navigation sidebar

---

## Checklist fonctionnelle manuelle

### Nautilus (slot `nemo`)

- [ ] Clic droit grille → menu contextuel GNOME (pas menu Nemo Cinnamon)
- [ ] Clic droit corbeille sidebar → profil `trash`
- [ ] Recherche headerbar
- [ ] Chrome fenêtre Adwaita (headerbar, pas Muffin)

### Shell GNOME

- [ ] Top bar + horloge → calendrier ancré sous barre (`--fedora-top-bar-height`)
- [ ] Bouton Aperçu → overview + dash
- [ ] Tray : paramètres rapides / volume

### Apps

- [ ] Terminal (Ptyxis chrome)
- [ ] Firefox (variante GNOME)
- [ ] Calculatrice GNOME si slot présent

### Cloisonnement

- [ ] Aucune réf. `toolkits/cinnamon`, `mint-panel`, `mainMenu-data-cinnamon` dans skin Rocky
- [ ] Icônes Adwaita (`icons/gnome/adwaita`) — pas de fuite Cinnamon
- [ ] `--taskbar-height` redéfini localement (`tokens.css`) — pas d'héritage portail Mint

---

## Captures checkpoint (optionnel P1)

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-rocky --compare
# Rafraîchir baseline après changement visuel validé :
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-rocky --write-baseline
```

Surfaces : `01-desktop-shell`, `02-overview`, `03-nemo`, `04-firefox`, `05-terminal`.

---

## Clôture après modifs skin

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/sync-all-views.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## Dernière passe (2026-06-08)

| Gate / smoke | Résultat |
|--------------|----------|
| `validate-all` | OK |
| `validate-toolkit-paradigm --id linux-rocky` | OK |
| `validate-toolkit-paradigm --all` | OK (mint, rocky, ubuntu, debian-kde) |
| `validate-clone-assets --id linux-rocky` | OK |
| `smoke-gnome-nautilus-interactions` | OK |
| `smoke-gnome-nautilus-routing` | OK |
| Fix `--taskbar-height` portail → `--fedora-top-bar-height` | Appliqué `tokens.css` |
| Score cloisonnement | **96/100** (P2 Mint CSS chemins physiques inchangés — pas d'import partagé Rocky) |
