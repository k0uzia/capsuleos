---
name: capsuleos-version-macos-sequoia
description: CapsuleOS version slice macOS Sequoia (macos-sequoia) — extends distribution macos-sequoia. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — macos-sequoia

## Lien catalogue

- Distribution parente : [`macos-sequoia`](../distributions/macos-sequoia/SKILL.md) (`capsuleos-distro-macos-sequoia`)
- Vendor : [`apple`](../vendors/apple/SKILL.md)
- Libellé : **macOS Sequoia**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `macos-sequoia` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-macos-sequoia` + skill famille `os-macos`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

