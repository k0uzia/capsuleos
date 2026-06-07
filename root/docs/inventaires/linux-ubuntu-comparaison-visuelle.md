# Comparaison visuelle Ubuntu — VM ↔ CapsuleOS

> Généré : 2026-06-07T19:29:19.404Z
> VM : `/home/n0r3f/Développement/CapsuleOS/usr/share/capsuleos/assets/images/vendors/ubuntu/inventory/ubuntu-vm` · Capsule : `/home/n0r3f/Développement/CapsuleOS/usr/share/capsuleos/assets/images/vendors/ubuntu/inventory/ubuntu-capsule`

| Scène | VM | Capsule | Contexte |
|-------|-----|---------|----------|
| Bureau sombre | ✗ ubuntu-dark-desktop.png | ✓ ubuntu-capsule-dark-desktop.png (418471 o) | Ubuntu 26.04 + dock latéral Yaru ; fond Resolute Raccoon Dimmed |
| Aperçu bureau (workspace) | ✗ audit/ubuntu-dark-overview.png | ✓ ubuntu-capsule-dark-overview.png (418471 o) | Main.overview.show() VM · CapsuleGnomeOverview workspace |
| Aperçu avec Firefox (vignette) | ✗ ubuntu-dark-firefox.png | ✓ ubuntu-capsule-dark-overview-busy.png (119735 o) | VM : fenêtre Navigator · Capsule : overview + peek workspace |
| Fichiers sombre (Nautilus) | ✗ ubuntu-dark-nautilus.png | ✓ ubuntu-capsule-dark-nautilus.png (217327 o) | org.gnome.Nautilus · slot nemo, icônes Yaru |
| Firefox sombre | ✗ ubuntu-dark-firefox.png | ✓ ubuntu-capsule-dark-firefox.png (120340 o) | Navigator.firefox · slot firefox |
| Éditeur de texte sombre | ✗ ubuntu-dark-text-editor.png | ✓ ubuntu-capsule-dark-text-editor.png (235003 o) | org.gnome.TextEditor · slot text_editor |
| Calculatrice sombre | ✗ ubuntu-dark-calculator.png | ✓ ubuntu-capsule-dark-calculator.png (294615 o) | org.gnome.Calculator · favori dash VM |
| Bureau clair | ✗ ubuntu-light-desktop.png | ✓ ubuntu-capsule-light-desktop.png (419499 o) | color-scheme prefer-light ↔ data-theme=light |
| Aperçu clair | ✗ audit/ubuntu-light-overview.png | ✓ ubuntu-capsule-light-overview.png (419499 o) | Overview thème clair Resolute Raccoon Light |

**0/9** paire(s) complète(s).

> **9** paire(s) incomplète(s) — relancer `vm-ubuntu-capture-host.sh` et `capture-capsule-ubuntu.mjs`.
