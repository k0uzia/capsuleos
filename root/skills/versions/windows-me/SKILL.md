---
name: capsuleos-version-windows-me
description: CapsuleOS version slice Windows ME (windows-me) — extends distribution windows-me. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-me

## Lien catalogue

- Distribution parente : [`windows-me`](../distributions/windows-me/SKILL.md) (`capsuleos-distro-windows-me`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows ME**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-me` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-me` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

