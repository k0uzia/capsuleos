---
name: capsuleos-version-windows-98
description: CapsuleOS version slice Windows 98 (windows-98) — extends distribution windows-98. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — windows-98

## Lien catalogue

- Distribution parente : [`windows-98`](../distributions/windows-98/SKILL.md) (`capsuleos-distro-windows-98`)
- Vendor : [`microsoft`](../vendors/microsoft/SKILL.md)
- Libellé : **Windows 98**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `windows-98` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-windows-98` + skill famille `os-windows`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

