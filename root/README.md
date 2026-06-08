# `/root` — équipe experte agents CapsuleOS

Répertoire **métaphorique** (racine Linux du dépôt), distinct du `/root` système de la machine hôte. Il regroupe la documentation humaine et les **skills Cursor** pour composer une équipe d’agents : design, développement, gestion, graphisme, web design, intégration, et expertise par famille d’OS simulée.

**Point d’entrée contributeur (racine dépôt)** : [contrib.md](../contrib.md)

## Arborescence

```
root/
├── README.md          ← vous êtes ici
├── AGENTS.md          ← comment choisir les skills
├── docs/              ← contexte architecture (français)
├── team/              ← fiches rôles humains
└── skills/            ← SKILL.md (convention Cursor)
    ├── onboarding/
    ├── link-routing/
    ├── kernel-supervisor/
    ├── asset-pipeline/
    ├── kernel-guardian/
    ├── coordinator/
    ├── role-*/
    ├── os-orchestrator/
    └── os-*/
```

## Démarrage agent

1. **[docs/README.md](docs/README.md)** — corpus unique, vision technique, **P12 clean code**.
2. **[logique-formelle.md](docs/logique-formelle.md)** — gates & décision autonome.
3. Skill **[onboarding](skills/onboarding/SKILL.md)** + [parcours-agent.md](docs/parcours-agent.md) (H0→H6).
4. Lire [AGENTS.md](AGENTS.md) pour le routage skills.
5. **Clone / parité VM** : [plan-maitre-reproduction-os.md](docs/plan-maitre-reproduction-os.md) · [convention-reproduction-os.md](docs/convention-reproduction-os.md) · skill **[os-clone-from-vm](skills/os-clone-from-vm/SKILL.md)**.
6. Contrat : [`writing.md`](../../writing.md) · [convention-clean-code.md](docs/convention-clean-code.md) · [checklist](../contrib.md#checklist-contrat-avant-merge-ou-release).
7. Gate : `node usr/lib/capsuleos/tools/validate-all.mjs`.
8. Pipeline : `run-capsule-pipeline.mjs --id <registryId>`.
9. Nouveau catalogue OS : [ajouter-os-scalable.md](docs/ajouter-os-scalable.md).
10. Charger skill **rôle** + skill **OS** (ou `kernel-supervisor` si assets).

## Rôles (`skills/role-*`)

| Skill | Public |
|-------|--------|
| [role-designer](skills/role-designer/SKILL.md) | UX, parcours pédagogique, fidélité perceptible |
| [role-developer](skills/role-developer/SKILL.md) | HTML/CSS/ES6, noyau, embeds, SW |
| [role-manager](skills/role-manager/SKILL.md) | Périmètre, priorisation, checklist contrat |
| [role-graphic-artist](skills/role-graphic-artist/SKILL.md) | Icônes, assets, `.skin.css`, médias |
| [role-web-designer](skills/role-web-designer/SKILL.md) | Mise en page, variables CSS, responsive |
| [role-integrator](skills/role-integrator/SKILL.md) | Skins, `OS/` ↔ `home/`, manifests, embeds |
| [kernel-supervisor](skills/kernel-supervisor/SKILL.md) | Migration assets noyau, gate validate-asset-zones, orchestration |
| [asset-pipeline](skills/asset-pipeline/SKILL.md) | Copie / rewrite / manifest sous mandat superviseur |
| [kernel-guardian](skills/kernel-guardian/SKILL.md) | Intégrité JS noyau, embeds, régression Mint |
| [coordinator](skills/coordinator/SKILL.md) | Délégation multi-rôles / multi-OS (produit) |

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

- [docs/convention-reproduction-os.md](docs/convention-reproduction-os.md) — **contrat clone OS** (agents IA, CSS/JS, workflow VM)
- [docs/manifeste-noyau.md](docs/manifeste-noyau.md) — vision noyau, hydratation, assets
- [docs/manifeste-kernels.md](docs/manifeste-kernels.md) — taxonomie kernels/branches (8 entrées actives, waves 1–2)
- [docs/repertoire-os.md](docs/repertoire-os.md) — catalogue OS (57 entrées, tiers P0–P4)
- [docs/scalabilite-noyau.md](docs/scalabilite-noyau.md) — scale statique, embeds partitionnés
- [docs/equipe-agentique.md](docs/equipe-agentique.md) — staffing agents à l'échelle
- [docs/parcours-agent.md](docs/parcours-agent.md) — formation H0–H6 avant action
- [docs/ajouter-os-scalable.md](docs/ajouter-os-scalable.md) — distro, version, vendor, toolkit
- [contrib.md § toolkits Linux](../contrib.md#bibliotheques-graphiques-linux-toolkits-gui) — GTK, Qt, Cinnamon, COSMIC (agents UX/CSS)
- [docs/roadmap.md](docs/roadmap.md) — plan de livraison et jalons
- [docs/apps-linux-par-distro.md](docs/apps-linux-par-distro.md) — apps par défaut et mappings Linux
- [docs/arborescence.md](docs/arborescence.md) — `home/`, `usr/`, `OS/`, `var/`
- [docs/contrat-liens.md](docs/contrat-liens.md) — liens vers `writing.md` et checklist
- [docs/lab-vm-rhel-wayland.md](docs/lab-vm-rhel-wayland.md) — VM Rocky/Alma/RHEL, SSH, Wayland, inventaire lab
- [team/equipe.md](team/equipe.md) — collaboration entre rôles

## Cursor

Règle workspace (optionnelle) : `.cursor/rules/capsuleos-agent-root.mdc` pointe vers ce dossier lors des tâches CapsuleOS.
