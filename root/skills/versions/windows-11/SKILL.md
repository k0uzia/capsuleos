---
name: capsuleos-version-windows-11
description: CapsuleOS version slice Windows 11 (windows-11) — extends distribution windows-11. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-11

## Lien catalogue

- Distribution parente : [`windows-11`](../distributions/windows-11/SKILL.md) (`capsuleos-distro-windows-11`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows 11**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-11` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-11` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

