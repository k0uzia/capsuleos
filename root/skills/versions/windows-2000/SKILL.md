---
name: capsuleos-version-windows-2000
description: CapsuleOS version slice Windows 2000 (windows-2000) — extends distribution windows-2000. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-2000

## Lien catalogue

- Distribution parente : [`windows-2000`](../distributions/windows-2000/SKILL.md) (`capsuleos-distro-windows-2000`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows 2000**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-2000` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-2000` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

