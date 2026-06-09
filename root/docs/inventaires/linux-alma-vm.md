# Inventaire VM — AlmaLinux (GNOME)

> Collecte : `2026-06-09T16:56:49Z` · Registre : `linux-alma` · JSON : [`linux-alma-vm.json`](linux-alma-vm.json)

## Distribution

| Champ | Valeur |
|-------|--------|
| Nom | AlmaLinux 10.2 (Lavender Lion) |
| GNOME Shell | GNOME Shell 49.4 |
| Accent | blue (#3584e4) |
| Favoris dash | 7 |

## Applications mappées

- **Calendar** → slot `calendar`
- **Nautilus** → slot `nemo`
- **GNOME Software** → slot `update_manager`
- **Ptyxis** → slot `terminal`
- **GNOME Text Editor** → slot `text_editor`
- **Calculator** → slot `calculator`

## Suite playbook

```bash
node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id linux-alma
bash root/tools/lab/pull-vm-assets.sh --id linux-alma
```

