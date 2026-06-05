---
name: capsuleos-version-android-lineage
description: CapsuleOS version slice LineageOS (style AOSP) (android-lineage) — extends distribution android-lineage. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — android-lineage

## Lien catalogue

- Distribution parente : [`android-lineage`](../distributions/android-lineage/SKILL.md) (`capsuleos-distro-android-lineage`)
- Vendor : [`lineage`](../vendors/lineage/SKILL.md)
- Libellé : **LineageOS (style AOSP)**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `android-lineage` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-android-lineage` + skill famille `os-android`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

