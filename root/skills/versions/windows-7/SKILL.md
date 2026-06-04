---
name: capsuleos-version-windows-7
description: CapsuleOS version slice Windows 7 (windows-7) — extends distribution windows-7. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-7

## Lien catalogue

- Distribution parente : [`windows-7`](../distributions/windows-7/SKILL.md) (`capsuleos-distro-windows-7`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows 7**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-7` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-7` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

