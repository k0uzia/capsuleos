---
name: capsuleos-version-windows-95
description: CapsuleOS version slice Windows 95 (windows-95) — extends distribution windows-95. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-95

## Lien catalogue

- Distribution parente : [`windows-95`](../distributions/windows-95/SKILL.md) (`capsuleos-distro-windows-95`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows 95**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-95` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-95` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

