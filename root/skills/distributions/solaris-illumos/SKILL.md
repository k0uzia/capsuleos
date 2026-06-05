---
name: capsuleos-distro-solaris-illumos
description: CapsuleOS distribution Solaris / illumos (CDE aesthetic) (solaris-illumos) — unix, tier P4, stub. Use when editing solaris-illumos, shell toolkit, or oracle vendor assets.
---

# Distribution — Solaris / illumos (CDE aesthetic)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `solaris-illumos` |
| Vendor | [`oracle`](../vendors/oracle/SKILL.md) |
| Famille | `unix` |
| Tier / statut | P4 / stub |
| Toolkit | — |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-unix` (famille) |
| 3 | `capsuleos-vendor-oracle` (vendor) |
| 4 | `capsuleos-distro-solaris-illumos` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs solaris-illumos`

## Build / gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Ne pas

- Doc README sous `OS/`
- Médias hors `usr/share/capsuleos/assets/` et `home/public/Images/`

## Références

- [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md)
- [skills-hierarchie.md](../../docs/skills-hierarchie.md)

