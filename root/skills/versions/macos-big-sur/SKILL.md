---
name: capsuleos-version-macos-big-sur
description: CapsuleOS version slice macOS Big Sur (macos-big-sur) — extends distribution macos-big-sur. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — macos-big-sur

## Lien catalogue

- Distribution parente : [`macos-big-sur`](../distributions/macos-big-sur/SKILL.md) (`capsuleos-distro-macos-big-sur`)
- Vendor : [`apple`](../vendors/apple/SKILL.md)
- Libellé : **macOS Big Sur**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `macos-big-sur` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-macos-big-sur` + skill famille `os-macos`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

