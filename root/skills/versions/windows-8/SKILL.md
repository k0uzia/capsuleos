---
name: capsuleos-version-windows-8
description: CapsuleOS version slice Windows 8 (windows-8) — extends distribution windows-8. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-8

## Lien catalogue

- Distribution parente : [`windows-8`](../distributions/windows-8/SKILL.md) (`capsuleos-distro-windows-8`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows 8**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-8` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-8` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

