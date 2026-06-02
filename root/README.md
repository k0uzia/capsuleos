# `/root` — équipe experte agents CapsuleOS

Répertoire **métaphorique** (racine Linux du dépôt), distinct du `/root` système de la machine hôte. Il regroupe la documentation humaine et les **skills Cursor** pour composer une équipe d’agents : design, développement, gestion, graphisme, web design, intégration, et expertise par famille d’OS simulée.

## Arborescence

```
root/
├── README.md          ← vous êtes ici
├── AGENTS.md          ← comment choisir les skills
├── docs/              ← contexte architecture (français)
├── team/              ← fiches rôles humains
└── skills/            ← SKILL.md (convention Cursor)
    ├── coordinator/
    ├── role-*/
    ├── os-orchestrator/
    └── os-*/
```

## Démarrage agent

1. Lire [AGENTS.md](AGENTS.md).
2. Respecter le contrat applicatif : [`writing.md`](../../writing.md) (racine workspace) — **ne pas le dupliquer** ici.
3. Checklist release : [`CONTRACT_CHECKLIST.md`](../CONTRACT_CHECKLIST.md).
4. Charger le skill **rôle** + skill **OS** pertinents sous `skills/`.

## Rôles (`skills/role-*`)

| Skill | Public |
|-------|--------|
| [role-designer](skills/role-designer/SKILL.md) | UX, parcours pédagogique, fidélité perceptible |
| [role-developer](skills/role-developer/SKILL.md) | HTML/CSS/ES6, noyau, embeds, SW |
| [role-manager](skills/role-manager/SKILL.md) | Périmètre, priorisation, checklist contrat |
| [role-graphic-artist](skills/role-graphic-artist/SKILL.md) | Icônes, assets, `.skin.css`, médias |
| [role-web-designer](skills/role-web-designer/SKILL.md) | Mise en page, variables CSS, responsive |
| [role-integrator](skills/role-integrator/SKILL.md) | Skins, `OS/` ↔ `home/`, manifests, embeds |
| [coordinator](skills/coordinator/SKILL.md) | Délégation multi-rôles / multi-OS |

## OS (`skills/os-*`)

| Skill | État dépôt (indicatif) |
|-------|-------------------------|
| [os-orchestrator](skills/os-orchestrator/SKILL.md) | Routeur — toujours en premier si OS incertain |
| [os-linux](skills/os-linux/SKILL.md) | `OS/linux/`, familles debian/redhat/suse |
| [os-windows](skills/os-windows/SKILL.md) | `OS/windows/` |
| [os-macos](skills/os-macos/SKILL.md) | `OS/macos/`, `home/MacOS/` |
| [os-android](skills/os-android/SKILL.md) | `OS/android/` |
| [os-ios](skills/os-ios/SKILL.md) | `OS/ios/` |
| [os-bsd](skills/os-bsd/SKILL.md) | `OS/bsd/` |
| [os-unix](skills/os-unix/SKILL.md) | Convention / extension |
| [os-chromeos](skills/os-chromeos/SKILL.md) | À venir — voir [os-stub](skills/os-stub/SKILL.md) |
| [os-harmonyos](skills/os-harmonyos/SKILL.md) | À venir — voir [os-stub](skills/os-stub/SKILL.md) |
| [os-stub](skills/os-stub/SKILL.md) | Gabarit nouvelle famille |

Index détaillé : [docs/familles-os.md](docs/familles-os.md).

## Documentation

- [docs/roadmap.md](docs/roadmap.md) — plan de livraison et jalons
- [docs/apps-linux-par-distro.md](docs/apps-linux-par-distro.md) — apps par défaut et mappings Linux
- [docs/arborescence.md](docs/arborescence.md) — `home/`, `usr/`, `OS/`, `var/`
- [docs/contrat-liens.md](docs/contrat-liens.md) — liens vers `writing.md` et checklist
- [team/equipe.md](team/equipe.md) — collaboration entre rôles

## Cursor

Règle workspace (optionnelle) : `.cursor/rules/capsuleos-agent-root.mdc` pointe vers ce dossier lors des tâches CapsuleOS.
