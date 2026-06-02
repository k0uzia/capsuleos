# Guide agents — sélection des skills `/root`

## Principe

CapsuleOS est un **rootfs web** : le code applicatif vit sous `CapsuleOS/` (`home/`, `usr/`, `OS/`, `var/`, `index.html`). Le dossier `root/` documente **comment** travailler sur ce dépôt, pas du code utilisateur final.

## Workflow de sélection

```
Demande utilisateur
       │
       ▼
  OS ciblé clair ? ──non──► skills/os-orchestrator
       │ oui
       ▼
  skills/os-<famille>
       │
       ▼
  Type de travail ?
       ├─ UI/parcours      → role-designer (+ role-web-designer si mise en page)
       ├─ code JS/HTML/CSS → role-developer
       ├─ assets visuels   → role-graphic-artist
       ├─ skin / façade    → role-integrator (+ os-*)
       ├─ planning/livrable → role-manager
       └─ multi-domaines   → coordinator
```

## Règles

1. **Contrat** : avant toute modification app, lire les sections pertinentes de [`writing.md`](../../writing.md) (workspace parent). Checklist : [`CONTRACT_CHECKLIST.md`](../CONTRACT_CHECKLIST.md).
2. **Un skill OS + un skill rôle** suffisent en général ; ajouter `coordinator` si la tâche touche plusieurs familles ou plusieurs rôles.
3. **Chemins** : éditer uniquement sous `CapsuleOS/` ; ne pas confondre `CapsuleOS/root/` avec `/root` de l’OS hôte.
4. **Doc développeur** : pas de nouveaux `README.md` sous `OS/` (règle projet) ; notes agents ici ou sous `root/docs/`.
5. **Français** : docs humaines en français ; skills en français pour cohérence équipe.
6. **Concision** : les `SKILL.md` sont des fiches opérationnelles, pas des encyclopédies — approfondir via les liens `docs/` et les README existants (`usr/share/capsuleos/linux/explorers/README.md`, etc.).

## Invocations explicites

L’utilisateur peut nommer un skill : « utilise le skill os-linux et role-integrator ». Sinon, déduire depuis la demande (ex. « icônes Fedora » → `os-linux` + `role-graphic-artist`).

## Fichiers de référence rapide

| Besoin | Fichier |
|--------|---------|
| Toolkits GUI Linux (GTK/Qt/Cinnamon/COSMIC) | [`LINUX-GUI-TOOLKITS.md`](../LINUX-GUI-TOOLKITS.md) |
| Home simulé partagé | `home/public/`, `usr/lib/capsuleos/common/user-home.js` |
| Explorateurs Linux | `usr/share/capsuleos/linux/explorers/`, `usr/lib/capsuleos/shells/linux/explorers/` |
| Embeds offline | `var/lib/capsuleos/generated/`, outils `usr/lib/capsuleos/tools/` |
| Facades URL | `OS/<famille>/` |
| Skins dérivés | `home/<Vendor>/` miroir des entrées sous `OS/linux/families/` |

## Extension

Nouvelle famille d’OS : copier la logique de [skills/os-stub/SKILL.md](skills/os-stub/SKILL.md), créer `skills/os-<nom>/`, mettre à jour [docs/familles-os.md](docs/familles-os.md) et [README.md](README.md).
