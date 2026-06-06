# KDE neon User Edition — fidélité CapsuleOS

Registre : `linux-kde-neon` · Skin : `home/Debian/KDE-Neon/` · Viewport cible : **1211×756**.

## Ground truth

- VM lab (SSH) + [`root/docs/inventaires/linux-kde-neon-vm.json`](../../../root/docs/inventaires/linux-kde-neon-vm.json)
- Assets : `usr/share/capsuleos/assets/images/vendors/neon/` + [`SOURCE-VM.txt`](../../../usr/share/capsuleos/assets/images/vendors/neon/SOURCE-VM.txt)

## Références Plasma (checklist)

- [`linux-kde-neon-repair-checklist.md`](../../../root/docs/inventaires/linux-kde-neon-repair-checklist.md)
- Modèle KDE : [`linux-opensuse-repair-checklist.md`](../../../root/docs/inventaires/linux-opensuse-repair-checklist.md)

## Test local

```bash
python3 -m http.server 5500 --bind 127.0.0.1
# http://127.0.0.1:5500/home/Debian/KDE-Neon/index.html
```

## Gates

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```
