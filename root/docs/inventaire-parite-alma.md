# Inventaire parité — AlmaLinux 10 GNOME VM → CapsuleOS

> Collecte : **juin 2026** · Registre : `linux-alma` · Indice machine : [`linux-alma-parity-index.json`](inventaires/linux-alma-parity-index.json)  
> Procédure : [`procedure-lab-linux-alma-gnome.md`](procedure-lab-linux-alma-gnome.md) · VM : [`linux-alma-vm.json`](inventaires/linux-alma-vm.json)

**État global** : **Π = 94** (`status_global: ok`) · VM `capsule@192.168.122.199` · skin dérivé `linux-rocky`.

---

## Méthode de mesure

| Composant | Poids | Périmètre |
|-----------|-------|-----------|
| Shell | 0,25 | topBar, overview, tray, wallpaper |
| Apps | 0,75 | 7 slots priority : nemo, firefox, terminal, themes, update_manager, text_editor, calculator |

Dimensions par slot : `vis`, `nav`, `int`, `ctx`, `kb`, `data` (0–100).

Seuils : **ok ≥ 90** · **partiel ≥ 60**.

---

## Versions

| Composant | VM réelle | CapsuleOS | Statut |
|-----------|-----------|-----------|--------|
| Distribution | AlmaLinux **10.2** (Lavender Lion) | `linux-alma` P3 | OK |
| Shell / DE | GNOME Shell **49.4** Wayland | Coque dérivée Rocky · `#alma` | OK |
| Explorateur | **Nautilus 47** | Slot `nemo` · `nemo-gnome` | OK (Π 91) |
| Terminal | **Ptyxis** | Slot `terminal` · profil Alma | OK (Π 90) |
| Logiciels | **GNOME Software 49** | Slot `update_manager` | OK (Π **100**) |
| Paramètres | **gnome-control-center** | Slot `themes` · `themes_gnome.html` | Partiel (Π **87→93**) |

---

## Shell GNOME

| Surface | Π | Smoke / preuve |
|---------|---|----------------|
| topBar | 99 | `smoke-rocky-shell-polish.mjs --playwright` |
| overview | 94 | dash is-running Playwright C12 |
| tray | 99 | checks 3/3 |
| wallpaper | 97 | fonds `almalinux-day/night` · catalogue `almaWallpaperCatalog` |

Ground truth VM :

- `accent-color`: **blue** (`#3584e4`)
- `picture-uri`: `file:///usr/share/backgrounds/almalinux-day.jpg`
- `picture-uri-dark`: `almalinux-night.jpg`

---

## Apps priority — détail

| Slot | Label | Π | Scénarios P0 | Contrat |
|------|-------|---|--------------|---------|
| `nemo` | Fichiers | 91 | — | routing smoke |
| `firefox` | Firefox | 92 | — | onglets Proton C11 |
| `terminal` | Ptyxis | 90 | — | `smoke-terminal-ptyxis-chrome` |
| `themes` | Paramètres | **87→93** | **Th1–Th4** | `themes-user-scenarios.json` |
| `update_manager` | Logiciels | **100** | S1–S4 | `software-user-scenarios.json` |
| `text_editor` | Éditeur | 92 | T1–T4 | `text-editor-user-scenarios.json` |
| `calculator` | Calculatrice | 91 | C1–C4 | `calculator-user-scenarios.json` |

### Scénarios pédagogiques (C15–C18)

| Cycle | Slot | Scénarios | Smoke |
|-------|------|-----------|-------|
| C15 | Logiciels | S1 install · S2 recherche · S3 MAJ · S4 lancer | `smoke-gnome-software-scenarios.mjs` |
| C16 | Éditeur | T1 nouveau · T2 ouvrir VFS · T3 enregistrer sous · T4 onglets | `smoke-gnome-text-editor-scenarios.mjs` |
| C17 | Calculatrice | C1 basique · C2 chaîne/effacer · C3 Avancé · C4 copier | `smoke-gnome-calculator-scenarios.mjs` |
| C18 | Paramètres | Th1 mode sombre · Th2 fond Alma · Th3 accent · Th4 panneau Écrans | `smoke-gnome-themes-scenarios.mjs` |

Pattern documenté : [procedure-scenarios-pedagogiques-gnome.md](procedure-scenarios-pedagogiques-gnome.md).

---

## Gaps ouverts

| Gap | Tag | Notes |
|-----|-----|-------|
| Captures VM pixel-perfect | **Vc** P1 | D-Bus `Shell.Screenshot` AccessDenied via SSH |
| `virsh almalinux10` absent hôte | P1 | VM accessible IP ; playbook `screenshotCapture` documenté |
| Playbook GNOME Settings Alma | P2 | Hérité Rocky — pas de matrice dupliquée |
| Watermark Alma | P2 | `fedora_logo_*` non inventorié — gradient CSS |
| `clocks`, `calendar` | P2 | Π ~63 — post-thèmes |

---

## Prochaines étapes

1. **C18 clôture themes** — Th1–Th4 verts · Π slot ≥ 93 · Π global **96**
2. **Vc VM** — session GDM locale ou fix D-Bus screenshot
3. **P2 apps** — clocks, calendar, baobab, tour
4. **ManΣ Alma** — alignement manifeste proc si campagne formalisée

---

## Commandes parité

```bash
node usr/lib/capsuleos/tools/lab/compare-os-parity.mjs --id linux-alma
node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-alma

# Smokes scénarios (exemple themes)
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/smoke-gnome-themes-scenarios.mjs --id linux-alma
```
