# Inventaire VM — AnduinOS

> Collecte : `2026-06-17T16:42:35Z` · Registre : `linux-anduinos` · JSON : [`linux-anduinos-vm.json`](linux-anduinos-vm.json)

## Distribution

| Champ | Valeur |
|-------|--------|
| Nom | AnduinOS 2.0.0~beta3 |
| GNOME Shell | GNOME Shell 50.1 |
| Accent | blue (#3584e4) |
| Favoris dash | 3 |

## Applications mappées

- **Nautilus** → slot `nemo`
- **GNOME Software** → slot `update_manager`

## Suite playbook

```bash
node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id linux-anduinos
bash root/tools/lab/pull-vm-assets.sh --id linux-anduinos
```

