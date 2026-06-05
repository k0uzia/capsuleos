#!/usr/bin/env bash
# Installe xdotool sur RHEL/Rocky/Alma (el8+) quand le paquet dnf est absent.
# Préfixe utilisateur par défaut (~/.local) — pas de sudo requis.
#
# Usage (sur la VM) : bash install-xdotool-el.sh
# Depuis l'hôte : scp + ssh (voir bootstrap-vm.sh)
set -euo pipefail

XDOTOOL_VERSION="${XDOTOOL_VERSION:-3.20211022.1}"
PREFIX="${PREFIX:-$HOME/.local}"
export PATH="${PREFIX}/bin:${PATH}"

if command -v xdotool >/dev/null 2>&1; then
  echo "xdotool déjà présent: $(command -v xdotool)"
  xdotool --version 2>/dev/null || true
  exit 0
fi

if command -v dnf >/dev/null 2>&1; then
  if dnf install -y xdotool 2>/dev/null; then
    echo "xdotool installé via dnf"
    exit 0
  fi
  sudo dnf install -y gcc make libXtst-devel libX11-devel libXinerama-devel libXi-devel libxkbcommon-devel perl-podlators 2>/dev/null \
    || dnf install -y gcc make libXtst-devel libX11-devel libXinerama-devel libXi-devel libxkbcommon-devel perl-podlators
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"
curl -fsSL -o xdotool.tar.gz "https://github.com/jordansissel/xdotool/releases/download/v${XDOTOOL_VERSION}/xdotool-${XDOTOOL_VERSION}.tar.gz"
tar xf xdotool.tar.gz
cd "xdotool-${XDOTOOL_VERSION}"
make PREFIX="$PREFIX" INSTALLMAN="${PREFIX}/share/man"
make PREFIX="$PREFIX" INSTALLMAN="${PREFIX}/share/man" install

if ! command -v xdotool >/dev/null 2>&1; then
  echo "Échec: xdotool absent après install (PREFIX=$PREFIX)" >&2
  exit 1
fi

echo "xdotool installé: $(command -v xdotool)"
xdotool --version
