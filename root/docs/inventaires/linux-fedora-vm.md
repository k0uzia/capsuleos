# Inventaire VM — Fedora Workstation

> Collecte : `2026-06-07T00:10:52Z` · Registre : `linux-fedora` · JSON : [`linux-fedora-vm.json`](linux-fedora-vm.json)

## Distribution

| Champ | Valeur |
|-------|--------|
| Nom | Fedora Linux 44 (Workstation Edition) |
| GNOME Shell | GNOME Shell 50.2 |
| Accent | blue (#3584e4) |
| Favoris dash | 6 |

## Applications mappées

- **Firefox** → slot `firefox`
- **Calendar** → slot `calendar`
- **Nautilus** → slot `nemo`
- **GNOME Software** → slot `update_manager`
- **GNOME Text Editor** → slot `text_editor`
- **Calculator** → slot `calculator`

## Suite playbook

```bash
node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id linux-fedora
bash root/tools/lab/pull-vm-assets.sh --id linux-fedora
```

