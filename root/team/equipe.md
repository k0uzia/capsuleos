# Équipe experte (rôles)

Chaque rôle correspond à un skill sous `root/skills/role-*`. Un agent peut en combiner plusieurs via `coordinator`.

| Rôle | Mission sur CapsuleOS | Skill |
|------|------------------------|-------|
| **Designer** | Parcours pédagogique, clarté, fidélité perceptible des bureaux | `role-designer` |
| **Développeur** | HTML/CSS/ES6, shells, SW, embeds, mutualisation | `role-developer` |
| **Manager** | Périmètre, priorisation, checklist contrat, release | `role-manager` |
| **Graphiste** | Icônes SVG/PNG, wallpapers, cohérence visuelle OS | `role-graphic-artist` |
| **Web designer** | Grilles, variables CSS, responsive, ordre des propriétés | `role-web-designer` |
| **Intégrateur** | Lier façade `OS/`, skin `home/`, manifests, scripts skin | `role-integrator` |
| **Coordinateur** | Découper une demande multi-OS / multi-rôle | `coordinator` |

## Collaboration type

- **Nouvelle skin Linux** : intégrateur + os-linux ; graphiste pour `media/` ; web designer pour `style/` ; développeur pour hooks `CAPSULE_*`.
- **Contenu pédagogique** : designer + intégrateur (`home/public/`) ; régénérer manifestes.
- **Version Windows** : os-windows + web designer + développeur (`usr/lib/capsuleos/shells/windows/`).

Voir [AGENTS.md](../AGENTS.md) pour l’arbre de décision.
