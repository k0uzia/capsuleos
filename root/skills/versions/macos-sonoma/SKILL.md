---
name: capsuleos-version-macos-sonoma
description: CapsuleOS version slice macOS Sonoma (macos-sonoma) — extends distribution macos-sonoma. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — macos-sonoma

## Lien catalogue

- Distribution parente : [`macos-sonoma`](../distributions/macos-sonoma/SKILL.md) (`capsuleos-distro-macos-sonoma`)
- Vendor : [`apple`](../vendors/apple/SKILL.md)
- Libellé : **macOS Sonoma**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `macos-sonoma` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-macos-sonoma` + skill famille `os-macos`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

