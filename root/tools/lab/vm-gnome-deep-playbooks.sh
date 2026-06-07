#!/usr/bin/env bash
# Playbooks audit profond GNOME — séquences d'actions reproductibles (VM).
# Usage hôte : voir run-vm-deep-audit-phases.mjs
# Usage direct :
#   ssh … 'export DISPLAY=:0 XAUTHORITY=…; bash -s playbook overview-open' < vm-gnome-deep-playbooks.sh
set -uo pipefail

export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export DISPLAY="${DISPLAY:-:0}"
export PATH="${HOME}/.local/bin:${PATH}"
if [[ -z "${XAUTHORITY:-}" ]]; then
  XAUTHORITY=$(ls /run/user/"$(id -u)"/.mutter-Xwaylandauth.* 2>/dev/null | head -1)
  export XAUTHORITY
fi

sleep_ms() { sleep "$(awk "BEGIN {printf \"%.3f\", $1/1000}")"; }

shell_eval() {
  local js="$1"
  gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
    --method org.gnome.Shell.Eval "s:${js}" 2>/dev/null | head -1 || echo "(false, '')"
}

workspace_index() {
  shell_eval 'global.workspace_manager.get_active_workspace_index()' \
    | sed -n "s/.*(true, '\\([0-9]*\\)')/\1/p"
}

workspace_count() {
  shell_eval 'global.workspace_manager.get_n_workspaces()' \
    | sed -n "s/.*(true, '\\([0-9]*\\)')/\1/p"
}

overview_open() {
  shell_eval 'Main.overview.show()' >/dev/null 2>&1 || xdotool key super 2>/dev/null || true
}

overview_hide() {
  shell_eval 'Main.overview.hide()' >/dev/null 2>&1 || xdotool key Escape 2>/dev/null || true
}

desktop_click() {
  local x="$1" y="$2" btn="${3:-1}"
  xdotool mousemove --sync "$x" "$y" 2>/dev/null || true
  sleep_ms 200
  xdotool click "$btn" 2>/dev/null || true
}

screen_center_below_bar() {
  local geom cx cy
  geom=$(xdotool getdisplaygeometry 2>/dev/null || echo "1280 800")
  cx=$(echo "$geom" | awk '{print int($1/2)}')
  cy=$(echo "$geom" | awk '{print int($2/2)+40}')
  echo "$cx $cy"
}

probe_state() {
  if [[ -x "$HOME/capsuleos-lab/os-probe-gnome.sh" ]]; then
    "$HOME/capsuleos-lab/os-probe-gnome.sh" state 2>/dev/null || echo '{}'
  else
    echo '{}'
  fi
}

json_line() {
  python3 -c 'import json,sys; print(json.dumps(json.loads(sys.argv[1]), ensure_ascii=False))' "$1" 2>/dev/null || echo "$1"
}

run_playbook() {
  local name="$1"
  local result='{}'
  local coords ws_before ws_after

  case "$name" in
    desktop-idle)
      overview_hide
      sleep_ms 800
      result=$(python3 - <<'PY'
import json, subprocess
from datetime import datetime, timezone
def sh(c):
    try: return subprocess.check_output(c, shell=True, text=True, stderr=subprocess.DEVNULL).strip()
    except: return ""
coords = sh("xdotool getdisplaygeometry")
result = {
  "playbook": "desktop-idle",
  "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "displayGeometry": coords,
  "workspaceIndex": None,
  "probe": None,
}
print(json.dumps(result))
PY
)
      ;;
    desktop-contextmenu)
      overview_hide
      sleep_ms 500
      coords=$(screen_center_below_bar)
      desktop_click ${coords%% *} ${coords##*} 3
      sleep_ms 600
      result=$(COORDS="$coords" python3 - <<'PY'
import json, os, subprocess
from datetime import datetime, timezone
coords = os.environ.get("COORDS", "640 440")
result = {
  "playbook": "desktop-contextmenu",
  "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "trigger": {"type": "contextmenu", "clicks": 1, "button": "right", "coordinates": coords},
  "expectedMenu": [
    {"label": "New Folder", "capsuleStatus": "planned"},
    {"label": "Paste", "capsuleStatus": "planned", "note": "visible si presse-papiers"},
    {"label": "Display Settings", "capsuleStatus": "planned"},
  ],
  "gnomeReference": "GNOME Shell desktop context menu RL10",
}
print(json.dumps(result, ensure_ascii=False))
PY
)
      ;;
    overview-open)
      overview_hide
      sleep_ms 400
      overview_open
      sleep_ms 900
      result=$(python3 - <<'PY'
import json, subprocess
from datetime import datetime, timezone
def shell_eval(js):
    try:
        out = subprocess.check_output(
            ["gdbus", "call", "--session", "--dest", "org.gnome.Shell",
             "--object-path", "/org/gnome/Shell", "--method", "org.gnome.Shell.Eval", f"s:{js}"],
            text=True, stderr=subprocess.DEVNULL)
        return out.strip()
    except Exception:
        return ""
visible = shell_eval("Main.overview.visible")
result = {
  "playbook": "overview-open",
  "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "trigger": {"type": "keyboard", "binding": "Super / Main.overview.show()", "clicks": 0},
  "overviewVisible": visible,
  "keyboardAlt": "toggle-overview (vide sur cette VM — Super par défaut)",
}
print(json.dumps(result, ensure_ascii=False))
PY
)
      ;;
    overview-close)
      overview_hide
      sleep_ms 700
      result='{"playbook":"overview-close","trigger":{"type":"keyboard","binding":"Escape"}}'
      ;;
    open-nautilus)
      overview_hide
      if [[ -x "$HOME/capsuleos-lab/os-probe-gnome.sh" ]]; then
        "$HOME/capsuleos-lab/os-probe-gnome.sh" action open-launcher nemo >/dev/null 2>&1 || true
      else
        nohup nautilus >/dev/null 2>&1 &
      fi
      sleep_ms 1400
      result=$(probe_state)
      result=$(python3 -c "import json,sys; p=json.loads(sys.argv[1]) if sys.argv[1].strip().startswith('{') else {}; print(json.dumps({'playbook':'open-nautilus','clicks':2,'steps':['Super (optionnel)','open-launcher nemo'],'probe':p}, ensure_ascii=False))" "$result")
      ;;
    open-firefox)
      overview_hide
      "$HOME/capsuleos-lab/os-probe-gnome.sh" action open-launcher firefox >/dev/null 2>&1 || nohup firefox >/dev/null 2>&1 &
      sleep_ms 2800
      result=$(probe_state)
      result=$(python3 -c "import json,sys; p=json.loads(sys.argv[1]) if sys.argv[1].strip().startswith('{') else {}; print(json.dumps({'playbook':'open-firefox','probe':p}, ensure_ascii=False))" "$result")
      ;;
    open-terminal)
      overview_hide
      "$HOME/capsuleos-lab/os-probe-gnome.sh" action open-launcher terminal >/dev/null 2>&1 \
        || nohup ptyxis >/dev/null 2>&1 & \
        || nohup gnome-console >/dev/null 2>&1 &
      sleep_ms 1400
      result=$(probe_state)
      result=$(python3 -c "import json,sys; p=json.loads(sys.argv[1]) if sys.argv[1].strip().startswith('{') else {}; print(json.dumps({'playbook':'open-terminal','probe':p}, ensure_ascii=False))" "$result")
      ;;
    quick-settings)
      overview_hide
      xdotool key super+s 2>/dev/null || true
      sleep_ms 800
      result='{"playbook":"quick-settings","trigger":{"type":"keyboard","binding":"<Super>s","clicks":0}}'
      ;;
    workspace-next)
      ws_before=$(workspace_index)
      overview_hide
      xdotool key super+Page_Down 2>/dev/null || xdotool key ctrl+alt+Right 2>/dev/null || true
      sleep_ms 700
      ws_after=$(workspace_index)
      result=$(WSB="$ws_before" WSA="$ws_after" python3 - <<'PY'
import json, os
from datetime import datetime, timezone
result = {
  "playbook": "workspace-next",
  "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "trigger": {"type": "keyboard", "binding": "<Super>Page_Down", "clicks": 0},
  "workspaceBefore": os.environ.get("WSB"),
  "workspaceAfter": os.environ.get("WSA"),
  "changed": os.environ.get("WSB") != os.environ.get("WSA") and os.environ.get("WSA") != "",
}
print(json.dumps(result, ensure_ascii=False))
PY
)
      ;;
    workspace-prev)
      ws_before=$(workspace_index)
      overview_hide
      xdotool key super+Page_Up 2>/dev/null || true
      sleep_ms 700
      ws_after=$(workspace_index)
      result=$(WSB="$ws_before" WSA="$ws_after" python3 - <<'PY'
import json, os
from datetime import datetime, timezone
result = {
  "playbook": "workspace-prev",
  "trigger": {"type": "keyboard", "binding": "<Super>Page_Up"},
  "workspaceBefore": os.environ.get("WSB"),
  "workspaceAfter": os.environ.get("WSA"),
}
print(json.dumps(result, ensure_ascii=False))
PY
)
      ;;
    overview-workspaces)
      overview_open
      sleep_ms 900
      result=$(python3 - <<'PY'
import json, subprocess
from datetime import datetime, timezone
def shell_eval(js):
    try:
        out = subprocess.check_output(
            ["gdbus", "call", "--session", "--dest", "org.gnome.Shell",
             "--object-path", "/org/gnome/Shell", "--method", "org.gnome.Shell.Eval", f"s:{js}"],
            text=True, stderr=subprocess.DEVNULL)
        return out.strip()
    except Exception:
        return ""
n = shell_eval("global.workspace_manager.get_n_workspaces()")
idx = shell_eval("global.workspace_manager.get_active_workspace_index()")
result = {
  "playbook": "overview-workspaces",
  "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "workspaceCount": n,
  "activeIndex": idx,
  "trigger": {"type": "keyboard", "binding": "Super → bandeau bureaux visible"},
}
print(json.dumps(result, ensure_ascii=False))
PY
)
      ;;
    animation-overview-burst)
      overview_hide
      sleep_ms 300
      for i in 1 2 3 4 5; do
        overview_open
        sleep_ms 80
      done
      sleep_ms 400
      overview_hide
      result='{"playbook":"animation-overview-burst","frames":5,"intervalMs":80,"note":"captures hôte entre frames"}'
      ;;
    nautilus-contextmenu)
      overview_hide
      nohup nautilus >/dev/null 2>&1 &
      sleep_ms 1200
      wmctrl -xa org.gnome.Nautilus.nautilus 2>/dev/null || true
      sleep_ms 400
      coords=$(screen_center_below_bar)
      desktop_click ${coords%% *} ${coords##*} 3
      sleep_ms 600
      result=$(python3 - <<'PY'
import json
from datetime import datetime, timezone
result = {
  "playbook": "nautilus-contextmenu",
  "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "parentSurface": "nautilus.fileArea",
  "trigger": {"type": "contextmenu", "clicks": 1, "button": "right"},
  "expectedMenu": [
    {"label": "New Folder", "shortcut": "Shift+Ctrl+N", "capsuleStatus": "planned"},
    {"label": "Properties", "capsuleStatus": "planned"},
  ],
}
print(json.dumps(result, ensure_ascii=False))
PY
)
      ;;
    settings-inventory)
      if [[ -f "$HOME/capsuleos-lab/vm-gnome-settings-inventory.sh" ]]; then
        result=$("$HOME/capsuleos-lab/vm-gnome-settings-inventory.sh" 2>/dev/null || echo '{}')
      elif [[ -f "$(dirname "$0")/vm-gnome-settings-inventory.sh" ]]; then
        result=$("$(dirname "$0")/vm-gnome-settings-inventory.sh" 2>/dev/null || echo '{}')
      else
        result='{"error":"vm-gnome-settings-inventory.sh missing"}'
      fi
      ;;
    settings-interactions)
      if [[ -f "$HOME/capsuleos-lab/vm-gnome-settings-interaction-playbook.sh" ]]; then
        result=$("$HOME/capsuleos-lab/vm-gnome-settings-interaction-playbook.sh" 2>/dev/null || echo '{}')
      elif [[ -f "$(dirname "$0")/vm-gnome-settings-interaction-playbook.sh" ]]; then
        result=$("$(dirname "$0")/vm-gnome-settings-interaction-playbook.sh" 2>/dev/null || echo '{}')
      else
        result='{"error":"vm-gnome-settings-interaction-playbook.sh missing"}'
      fi
      ;;
    settings-panels-tour)
      if [[ -f "$HOME/capsuleos-lab/vm-gnome-settings-playbook.sh" ]]; then
        result=$("$HOME/capsuleos-lab/vm-gnome-settings-playbook.sh" 2>/dev/null || echo '{}')
      elif [[ -f "$(dirname "$0")/vm-gnome-settings-playbook.sh" ]]; then
        result=$("$(dirname "$0")/vm-gnome-settings-playbook.sh" 2>/dev/null || echo '{}')
      else
        result='{"error":"vm-gnome-settings-playbook.sh missing"}'
      fi
      ;;
    settings-open)
      gnome-control-center >/dev/null 2>&1 &
      sleep_ms 1200
      result=$(python3 - <<'PY'
import json
from datetime import datetime, timezone
print(json.dumps({
  "playbook": "settings-open",
  "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "launched": True,
}, ensure_ascii=False))
PY
)
      ;;
    workspace-meta)
      result=$(python3 - <<'PY'
import json, subprocess
from datetime import datetime, timezone
def shell_eval(js):
    try:
        out = subprocess.check_output(
            ["gdbus", "call", "--session", "--dest", "org.gnome.Shell",
             "--object-path", "/org/gnome/Shell", "--method", "org.gnome.Shell.Eval", f"s:{js}"],
            text=True, stderr=subprocess.DEVNULL)
        return out.strip()
    except Exception:
        return ""
count = shell_eval("global.workspace_manager.get_n_workspaces()")
idx = shell_eval("global.workspace_manager.get_active_workspace_index()")
result = {
  "playbook": "workspace-meta",
  "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "workspaceCountRaw": count,
  "activeIndexRaw": idx,
}
print(json.dumps(result, ensure_ascii=False))
PY
)
      ;;
    *)
      echo "{\"error\":\"unknown_playbook\",\"name\":\"$name\"}" >&2
      exit 1
      ;;
  esac

  echo "$result"
}

main() {
  local cmd="${1:-list}"
  if [[ "$cmd" == "playbook" && -n "${2:-}" ]]; then
    cmd="$2"
  fi
  if [[ "$cmd" == "list" ]]; then
    echo "desktop-idle desktop-contextmenu overview-open overview-close open-nautilus open-firefox open-terminal quick-settings settings-open settings-inventory settings-panels-tour settings-interactions workspace-next workspace-prev overview-workspaces animation-overview-burst nautilus-contextmenu workspace-meta"
    exit 0
  fi
  if [[ "$cmd" == "all-meta" ]]; then
    workspace-meta
    exit 0
  fi
  run_playbook "$cmd"
}

main "$@"
