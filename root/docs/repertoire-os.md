# Répertoire des systèmes d'exploitation CapsuleOS

Catalogue **exhaustif et évolutif** des OS simulés — humain + machine.  
Source JSON : [`etc/capsuleos/os-registry.json`](../../etc/capsuleos/os-registry.json) (régénérer via `build-os-registry.mjs`).  
Sourcing design & licences : [`etc/capsuleos/os-sourcing.json`](../../etc/capsuleos/os-sourcing.json).

**Documents liés** : [manifeste-noyau.md](manifeste-noyau.md) · [scalabilite-noyau.md](scalabilite-noyau.md) · [equipe-agentique.md](equipe-agentique.md) · [familles-os.md](familles-os.md)

---

## Statistiques (juin 2026 — waves 1–5)

| Métrique | Valeur |
|----------|--------|
| Entrées totales | 57 |
| Actives (pick-os) | **12** |
| Planifiées | 38 |
| Stubs / recherche | 11 |
| Kernels | 15 |
| Branches Linux | 12 |

### Catalogue pick-os (waves 1–5)

| ID | Famille | Wave |
|----|---------|------|
| `linux-mint` | Linux | 1 |
| `linux-ubuntu` | Linux | 1 |
| `linux-opensuse` | Linux | 1 |
| `windows-11` | Windows | 1 |
| `windows-10` | Windows | 1 |
| `macos-sonoma` | macOS | 1 |
| `ios-15` | iOS | 1 |
| `linux-fedora` | Linux | 2 |
| `linux-rocky` | Linux | 3 (référence GNOME) |
| `linux-alma` | Linux | 4 (dérivé Rocky) |
| `linux-anduinos` | Linux | 5 |
| `linux-popos` | Linux | 5 (COSMIC) |

> Skins archivés : `?devSkin=<id>`. Réactivation d’une entrée : `reactivate-os.mjs`. Voir [manifeste-kernels.md](manifeste-kernels.md).

---

## Niveaux de priorité (tiers)

| Tier | Signification | Exemples |
|------|---------------|----------|
| **P0** | Référence pédagogique — régression interdite | Linux Mint |
| **P1** | Production — checklist missions | Ubuntu, Rocky GNOME, MX-KDE, Windows 11, Android |
| **P2** | Prochaine vague — forte demande terrain | Arch, elementary, ChromeOS, macOS Sequoia |
| **P3** | Extension catalogue | Zorin, iOS 17, FreeBSD |
| **P4** | Recherche — faisabilité sans engagement UX | NixOS, Haiku, HarmonyOS, ReactOS |

---

## Linux — actifs

| ID | Nom | Toolkit | Shell | Explorateur | Maturité | Façade |
|----|-----|---------|-------|-------------|----------|--------|
| `linux-mint` | Linux Mint | Cinnamon | cinnamon | Nemo | 95 % | `OS/linux/families/debian/mint/` |
| `linux-ubuntu` | Ubuntu 25.10 | GNOME | gnome-shell | Fichiers | 75 % | `.../ubuntu/` |
| `linux-rocky` | Rocky Linux | GNOME | gnome-shell | Nautilus | 80 % | `.../rocky/` |
| `linux-fedora` | Fedora | GNOME | gnome-shell | Fichiers | 65 % | `.../fedora/` |
| `linux-mx-kde` | MX Linux KDE | KDE | Plasma | Dolphin | 85 % | `.../mx-kde/` |
| `linux-debian-kde` | Debian KDE | KDE | Plasma | Dolphin | 70 % | `.../debian-kde/` |
| `linux-opensuse` | openSUSE | KDE | Plasma | Dolphin | 85 % | `.../opensuse/` |
| `linux-popos` | Pop!_OS | COSMIC | cosmic | Fichiers COSMIC | 55 % | `.../popos/` |
| `linux-anduinos` | AnduinOS | GNOME-like | anduin-shell | Fichiers | 50 % | `.../anduinos/` |

## Linux — planifiés (extrait)

