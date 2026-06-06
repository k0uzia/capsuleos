---
name: capsuleos-distro-linux-rocky
description: CapsuleOS distribution Rocky Linux (GNOME) (linux-rocky) — linux, tier P1, référence GNOME, active. Use when editing linux-rocky, gnome toolkit, Nautilus nemo-gnome, or rocky vendor assets.
---

# Distribution — Rocky Linux (GNOME)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-rocky` |
| Vendor | [`rocky`](../vendors/rocky/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P1 / **active** (référence toolkit GNOME) |
| Upstream | `null` — Fedora et Alma dérivent de Rocky |
| Toolkit | gnome |
| embedKey | `rocky` |
| bodyId | `rocky` |

## Chemins

- Skin (vérité) : `home/RedHat/Rocky/`
- Façade pick-os : `OS/linux/families/redhat/rocky/index.html` (**générée**)
- Profil : `etc/capsuleos/profiles/linux-rocky.json`

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-clone-from-vm` |
| 3 | `gnome-hig-replication` (HIG officiel — patterns, palette, outils) |
| 4 | `design-shell-layout` (top bar, Aperçu, espacements VM) |
| 5 | `os-linux` |
| 6 | `capsuleos-vendor-rocky` |
| 7 | `capsuleos-distro-linux-rocky` (cette fiche) |

Brief : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-rocky`

## Logique formelle

- **Paradigme** : [logique-formelle.md](../../docs/logique-formelle.md)
- **Chaîne réplication** : [procedure-replication-formelle.md](../../docs/procedure-replication-formelle.md) — **V → G → Vc → Vp**
- **Playbook Paramètres** : [procedure-creation-playbook-gnome-settings.md](../../docs/procedure-creation-playbook-gnome-settings.md) §0 annexe — gates **A**, **S**, **L**

## VM lab

- **Procédure maître** : [procedure-lab-linux-rocky-gnome.md](../../docs/procedure-lab-linux-rocky-gnome.md)
- **Référence branche** : [branche-redhat-gnome.md](../../docs/branche-redhat-gnome.md)
- Infra SSH/Wayland : [lab-vm-rhel-wayland.md](../../docs/lab-vm-rhel-wayland.md)
- Inventaire : [linux-rocky-vm.md](../../docs/inventaires/linux-rocky-vm.md) · [linux-rocky-vm.json](../../docs/inventaires/linux-rocky-vm.json)
- Parité : [inventaire-parite-rocky.md](../../docs/inventaire-parite-rocky.md)
- Local : `etc/capsuleos/lab-inventory.json` (`linux-rocky`)
- Sonde : `$HOME/capsuleos-lab/os-probe-gnome.sh state`

## Apps / slots

VM : **Nautilus**, Ptyxis, Firefox. Capsule : slot **`nemo`** (gabarit `nemo-gnome`), `terminal`, `firefox` — [linux-gnome-capsule-slots.md](../../docs/inventaires/linux-gnome-capsule-slots.md).

## Clôture après modifs

```bash
./root/tools/lab/update-rocky-nautilus.sh   # Nautilus + façades + embed
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Ne pas

- Éditer la façade `OS/linux/families/redhat/rocky/` à la main
- Emprunter des icônes Cinnamon/Mint pour Rocky
- Forker le noyau fenêtre/explorateur — utiliser chrome context `gnome` / provider `nemo-gnome`

## Références

- [convention-reproduction-os.md](../../docs/convention-reproduction-os.md)
- [window-chrome-contexts.md](../../docs/window-chrome-contexts.md)
