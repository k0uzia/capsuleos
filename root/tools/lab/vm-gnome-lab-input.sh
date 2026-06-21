# Fonctions entrée utilisateur VM GNOME (SSH) + capture virsh hôte.
# shellcheck source=lab-inventory-ssh.sh
source "$(dirname "$0")/lab-inventory-ssh.sh"
# Source depuis les scripts lab Fedora/Rocky — ne pas exécuter directement.
#
# Variables (surchargeables) :
#   LAB_SSH              capsule@IP
#   LAB_VIRSH_NAME       nom domaine libvirt
#   LAB_SSH_IDENTITY     clé SSH
#   LAB_VIRSH_URI        qemu:///system
#   CAPTURE_SETTLE_MS    délai avant screenshot (défaut 800)

: "${LAB_ROOT:=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
: "${LAB_SSH:=$(resolve_lab_ssh linux-fedora FEDORA_SSH LAB_SSH)}"
: "${LAB_VIRSH_NAME:=${FEDORA_VIRSH_NAME:-fedora}}"
: "${LAB_SSH_IDENTITY:=${FEDORA_SSH_IDENTITY:-$HOME/.ssh/capsuleos-lab}}"
: "${LAB_VIRSH_URI:=qemu:///system}"
: "${CAPTURE_SETTLE_MS:=800}"
: "${LAB_PLAYBOOKS_SH:=$LAB_ROOT/root/tools/lab/vm-gnome-deep-playbooks.sh}"

LAB_SSH_OPTS=(-o BatchMode=yes -o IdentitiesOnly=yes -i "$LAB_SSH_IDENTITY")

# Préfixe virsh (ex. "sudo -n") — défini par lab-capture-session.sh (R-PWD1).
lab_virsh_cmd() {
  if [[ -n "${CAPSULE_LAB_VIRSH_PREFIX:-}" ]]; then
    # shellcheck disable=SC2086
    ${CAPSULE_LAB_VIRSH_PREFIX} virsh -c "$LAB_VIRSH_URI" "$@"
  else
    virsh -c "$LAB_VIRSH_URI" "$@"
  fi
}

lab_remote() {
  ssh "${LAB_SSH_OPTS[@]}" "$LAB_SSH" "$@"
}

lab_prep_env() {
  local cmd="${*:-:}"
  lab_remote "export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/\$(id -u)/bus; \
XDG_RUNTIME_DIR=/run/user/\$(id -u); DISPLAY=:0; \
XAUTHORITY=\$(ls /run/user/\$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1); \
PATH=\$HOME/.local/bin:\$PATH; ${cmd}; true"
}

lab_wake_display() {
  lab_remote 'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus
    XDG_RUNTIME_DIR=/run/user/$(id -u)
    gdbus call --session --dest org.gnome.ScreenSaver --object-path /org/gnome/ScreenSaver \
      --method org.gnome.ScreenSaver.SetActive false 2>/dev/null || true
    xset dpms force on 2>/dev/null || true'
}

lab_overview_open() {
  lab_overview_hide
  # GNOME ≥ 41 (Ubuntu Wayland) : Eval/xdotool bloqués — OverviewActive via D-Bus.
  lab_remote 'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus
    if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
      --method org.freedesktop.DBus.Properties.Set org.gnome.Shell OverviewActive "<true>" 2>/dev/null; then
      exit 0
    fi
    export DISPLAY=:0
    XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)
    export XAUTHORITY
    PATH=$HOME/.local/bin:$PATH
    gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
      --method org.gnome.Shell.Eval "s:Main.overview.show()" >/dev/null 2>&1 \
      || xdotool key super 2>/dev/null || true'
}

lab_overview_hide() {
  lab_remote 'export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus
    if gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
      --method org.freedesktop.DBus.Properties.Set org.gnome.Shell OverviewActive "<false>" 2>/dev/null; then
      exit 0
    fi
    export DISPLAY=:0
    XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)
    export XAUTHORITY
    PATH=$HOME/.local/bin:$PATH
    gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
      --method org.gnome.Shell.Eval "s:Main.overview.hide()" >/dev/null 2>&1 \
      || xdotool key Escape 2>/dev/null || true'
}

lab_desktop_click() {
  local x="$1" y="$2" btn="${3:-1}"
  lab_prep_env "xdotool mousemove --sync $x $y 2>/dev/null; xdotool click $btn 2>/dev/null || true"
}

lab_run_playbook() {
  local name="$1"
  if [[ ! -f "$LAB_PLAYBOOKS_SH" ]]; then
    echo "✗ playbook script introuvable: $LAB_PLAYBOOKS_SH" >&2
    return 1
  fi
  lab_remote "export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/\$(id -u)/bus; \
XDG_RUNTIME_DIR=/run/user/\$(id -u); DISPLAY=:0; \
XAUTHORITY=\$(ls /run/user/\$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1); \
PATH=\$HOME/.local/bin:\$PATH; bash -s ${name}" < "$LAB_PLAYBOOKS_SH"
}

lab_virsh_shot() {
  local file="$1"
  local settle_ms="${2:-$CAPTURE_SETTLE_MS}"
  if [[ "$settle_ms" -gt 0 ]]; then
    sleep "$(awk "BEGIN {printf \"%.3f\", $settle_ms/1000}")"
  fi
  if ! lab_virsh_cmd screenshot "$LAB_VIRSH_NAME" --file "$file" 2>/dev/null; then
    echo "  ✗ virsh screenshot échec — domaine « $LAB_VIRSH_NAME » injoignable ?" >&2
    echo "    Astuce : bash root/tools/lab/lab-capture-session.sh -- <commande>" >&2
    return 1
  fi
  echo "  → $file ($(wc -c <"$file") octets)"
}

lab_check_input_tools() {
  lab_prep_env 'command -v xdotool >/dev/null && command -v wmctrl >/dev/null && echo OK || echo MISSING'
}
