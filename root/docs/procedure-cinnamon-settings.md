# Procédure — Paramètres Cinnamon (Linux Mint)

> **Pilote** : `linux-mint` · **Slot** : `themes` · **Variant** : `cinnamon_settings.html`  
> **Contrats** : [`settings-effects-chain.json`](../../etc/capsuleos/contracts/settings-effects-chain.json) · [`cinnamon-ground-truth-chain.json`](../../etc/capsuleos/contracts/cinnamon-ground-truth-chain.json)  
> **Matrice** : [`cinnamon-settings-parity-matrix.json`](../tools/lab/cinnamon-settings-parity-matrix.json)

Miroir de [`procedure-creation-playbook-gnome-settings.md`](procedure-creation-playbook-gnome-settings.md) pour le toolkit **cinnamon**.

---

## Chaîne Paramètres → effets OS

```text
UI data-cs-capsule-key
  → cinnamon-settings-parity.js (EFFECT_HANDLERS)
  → cinnamon-gsettings-store.js
  → CustomEvent capsule:*
  → consommateurs skin/noyau (mint-applet-visibility, a11y-overrides, …)
```

---

## Gates

```bash
node usr/lib/capsuleos/tools/lab/verify-cinnamon-settings-parity-chain.mjs --id linux-mint
node usr/lib/capsuleos/tools/lab/verify-cinnamon-settings-parity-chain.mjs --id linux-mint --strict
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-mint
```

---

## Prédicat SeΣ

Pour chaque contrôle P0 de la matrice : handler `EFFECT_HANDLERS` présent, événement `capsule:*` documenté dans `settings-effects-chain.json`, consommateur listé ou `accepted` avec preuve VM.

---

## Anti-régression

Tout touch noyau partagé (`cinnamon-gsettings-store.js`, `capsule-theme-storage.js`) :

```bash
node usr/lib/capsuleos/tools/lab/run-cross-regression-gates.mjs
```

Voir [`ground-truth-cinnamon.md`](ground-truth-cinnamon.md).
