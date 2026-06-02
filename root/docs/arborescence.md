# Arborescence CapsuleOS (vue agent)

Résumé pour naviguer le dépôt ; détail produit : [`README.md`](../../README.md).

## Couches

| Chemin | Rôle |
|--------|------|
| `index.html`, `sw.js`, `js/` | Portail, service worker |
| `OS/` | **Facades** stables (URLs, entrées bureaux) — pas de doc dev ici |
| `home/` | Skins par vendeur + **`home/public/`** (FS simulé partagé) |
| `usr/share/capsuleos/` | HTML/CSS apps, explorateurs, thèmes, branding |
| `usr/lib/capsuleos/` | JS shells, common, tools (build embed/manifest) |
| `var/lib/capsuleos/generated/` | `capsule-app-embed.js`, `capsule-android-embed.js`, etc. |
| `etc/capsuleos/` | Config (ex. `user-home.json`) |
| `root/` | **Ce dossier** — skills et doc agents uniquement |
| `LINUX-GUI-TOOLKITS.md` (racine dépôt) | GTK / Qt / Cinnamon / COSMIC — guide UX agents Linux |

## Flux typique Linux

1. Entrée : `OS/linux/families/<famille>/<distro>/index.html` ou miroir `home/<Vendor>/<Distro>/index.html`.
2. Noyau : `OS/linux/kernel/js/` + `usr/lib/capsuleos/shells/linux/`.
3. Apps partagées : `usr/share/capsuleos/linux/apps/` + `style/*.base.css` / skins `home/.../style/apps/*.skin.css`.
4. Explorateur : gabarits `usr/share/capsuleos/linux/explorers/` ; données `home/public/` + manifestes JSON.
5. Offline : régénérer embed après changement gabarits/public — voir README racine dépôt.

## `home/public/`

Contenu pédagogique **commun** Linux / Windows / macOS. Manifestes : `.capsule-manifest.json`, `.capsule-finder-manifest.json`. Outil : `usr/lib/capsuleos/tools/generate-public-manifest.mjs`.

## Tests locaux

```bash
cd CapsuleOS && python3 -m http.server 8765 --bind 127.0.0.1
```

(Depuis la racine workspace : chemin complet vers `CapsuleOS/`.)
