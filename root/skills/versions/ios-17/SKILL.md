---
name: capsuleos-version-ios-17
description: CapsuleOS version slice iOS 17 (ios-17) — extends distribution ios-17. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — ios-17

## Lien catalogue

- Distribution parente : [`ios-17`](../distributions/ios-17/SKILL.md) (`capsuleos-distro-ios-17`)
- Vendor : [`apple`](../vendors/apple/SKILL.md)
- Libellé : **iOS 17**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `ios-17` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-ios-17` + skill famille `os-ios`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

