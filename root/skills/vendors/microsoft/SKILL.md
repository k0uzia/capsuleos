---
name: capsuleos-vendor-microsoft
description: CapsuleOS vendor microsoft — distributions windows-10, windows-11, windows-2000, windows-7, windows-8, …. Use when working on microsoft branding, assets vendors/microsoft, or any microsoft simulated OS entry.
---

# Vendor — microsoft

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `microsoft` |
| Familles | windows |
| Skill famille OS | `os-windows` |

## Distributions (registre)

- [`windows-10`](../distributions/windows-10/SKILL.md) — skill `capsuleos-distro-windows-10`
- [`windows-11`](../distributions/windows-11/SKILL.md) — skill `capsuleos-distro-windows-11`
- [`windows-2000`](../distributions/windows-2000/SKILL.md) — skill `capsuleos-distro-windows-2000`
- [`windows-7`](../distributions/windows-7/SKILL.md) — skill `capsuleos-distro-windows-7`
- [`windows-8`](../distributions/windows-8/SKILL.md) — skill `capsuleos-distro-windows-8`
- [`windows-8.1`](../distributions/windows-8.1/SKILL.md) — skill `capsuleos-distro-windows-8.1`
- [`windows-95`](../distributions/windows-95/SKILL.md) — skill `capsuleos-distro-windows-95`
- [`windows-98`](../distributions/windows-98/SKILL.md) — skill `capsuleos-distro-windows-98`
- [`windows-me`](../distributions/windows-me/SKILL.md) — skill `capsuleos-distro-windows-me`
- [`windows-vista`](../distributions/windows-vista/SKILL.md) — skill `capsuleos-distro-windows-vista`
- [`windows-xp`](../distributions/windows-xp/SKILL.md) — skill `capsuleos-distro-windows-xp`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-windows
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/microsoft/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

