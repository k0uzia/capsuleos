# Point d'étape — juin 2026

## Wave store Alma (10 juin 2026)

**Commit cible** : `feat(alma): wave store — install magasin file_roller, LibreOffice, Agenda (S5–S7)`

### Livré

- Kernel magasin GNOME : `gnome-store-catalog.js`, section **À découvrir** Logiciels
- 3 apps installables Alma P0 : file_roller (rpm), LibreOffice (flatpak → librewriter), Agenda (flatpak)
- Scénarios S5–S7 + smoke Playwright
- Gates StoreΣ + ScΣ
- Skin Alma : slot `file_roller`, `file_roller.skin.css`

### Captures Capsule (S5–S7)

À collecter :

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/collect-capsule-apps-visual-investigation.mjs --id linux-alma --filter store
```

Fichiers attendus : `alma-capsule-store-file-roller-installed.png`, `alma-capsule-store-libreoffice-open.png`, `alma-capsule-store-calendar-open.png`

### Validation

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-software-scenarios.mjs --id linux-alma
node usr/lib/capsuleos/tools/validate-all.mjs
```
