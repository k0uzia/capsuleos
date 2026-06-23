#!/usr/bin/env bash
# Compile xdotool sur l'hôte (RHEL/Fedora avec gcc) et déploie sur la VM lab (~/.local).
# Usage: deploy-xdotool-via-host.sh <ssh-target> [identity]
# Exemple: deploy-xdotool-via-host.sh user@host ~/.ssh/capsuleos-lab
set -euo pipefail

TARGET="${1:?ssh target requis}"
IDENTITY="${2:-$HOME/.ssh/capsuleos-lab}"
VER="${XDOTOOL_VERSION:-3.20211022.1}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

curl -fsSL -o "$WORK/xdotool.tar.gz" "https://github.com/jordansissel/xdotool/releases/download/v${VER}/xdotool-${VER}.tar.gz"
tar xf "$WORK/xdotool.tar.gz" -C "$WORK"
cd "$WORK/xdotool-${VER}"
make
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY" "$TARGET" 'mkdir -p ~/.local/bin ~/.local/lib'
scp -o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY" ./xdotool "./libxdo.so.3" "$TARGET:~/.local/lib/"
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY" "$TARGET" 'chmod +x ~/.local/lib/xdotool.bin 2>/dev/null || mv ~/.local/lib/xdotool ~/.local/lib/xdotool.bin; chmod +x ~/.local/lib/xdotool.bin; cat > ~/.local/bin/xdotool << "EOF"
#!/bin/bash
export LD_LIBRARY_PATH="$HOME/.local/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
exec "$HOME/.local/lib/xdotool.bin" "$@"
EOF
chmod +x ~/.local/bin/xdotool
export PATH=$HOME/.local/bin:$PATH
xdotool --version'
echo "xdotool déployé sur $TARGET"
