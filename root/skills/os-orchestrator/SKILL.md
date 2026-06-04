---
name: capsuleos-os-orchestrator
description: Routes CapsuleOS work to the correct per-OS skill under root/skills/os-*. Use when the simulated OS family is unclear, multiple OS are mentioned, or starting any OS-specific desktop task.
---

# Orchestrateur OS CapsuleOS

Si première intervention ou **nouvel OS** : invoquer d’abord `onboarding` ([parcours-agent.md](../../docs/parcours-agent.md)).

## Choisir un skill enfant

| Indices dans la demande | Skill |
|-------------------------|--------|
| Mint, Ubuntu, Debian, Fedora, openSUSE, Nemo, Dolphin, GNOME Linux | `os-linux` |
| Windows, Explorateur, barre des tâches Win | `os-windows` |
| macOS, Finder, Sonoma | `os-macos` |
| Android, APK, Material | `os-android` |
| iPhone, iOS | `os-ios` |
| FreeBSD, GhostBSD | `os-bsd` |
| UNIX générique, Solaris-like (extension) | `os-unix` |
| Chromebook, ChromeOS | `os-chromeos` |
| Harmony, Huawei | `os-harmonyos` |
| Nouvelle famille | `os-stub` |

## Commun à toutes les familles

- **`home/public/`** — données utilisateur simulées partagées.
- **`usr/lib/capsuleos/common/user-home.js`** — résolution chemins repo.
- **Contrat** — `writing.md` ; pas de doc sous `OS/`.

## Index

[docs/familles-os.md](../../docs/familles-os.md)

Après routage :

1. Skill `os-<famille>` (shell, embeds, conventions famille)
2. Skill `capsuleos-vendor-<vendor>` si vendor connu ([vendors/](../vendors/))
3. Skill `capsuleos-distro-<registry-id>` pour l’entrée ciblée ([distributions/](../distributions/))
4. Skill `capsuleos-version-<slug>` si version explicite (Windows 11, Sonoma, …)
5. Skill `capsuleos-lang-*` selon langage édité
6. Skill `role-*` adapté

Index : [skills-hierarchie.md](../../docs/skills-hierarchie.md) · `node usr/lib/capsuleos/tools/seed-agent-skills.mjs --write`
