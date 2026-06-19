# Inventaire VM — Ubuntu 25.10

> Collecte : `2026-06-16T07:56:01Z` · Registre : `linux-ubuntu` · JSON : [`linux-ubuntu-vm.json`](linux-ubuntu-vm.json)

## Distribution

| Champ | Valeur |
|-------|--------|
| Nom | Ubuntu 26.04 LTS |
| GNOME Shell | GNOME Shell 50.1 |
| Accent | orange (#ff7800) |
| Favoris dash | 8 |

## Applications mappées

- **Firefox** → slot `firefox`
- **Nautilus** → slot `nemo`
- **Rhythmbox** → slot `lecteur_multimedia`
- **LibreOffice Writer** → slot `librewriter`
- **Snap Store** → slot `update_manager`

## Suite playbook

```bash
node usr/lib/capsuleos/tools/lab/collect-playbook-tail.mjs --id linux-ubuntu
bash root/tools/lab/pull-vm-assets.sh --id linux-ubuntu
```

