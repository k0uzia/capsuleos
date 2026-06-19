# Playbook Paramètres GNOME — linux-alma

> Généré : 2026-06-17T08:25:42.301905+00:00
> Script : [`vm-gnome-settings-playbook.sh`](../../tools/lab/vm-gnome-settings-playbook.sh)

## Résumé

| Métrique | Valeur |
|----------|--------|
| Panneaux parcourus | 18 |
| Panneaux ouverts (gcc) | 18 |
| Contrôles mappés gsettings | 29 |
| Contrôles simulés / non mappés | 6 |

## Panneaux

| Panneau | gcc | Fenêtre | gsettings stable | Contrôles mappés |
|---------|-----|---------|------------------|------------------|
| Wi-Fi | wifi | non | oui | 1/1 |
| Réseau | network | non | oui | 0/1 |
| Bluetooth | bluetooth | non | oui | 1/1 |
| Apparence | appearance | non | oui | 2/2 |
| Arrière-plan | background | non | oui | 1/1 |
| Notifications | notifications | non | oui | 3/3 |
| Recherche | search | non | oui | 0/4 |
| Multitâche | multitasking | non | oui | 3/3 |
| Son | sound | non | oui | 1/2 |
| Alimentation | power | non | oui | 2/3 |
| Écrans | display | non | oui | 2/2 |
| Souris et pavé tactile | mouse | non | oui | 5/5 |
| Clavier | keyboard | non | oui | 2/2 |
| Imprimantes | printers | non | oui | 0/0 |
| Accessibilité | universal-access | non | oui | 2/2 |
| Confidentialité | privacy | non | oui | 4/5 |
| Partage | sharing | non | oui | 0/3 |
| À propos | info | non | oui | 0/0 |

## Détail gsettings ↔ CapsuleOS

### Wi-Fi

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| wifi | `True` | `on` |

### Bluetooth

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| bluetooth | `` | `on` |

### Apparence

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| theme | `'default'` | `dark` |
| accent | `'blue'` | `blue` |

### Arrière-plan

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| wallpaper | `'file:///usr/share/backgrounds/almalinux-day.jpg'` | `file:///usr/share/backgrounds/almalinux-day.jpg` |

### Notifications

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| notifications | `true` | `on` |
| lock-notifications | `true` | `on` |
| dnd | `` | `off` |

### Multitâche

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| dynamic-workspaces | `true` | `Activé` |
| hot-corner | `true` | `Activé` |
| apps-all-workspaces | `false` | `Activé` |

### Son

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| sound-alert | `'freedesktop'` | `Ding` |

### Alimentation

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| power-dim | `900` | `15 minutes` |
| power-sleep | `'suspend'` | `30 minutes` |

### Écrans

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| display-scale | `1.0` | `100 %` |
| night-light | `false` | `off` |

### Souris et pavé tactile

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| mouse-handedness | `false` | `Gauche` |
| pointer-speed | `0.0` | `50` |
| touchpad | `'enabled'` | `on` |
| tap-to-click | `true` | `on` |
| scroll-direction | `true` | `Naturel` |

### Clavier

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| keyboard-layout | `[('xkb', 'fr+oss')]` | `Français` |
| keyboard-repeat | `uint32 500` | `500 ms` |

### Accessibilité

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| contrast | `'Adwaita'` | `normal` |
| font-scale | `1.0` | `100` |

### Confidentialité

| Contrôle | VM (gsettings) | Capsule attendu |
|----------|----------------|-----------------|
| camera | `false` | `on` |
| microphone | `false` | `on` |
| auto-lock | `true` | `on` |
| lock-delay | `uint32 0` | `Immédiatement` |

