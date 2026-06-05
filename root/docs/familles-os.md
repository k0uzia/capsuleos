# Familles d’OS simulées

Cartographie **dépôt actuel** + extension prévue (`writing.md` §3).

> **Catalogue complet (57 entrées, 12 actives waves 1–5)** : [repertoire-os.md](repertoire-os.md) · [manifeste-kernels.md](manifeste-kernels.md) · JSON : [`etc/capsuleos/kernels.json`](../../etc/capsuleos/kernels.json) · [`etc/capsuleos/os-registry.json`](../../etc/capsuleos/os-registry.json)

| Famille | Facade `OS/` | Skins `home/` | Skill agent | Entrées actives |
|---------|--------------|---------------|-------------|-----------------|
| Linux Debian | `OS/linux/families/debian/*` | `home/Debian/*` | `os-linux` | 7 |
| Linux Red Hat | `OS/linux/families/redhat/*` | `home/RedHat/*` | `os-linux` | 2 |
| Linux SUSE | `OS/linux/families/suse/*` | `home/SUSE/*` | `os-linux` | 1 |
| Linux Arch | (prévu) | — | `os-linux` | 0 |
| Linux Slackware | (prévu) | — | `os-linux` | 0 |
| Windows | `OS/windows/versions/*`, `shared/` | — | `os-windows` | 11 |
| macOS | `OS/macos/` | `home/MacOS/` | `os-macos` | 1 |
| Android | `OS/android/` | — | `os-android` | 1 |
| iOS | `OS/ios/` | — | `os-ios` | 1 |
| BSD | `OS/bsd/` | — | `os-bsd` | 0 |
| Rocky (GNOME) | `OS/linux/families/redhat/rocky/` | `home/RedHat/Rocky/` | `os-linux` + vendor `rocky` | 1 (P1, référence GNOME) — [branche-redhat-gnome.md](branche-redhat-gnome.md) · [procédure lab](procedure-lab-linux-rocky-gnome.md) |
| UNIX | convention héritée / à structurer | — | `os-unix` | 0 |
| ChromeOS | non présent | — | `os-chromeos` → stub | 0 |
| HarmonyOS | non présent | — | `os-harmonyos` → stub | 0 |
| Rétro | `OS/retro/` (prévu) | — | `os-stub` | 0 |

## Commun inter-OS

- **`home/public/`** — arborescence utilisateur simulée (manifestes) — **pas** d'assets système.
- **`usr/share/capsuleos/assets/`** — icônes et images noyau ([manifest.json](../../usr/share/capsuleos/assets/manifest.json)).
- **`usr/lib/capsuleos/common/`** — noyau JS (`capsule-window.js`, `user-home.js`, …).
- **`etc/capsuleos/os-registry.json`** — répertoire machine-lisible.
- **Branding portail** — `usr/share/capsuleos/branding/`.

## Scalabilité & agents

- [scalabilite-noyau.md](scalabilite-noyau.md)
- [equipe-agentique.md](equipe-agentique.md)
- [manifeste-noyau.md](manifeste-noyau.md)

## Ajouter une famille

1. Enregistrer dans `usr/lib/capsuleos/tools/build-os-registry.mjs` → `node …/build-os-registry.mjs`.
2. Créer l’arborescence sous `OS/<famille>/` (façade) et assets sous `usr/share/capsuleos/assets/`.
3. Factoriser le JS dans `usr/lib/capsuleos/shells/<famille>/` si possible.
4. Dupliquer le pattern skill : `skills/os-stub/` → `skills/os-<famille>/`.
5. Mettre à jour [repertoire-os.md](repertoire-os.md) et ce fichier.
