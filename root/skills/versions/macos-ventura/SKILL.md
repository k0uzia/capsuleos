---
name: capsuleos-version-macos-ventura
description: CapsuleOS version slice macOS Ventura (macos-ventura) — extends distribution macos-ventura. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — macos-ventura

## Lien catalogue

- Distribution parente : [`macos-ventura`](../distributions/macos-ventura/SKILL.md) (`capsuleos-distro-macos-ventura`)
- Vendor : [`apple`](../vendors/apple/SKILL.md)
- Libellé : **macOS Ventura**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `macos-ventura` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-macos-ventura` + skill famille `os-macos`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

