---
name: capsuleos-version-ios-18
description: CapsuleOS version slice iOS 18 (ios-18) — extends distribution ios-18. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — ios-18

## Lien catalogue

- Distribution parente : [`ios-18`](../distributions/ios-18/SKILL.md) (`capsuleos-distro-ios-18`)
- Vendor : [`apple`](../vendors/apple/SKILL.md)
- Libellé : **iOS 18**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `ios-18` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-ios-18` + skill famille `os-ios`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

