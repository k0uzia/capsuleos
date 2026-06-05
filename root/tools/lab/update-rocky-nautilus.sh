#!/usr/bin/env bash
# Mise à jour Rocky / Nautilus (gabarit nemo-gnome) avant validation visuelle.
# Usage : ./root/tools/lab/update-rocky-nautilus.sh [--pull-assets] [--capture]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

PULL_ASSETS=false
CAPTURE=false
for arg in "$@"; do
  case "$arg" in
    --pull-assets) PULL_ASSETS=true ;;
    --capture) CAPTURE=true ;;
    -h|--help)
      echo "Usage: $0 [--pull-assets] [--capture]"
      echo "  --pull-assets  Symboles Adwaita depuis la VM (pull-vm-assets.sh)"
      echo "  --capture      Captures Playwright Capsule après audit"
      exit 0
      ;;
    *) echo "Option inconnue: $arg" >&2; exit 1 ;;
  esac
done

run() {
  echo ""
  echo "── $1 ──"
  shift
  "$@"
}

if [[ "$PULL_ASSETS" == true ]]; then
  run "Assets VM (symboles Nautilus)" bash root/tools/lab/pull-vm-assets.sh
fi

run "Manifest public (home/public)" node usr/lib/capsuleos/tools/generate-public-manifest.mjs
run "Façades pick-os + embed (home/ → OS/linux/families/)" node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
run "Validation façades ≡ home/" node usr/lib/capsuleos/tools/linux/validate-linux-facades.mjs
run "Bundle fenêtre (drag / chrome / display CSS)" node usr/lib/capsuleos/tools/build-capsule-window.mjs

run "Contrat interactions" node usr/lib/capsuleos/tools/validate-interactions-contract.mjs
run "Audit Nautilus Rocky (images / icônes)" node root/tools/lab/audit-nautilus-rocky.mjs

if [[ "$CAPTURE" == true ]]; then
  run "Captures Capsule Rocky" node root/tools/lab/capture-capsule-rocky.mjs
fi

echo ""
echo "✓ update-rocky-nautilus OK — valider Nautilus sur les deux URLs :"
echo "    home/RedHat/Rocky/index.html"
echo "    OS/linux/families/redhat/rocky/index.html  (pick-os)"
