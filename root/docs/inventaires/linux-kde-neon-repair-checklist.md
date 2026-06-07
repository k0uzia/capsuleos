# KDE neon User Edition — checklist réparation (juin 2026)

Référence visuelle : VM lab + captures `home/public/Images/screen_KDE-Neon/`.  
Skin canonique : `home/Debian/KDE-Neon/index.html` · Registre : `linux-kde-neon`.  
**HIG KDE** : [`kde-hig-ressources.md`](../kde-hig-ressources.md) · skill [`kde-hig-replication`](../../skills/kde-hig-replication/SKILL.md).

## Phase A — quick wins (sans VM)

| Zone | Action | Statut |
|------|--------|--------|
| Profil | `CAPSULE_TEMPLATE_OVERRIDES.update_manager` → Discover KDE | ✅ |
| Profil | `CAPSULE_CHECKLIST_STORAGE_KEY: kde-neon-checklist` | ✅ |
| Thème | Clé `kde-neon-theme` (index + `capsule-theme-storage.js`) | ✅ |
| Discover CSS | `update_manager.skin.css` scopé `body#kde-neon` | ✅ |
| Terminal CSS | Sélecteurs `#opensuse` → `#kde-neon` | ✅ |
| Dépendances | JS/CSS openSUSE copiés localement sous KDE-Neon | ✅ |
| Panel Firefox | Chemin `vendors/neon/panel/firefox.png` | ✅ VM 2026-06-06 |
| Fond bureau | `vendors/neon/wallpaper/neon-default.png` | ✅ VM 2026-06-06 |
| Façade | `sync-linux-skin-closure.mjs` | ✅ |
| `.cursor` | Symlink racine → `root/.cursor` (post-merge upstream) | ✅ 2026-06-06 |

## Phase B — Discover (clôturé)

| Zone | Action | Statut |
|------|--------|--------|
| Template | `update_manager_kde_neon.html` — 5 onglets | ✅ |
| JS | `discover-neon.js` — nav, render, titre, maximized | ✅ |
| Données | `discover-catalog.json` — VM noble/neon | ✅ |
| Assets | Icônes `vendors/neon/discover/` | ✅ |
| Captures | `capture-capsule-kde-neon.mjs` — 10 scènes Discover | ✅ |
| Doc | [`linux-kde-neon-discover-closure.md`](linux-kde-neon-discover-closure.md) | ✅ |
| Gates | `validate-all` + embed | ✅ |

## Phase C — Kickoff (clôturé)

| Zone | Action | Statut |
|------|--------|--------|
| Transparence | Alpha / blur menu vs VM | ✅ |
| Catégories | Icônes Breeze colorées pull VM | ✅ |
| Apps | 30 entrées depuis `linux-kde-neon-kickoff-apps.json` | ✅ |
| Générateur | `generate-kde-neon-kickoff-data.mjs` | ✅ |
| Favoris | Firefox, Config système, Dolphin, Discover | ✅ |

## Phase D — avec VM (clôturé Dolphin)

| Zone | Action | Statut |
|------|--------|--------|
| Inventaire | `vm-kde-neon-inventory.sh` → `-vm.json` complet | ✅ partiel (versions vides en SSH) |
| Assets | SCP / pull VM → `vendors/neon/` | ✅ |
| Parité | `inventaire-parite-neon.md` rempli | ✅ Discover + Kickoff + Panel + **Dolphin** |
| Tokens CSS | Renommer `--opensuse-*` → `--kde-neon-*` (optionnel P2) | ⏳ |

## Phase E — gates finales skin

```bash
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
# Comparaison visuelle VM ↔ http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html
```

- [x] Discover ouvre le gabarit KDE (pas GNOME Software)
- [x] Discover — 5 onglets, données VM, captures
- [x] Kickoff : transparence, icônes catégories, apps VM par catégorie
- [x] Panel : launcher, Dolphin, Firefox, Konsole, Discover (clic → bonne app)
- [x] Dolphin : navigation, vues, menus, split, sidebar Corbeille
- [x] Fond « Next » ou défaut Plasma Neon
- [x] Passage `status: active` via `reactivate-os.mjs linux-kde-neon` (2026-06-07)

## Commandes VM (rappel)

```bash
# Inventaire
ssh -i ~/.ssh/capsuleos-lab USER@IP 'bash -s' \
  < root/tools/lab/vm-kde-neon-inventory.sh \
  | python3 -m json.tool > root/docs/inventaires/linux-kde-neon-vm.json

# Captures CapsuleOS Discover
python3 -m http.server 5500
node root/tools/lab/capture-capsule-kde-neon.mjs

# Assets (manuel — voir usr/share/capsuleos/assets/images/vendors/neon/SOURCE-VM.txt)
scp -i ~/.ssh/capsuleos-lab USER@IP:/usr/share/wallpapers/Next/contents/images/5120x2880.png \
  usr/share/capsuleos/assets/images/vendors/neon/wallpaper/neon-default.png
```
