---
name: capsuleos-version-macos-monterey
description: CapsuleOS version slice macOS Monterey (macos-monterey) — extends distribution macos-monterey. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — macos-monterey

## Lien catalogue

- Distribution parente : [`macos-monterey`](../distributions/macos-monterey/SKILL.md) (`capsuleos-distro-macos-monterey`)
- Vendor : [`apple`](../vendors/apple/SKILL.md)
- Libellé : **macOS Monterey**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `macos-monterey` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-macos-monterey` + skill famille `os-macos`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

