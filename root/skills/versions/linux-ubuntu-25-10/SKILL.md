---
name: capsuleos-version-linux-ubuntu-25-10
description: CapsuleOS version slice Ubuntu 25.10 (linux-ubuntu-25-10) — extends distribution linux-ubuntu. Use when the task targets this specific release/codename/build, not the whole vendor line.
---

# Version — linux-ubuntu-25-10

## Lien catalogue

- Distribution parente : [`linux-ubuntu`](../distributions/linux-ubuntu/SKILL.md) (`capsuleos-distro-linux-ubuntu`)
- Vendor : [`ubuntu`](../vendors/ubuntu/SKILL.md)
- Libellé : **Ubuntu 25.10**

## Quand utiliser ce skill plutôt que la distribution seule

- Fidélité visuelle ou comportementale **liée à cette version** (ex. Windows 11 vs 10, macOS Sonoma, Ubuntu 25.10).
- Fichiers sous la façade/skin de `linux-ubuntu` uniquement.

## Héritage

Charger aussi : `capsuleos-distro-linux-ubuntu` + skill famille `os-linux`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