| ID | Nom | Toolkit | Tier | Sources design |
|----|-----|---------|------|----------------|
| `linux-arch` | Arch Linux | configurable | P2 | [Arch Wiki](https://wiki.archlinux.org/) |
| `linux-elementary` | elementary OS | Pantheon | P2 | [elementary HIG](https://docs.elementary.io/hig/) |
| `linux-manjaro-kde` | Manjaro KDE | KDE | P2 | Plasma / Breeze |
| `linux-steamos` | SteamOS | KDE + Gamescope | P3 | Steam Deck UI |
| `linux-slackware` | Slackware | Xfce | P4 | Xfce docs |
| `linux-nixos` | NixOS (concept) | — | P4 | NixOS manual |

---

## Windows — actifs (11 versions)

| ID | Version | Shell simulé | Tier | Façade |
|----|---------|--------------|------|--------|
| `windows-95` … `windows-me` | 9x / NT4 era | classique | P2 | `OS/windows/versions/{95,98,me,2000}/` |
| `windows-xp` | XP | Luna / Royale | P1 | `.../xp/` |
| `windows-vista` … `windows-8.1` | Aero / Metro | P2 | `.../vista/` … `8.1/` |
| `windows-10` | 10 | Fluent | P1 | `.../10/` |
| `windows-11` | 11 | Win11 | P1 | `.../11/` |

**Source design** : [Microsoft Windows app design](https://learn.microsoft.com/windows/apps/design/)  
**Noyau partagé** : `OS/windows/kernel/js/`, `CapsuleWindow`, `windowManager.js`

---

## macOS & iOS

| ID | Nom | Statut | Tier | Sources |
|----|-----|--------|------|---------|
| `macos-sonoma` | macOS Sonoma | actif | P1 | [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/) |
| `macos-sequoia` | macOS Sequoia | planifié | P2 | idem |
| `macos-ventura` | macOS Ventura | planifié | P2 | idem |
| `macos-monterey` | macOS Monterey | planifié | P3 | idem |
| `ios-15` | iOS 15 | actif (minimal) | P2 | Apple HIG / iOS patterns |
| `ios-17` / `ios-18` | iOS récents | planifié | P3 | idem |

---

## Mobile & autres

| ID | Famille | Statut | Toolkit | Sources |
|----|---------|--------|---------|---------|
| `android-vanilla` | Android | actif | Material You | [Material Design 3](https://m3.material.io/) |
| `android-lineage` | Android | planifié | AOSP | AOSP / Lineage |
| `chromeos` | ChromeOS | planifié | Chrome shell | [Chromium OS](https://www.chromium.org/chromium-os/) |
| `freebsd` … `ghostbsd` | BSD | planifié | variable | FreeBSD Handbook |
| `harmonyos` | HarmonyOS | stub | — | docs Huawei (usage restreint) |
| `haiku` / `reactos` | Rétro | stub | — | communautés respectives |

---

## Toolkits transverses

Un **toolkit** = contrat visuel + pack assets + gabarits apps réutilisables.

| Toolkit ID | DE / shell réel | Templates explorateur | Pack assets |
|------------|-----------------|----------------------|-------------|
| `cinnamon` | Cinnamon | `nemo` | `toolkits/cinnamon` |
| `gnome` | GNOME 46+ | `nemo-gnome`, `nemo` | `toolkits/gnome` |
| `kde` | Plasma 6 / Breeze | `dolphin` | `toolkits/kde` + `icons/kde` |
| `cosmic` | Pop!_OS COSMIC | `nemo-cosmic` | `toolkits/cosmic` |
| `pantheon` | elementary | `nemo-gnome` | `toolkits/pantheon` |
| `xfce` | Xfce | `nemo` (Thunar-like) | `toolkits/xfce` |
| `windows-shell` | Win32 / WinUI | — | `toolkits/windows` |
| `macos-aqua` | Aqua | — | `toolkits/macos-aqua` |
| `android-material` | Material You | — | `toolkits/android-material` |

**Règle de scalabilité** : ajouter une distro = choisir un toolkit existant + surcouche `vendors/<nom>` — pas un fork noyau.

---

## Contrat par entrée (champs JSON)

Chaque entrée du registre expose :

```json
{
  "id": "linux-mx-kde",
  "family": "linux",
  "displayName": "MX Linux KDE",
  "tier": "P1",
  "status": "active",
  "maturity": 0.85,
  "facade": "OS/linux/families/debian/mx-kde/index.html",
  "skin": "home/Debian/MX-KDE/index.html",
  "toolkit": "kde",
  "shell": "plasma",
  "fileManager": "Dolphin",
  "explorerTemplate": "dolphin",
  "embedKey": "mxkde",
  "bodyId": "mx-kde",
  "skills": ["os-linux"],
  "sources": [{ "type": "hig", "label": "…", "url": "…" }]
}
```

Profil skin complet (évolution) : [`etc/capsuleos/examples/mint.skin.profile.json`](../../etc/capsuleos/examples/mint.skin.profile.json)

---

## Workflow ajout d'un OS

1. **Enregistrer** l'entrée dans `build-os-registry.mjs` → régénérer JSON.
2. **Choisir** toolkit + packs assets (`assets/manifest.json`).
3. **Créer** façade `OS/<famille>/…/index.html` + miroir `home/` si Linux.
4. **Déclarer** `skin.profile.json` (ou variables `CAPSULE_*` dans index).
5. **Staffer** agents : skill `os-<famille>` + rôle (integrator / designer / developer).
6. **Valider** : `node usr/lib/capsuleos/tools/validate-all.mjs` ; offline `file://`, embed ; [ajouter-os-scalable.md](ajouter-os-scalable.md).
7. **Documenter** sources design + licence icônes.

---

## Commandes

```bash
# Régénérer le répertoire OS
node usr/lib/capsuleos/tools/build-os-registry.mjs

# Lister les entrées actives (jq)
jq '.entries[] | select(.status=="active") | .id' etc/capsuleos/os-registry.json
```

---

## Sourcing & licences assets

| Type | Source recommandée | Licence |
|------|-------------------|---------|
| Icônes KDE | Breeze, Papirus | LGPL / CC-BY-SA |
| Icônes GNOME | Adwaita, Symbolic | LGPL / CC-BY-SA |
| Material Android | Material Symbols | Apache 2.0 |
| Windows / macOS | **Recreation stylisée** CapsuleOS | Original — pas de pixels Apple/Microsoft |
| Logos distro | Branding officiel (usage éducatif) | Vérifier charte marque |

> CapsuleOS enseigne les **gestes** et la **structure** — pas la copie pixel-par-pixel de marques déposées.

*Révision : après chaque nouvelle entrée `status: active`.*
