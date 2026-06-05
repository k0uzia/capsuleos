---
name: capsuleos-version-windows-10
description: CapsuleOS version slice Windows 10 (windows-10) — extends distribution windows-10. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-10

## Lien catalogue

- Distribution parente : [`windows-10`](../distributions/windows-10/SKILL.md) (`capsuleos-distro-windows-10`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows 10**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-10` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-10` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

