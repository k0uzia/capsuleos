---
name: capsuleos-version-ios-15
description: CapsuleOS version slice iOS 15 (ios-15) — extends distribution ios-15. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — ios-15

## Lien catalogue

- Distribution parente : [`ios-15`](../distributions/ios-15/SKILL.md) (`capsuleos-distro-ios-15`)
- Vendor : [`apple`](../vendors/apple/SKILL.md)
- Libellé : **iOS 15**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `ios-15` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-ios-15` + skill famille `os-ios`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

