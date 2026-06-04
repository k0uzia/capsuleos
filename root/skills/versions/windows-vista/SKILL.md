---
name: capsuleos-version-windows-vista
description: CapsuleOS version slice Windows Vista (windows-vista) — extends distribution windows-vista. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-vista

## Lien catalogue

- Distribution parente : [`windows-vista`](../distributions/windows-vista/SKILL.md) (`capsuleos-distro-windows-vista`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows Vista**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-vista` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-vista` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

