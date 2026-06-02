# Familles d’OS simulées

Cartographie **dépôt actuel** + extension prévue (`writing.md` §3).

| Famille | Facade `OS/` | Skins `home/` | Skill agent |
|---------|--------------|---------------|-------------|
| Linux Debian | `OS/linux/families/debian/*` | `home/Debian/*` | `os-linux` |
| Linux Red Hat | `OS/linux/families/redhat/*` | `home/RedHat/*` | `os-linux` |
| Linux SUSE | `OS/linux/families/suse/*` | `home/SUSE/*` | `os-linux` |
| Linux Arch | (prévu) | — | `os-linux` |
| Linux Slackware | (prévu) | — | `os-linux` |
| Windows | `OS/windows/versions/*`, `shared/` | — | `os-windows` |
| macOS | `OS/macos/` | `home/MacOS/` | `os-macos` |
| Android | `OS/android/` | — | `os-android` |
| iOS | `OS/ios/` | — | `os-ios` |
| BSD | `OS/bsd/` | — | `os-bsd` |
| UNIX | convention héritée / à structurer | — | `os-unix` |
| ChromeOS | non présent | — | `os-chromeos` → stub |
| HarmonyOS | non présent | — | `os-harmonyos` → stub |

## Commun inter-OS

- **`home/public/`** — arborescence utilisateur simulée (manifestes).
- **`usr/lib/capsuleos/common/`** — ex. `user-home.js`, `window-drag.js`.
- **Branding** — `usr/share/capsuleos/branding/`.

## Ajouter une famille

1. Créer l’arborescence sous `OS/<famille>/` (façade) et assets associés.
2. Factoriser le JS dans `usr/lib/capsuleos/shells/<famille>/` si possible.
3. Dupliquer le pattern skill : `skills/os-stub/` → `skills/os-<famille>/`.
4. Mettre à jour ce fichier et `root/README.md`.
