#!/usr/bin/env bash
# Capture Nautilus VM maximisé (état utilisateur) → rocky-vm/rocky-dark-nautilus-maximized.png
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DEST="${1:-$ROOT/usr/share/capsuleos/assets/images/vendors/rocky/inventory/rocky-vm}"
VM_NAME="${ROCKY_VIRSH_NAME:-Rocky10}"
SSH_TARGET="${ROCKY_SSH:-capsule@192.168.122.234}"
IDENTITY="${ROCKY_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}"
SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$IDENTITY")
mkdir -p "$DEST"
remote() { ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$@"; }
prep_env() {
  remote "export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/\$(id -u)/bus; \
XDG_RUNTIME_DIR=/run/user/\$(id -u); DISPLAY=:0; \
XAUTHORITY=\$(ls /run/user/\$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1); \
PATH=\$HOME/.local/bin:\$PATH; $*"
}
prep_env 'wmctrl -xa org.gnome.Nautilus.nautilus 2>/dev/null || wmctrl -xa org.gnome.Nautilus 2>/dev/null || true'
sleep 1
prep_env 'wid=$(wmctrl -l | grep -i nautilus | awk "{print \$1}" | head -1); [ -n "$wid" ] && wmctrl -ir "$wid" -b add,maximized_vert,maximized_horz 2>/dev/null || true'
sleep 1
OUT="$DEST/rocky-dark-nautilus-maximized.png"
virsh -c qemu:///system screenshot "$VM_NAME" --file "$OUT"
cp -f "$OUT" "$DEST/rocky-dark-nautilus.png"
echo "✓ $OUT (+ copie rocky-dark-nautilus.png)"
