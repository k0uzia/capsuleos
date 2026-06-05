---
name: capsuleos-version-windows-xp
description: CapsuleOS version slice Windows XP (windows-xp) — extends distribution windows-xp. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-xp

## Lien catalogue

- Distribution parente : [`windows-xp`](../distributions/windows-xp/SKILL.md) (`capsuleos-distro-windows-xp`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows XP**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-xp` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-xp` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

