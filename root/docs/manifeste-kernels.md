# Manifeste des noyaux CapsuleOS

Taxonomie et contrat d'isolation pour la refonte noyau (juin 2026).

**Sources machine** : [`etc/capsuleos/kernels.json`](../../etc/capsuleos/kernels.json) · [`etc/capsuleos/os-registry.json`](../../etc/capsuleos/os-registry.json)

---

## Principes

1. **Noyau central** (`usr/lib/capsuleos/core/`) — services partagés : fenêtres, ressources, bus événements, capacités navigateur.
2. **Noyau OS** (`kernelId`) — adaptateur isolé par famille technique (Linux, Windows NT, Darwin, FreeBSD…).
3. **Branche Linux** (`branchId`) — lignée packaging (Debian, Ubuntu, Fedora, RHEL, Mint, Arch, openSUSE, Slackware, Gentoo, Manjaro, Kali, Alpine).
4. **Leaf** (`id` registre) — distribution ou version jouable ; hérite du noyau + branche + clusters.

**Règle d'isolation** : un kernel ne importe pas de comportement d'un autre kernel. Les extensions (Android, ChromeOS) sont documentées comme dérivées Linux mais sans branche.

---

## Gel catalogue → wave 1 (juin 2026)

La reconstruction noyau a gelé les 57 entrées ; **12 sont réactivées** (waves 1–5) via [`etc/capsuleos/reactivation-queue.json`](../../etc/capsuleos/reactivation-queue.json) :

Wave 1 : `linux-mint`, `linux-ubuntu`, `linux-opensuse`, `windows-11`, `windows-10`, `macos-sonoma`, `ios-15`.  
Wave 2 : `linux-fedora` (duo GNOME avec Ubuntu).  
Wave 3 : `linux-rocky` (référence GNOME / Nautilus).  
Wave 4 : `linux-alma` (dérivé Rocky).  
Wave 5 : `linux-anduinos`, `linux-popos`.

Les autres restent `planned` ou `stub` ; chemins runtime archivés dans `referencePaths`.

- Portail pick-os : **8 entrées publiques**.
- Mode lab : `?devSkin=<id>` pour les skins archivés.

Réactivation : `node usr/lib/capsuleos/tools/reactivate-os.mjs <id>`.

### Exemple Linux Mint (P0 réactivé)

- **DE partagé** (Cinnamon) : `usr/lib/capsuleos/shells/linux/boot/toolkit-boot.json`, scripts `explorer-registry.js`, `explorer-icon-base.js`, `cluster-registry.js`.
- **Spécificités Mint** : `home/Debian/Mint/`, override `etc/capsuleos/overrides/linux-mint.json` (`CAPSULE_WINDOW_CONTEXT`).
- **Profils** : chemins relatifs `../../../usr/share/capsuleos/assets` — générés par `build-profiles-from-registry.mjs`.
- **Icônes Nemo** : `./assets/icons/cinnamon/nemo/…` résolus via `CapsuleResource` + `iconPacks: ["icons/cinnamon"]`.

---

## Nomenclature kernels

| kernelId | Label | Branches Linux |
|----------|-------|----------------|
| `linux` | Linux | Oui (12 branches) |
| `windows-nt` | Windows NT | Non |
| `darwin` | Darwin (macOS, iOS) | Non — spec interne `xnu` |
| `freebsd`, `openbsd`, `netbsd` | BSD | Non |
| `solaris` | Solaris / illumos | Non |
| `haiku` | Haiku | Non |
| `qnx-neutrino`, `vxworks`, `minix3` | Temps réel / recherche | Non |
| `android`, `chromeos`, `harmonyos` | Extensions | Non |

---

## Hiérarchie fichiers cible

```
usr/lib/capsuleos/core/           # Noyau central
usr/lib/capsuleos/kernels/<id>/   # Adaptateurs par kernel
usr/lib/capsuleos/engines/        # Moteurs navigateur
usr/share/capsuleos/themes/core/  # Tokens primitifs
usr/share/capsuleos/themes/kernels/
usr/share/capsuleos/themes/clusters/
etc/capsuleos/cluster-registry.json
```

Voir aussi : [manifeste-noyau.md](manifeste-noyau.md) · [scalabilite-noyau.md](scalabilite-noyau.md) · [compatibilite-navigateurs.md](compatibilite-navigateurs.md)
