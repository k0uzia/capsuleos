# KDE neon User Edition — checklist réparation (juin 2026)

Référence visuelle : VM lab + captures futures `home/public/Images/screen_KDE-Neon/`.  
Skin canonique : `home/Debian/KDE-Neon/index.html` · Registre : `linux-kde-neon`.

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

## Phase B — avec VM (ground truth)

| Zone | Action | Statut |
|------|--------|--------|
| Inventaire | `vm-kde-neon-inventory.sh` → `-vm.json` complet | ✅ partiel (versions vides en SSH) |
| Assets | SCP / pull VM → `vendors/neon/` | ✅ |
| Kickoff | Favoris + dimensions popup (677×509) depuis VM | ⏳ |
| Parité | `inventaire-parite-neon.md` rempli | ⏳ |
| Tokens CSS | Renommer `--opensuse-*` → `--kde-neon-*` (optionnel P2) | ⏳ |

## Phase C — gates finales

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
# Comparaison visuelle VM ↔ http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html
```

- [ ] Panel : launcher, Dolphin, Firefox, Konsole, Discover
- [ ] Kickoff : recherche, catégories, favoris VM, pied alimentation
- [ ] Discover ouvre le gabarit KDE (pas GNOME Software)
- [ ] Fond « Next » ou défaut Plasma Neon
- [ ] Passage `status: active` dans `os-registry.json` (après parité P0)

## Commandes VM (rappel)

```bash
# Inventaire
ssh -i ~/.ssh/capsuleos-lab USER@IP 'bash -s' \
  < root/tools/lab/vm-kde-neon-inventory.sh \
  | python3 -m json.tool > root/docs/inventaires/linux-kde-neon-vm.json

# Assets (manuel — voir usr/share/capsuleos/assets/images/vendors/neon/SOURCE-VM.txt)
scp -i ~/.ssh/capsuleos-lab USER@IP:/usr/share/wallpapers/Next/contents/images/5120x2880.png \
  usr/share/capsuleos/assets/images/vendors/neon/wallpaper/neon-default.png
```
