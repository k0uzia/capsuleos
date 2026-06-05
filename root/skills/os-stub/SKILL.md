---
name: capsuleos-os-stub
description: Template for adding a new simulated OS family to CapsuleOS—OS facade, usr/lib shell, root skill, familles-os index. Use when introducing ChromeOS, HarmonyOS, Arch Linux family entry, or any OS not yet covered by a dedicated os-* skill.
---

# Gabarit — nouvelle famille OS

## Checklist implémentation

0. **Onboarding** — [parcours-agent.md](../../docs/parcours-agent.md) H0–H4 ; [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md).
1. **Contrat** — lire `writing.md` §3 (familles) et §2 (fidélité).
2. **Façade** — `OS/<famille>/` avec `index.html` pointant vers scripts `usr/lib/`.
3. **Shell** — `usr/lib/capsuleos/shells/<famille>/` (mutualiser avec `common/`).
4. **Assets** — `usr/share/capsuleos/assets/` (packs `toolkits/`, `platforms/`) ; voir [politique-assets.md](../../docs/politique-assets.md).
5. **Home** — skin optionnel `home/<Vendor>/` ; contenu user partagé via `home/public/` si pertinent.
6. **Embed** — script build dans `usr/lib/capsuleos/tools/` + sortie `var/lib/capsuleos/generated/` si offline requis.
7. **Skill agent** — copier ce fichier vers `root/skills/os-<famille>/SKILL.md` avec frontmatter `name` / `description` à jour.
8. **Index** — `root/docs/familles-os.md`, `root/README.md`.
9. **Portail** — lier depuis `index.html` / pages OS existantes.

## Skill minimal (frontmatter)

```yaml
---
name: capsuleos-os-<famille>
description: Expert on CapsuleOS simulated <Famille> under OS/<famille>/.... Use when ...
---
```

## Interdits

- README ou doc dev sous `OS/`.
- Frameworks ou dépendances réseau obligatoires.

## Références existantes

- Linux : `os-linux`
- Extension planifiée : `os-chromeos`, `os-harmonyos`
