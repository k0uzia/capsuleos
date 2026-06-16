# Comparaison visuelle Ubuntu — VM ↔ CapsuleOS

> Généré : 2026-06-16T07:42:50.532Z
> VM : `/mnt/#TEAM/CapsuleOS/usr/share/capsuleos/assets/images/vendors/ubuntu/inventory/ubuntu-vm` · Capsule : `/mnt/#TEAM/CapsuleOS/usr/share/capsuleos/assets/images/vendors/ubuntu/inventory/ubuntu-capsule`

| Scène | VM | Capsule | Contexte |
|-------|-----|---------|----------|
| Bureau sombre | ✗ ubuntu-dark-desktop.png | ✓ ubuntu-capsule-dark-desktop.png (116636 o) | Ubuntu 26.04 + dock latéral Yaru ; fond Resolute Raccoon Dimmed |
| Aperçu bureau (workspace) | ✗ audit/ubuntu-dark-overview.png | ✓ ubuntu-capsule-dark-overview.png (134093 o) | Main.overview.show() VM · CapsuleGnomeOverview workspace |
| Aperçu avec Firefox (vignette) | ✗ ubuntu-dark-firefox.png | ✓ ubuntu-capsule-dark-overview-busy.png (134093 o) | VM : fenêtre Navigator · Capsule : overview + peek workspace |
| Fichiers sombre (Nautilus) | ✗ ubuntu-dark-nautilus.png | ✓ ubuntu-capsule-dark-nautilus.png (80414 o) | org.gnome.Nautilus · slot nemo, icônes Yaru |
| Firefox sombre | ✗ ubuntu-dark-firefox.png | ✓ ubuntu-capsule-dark-firefox.png (61146 o) | Navigator.firefox · slot firefox |
| Éditeur de texte sombre | ✗ ubuntu-dark-text-editor.png | ✓ ubuntu-capsule-dark-text-editor.png (50997 o) | org.gnome.TextEditor · slot text_editor |
| Calculatrice sombre | ✗ ubuntu-dark-calculator.png | ✓ ubuntu-capsule-dark-calculator.png (77563 o) | org.gnome.Calculator · favori dash VM |
| Bureau clair | ✗ ubuntu-light-desktop.png | ✓ ubuntu-capsule-light-desktop.png (117108 o) | color-scheme prefer-light ↔ data-theme=light |
| Aperçu clair | ✗ audit/ubuntu-light-overview.png | ✓ ubuntu-capsule-light-overview.png (134450 o) | Overview thème clair Resolute Raccoon Light |

**0/9** paire(s) complète(s).

> **9** paire(s) incomplète(s) — relancer `vm-ubuntu-capture-host.sh` et `capture-capsule-ubuntu.mjs`.
