#!/usr/bin/env bash
# Agent captures GNOME — session graphique locale (Proxmox / Wayland SSH).
# Déclenché par collect-vm via $XDG_RUNTIME_DIR/capsuleos-lab/requests/*.req
set -euo pipefail

export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR}/bus}"
export DISPLAY="${DISPLAY:-:0}"
if [[ -z "${XAUTHORITY:-}" ]]; then
  XAUTHORITY=$(ls "${XDG_RUNTIME_DIR}"/.mutter-Xwaylandauth.* 2>/dev/null | head -1 || true)
  export XAUTHORITY
fi

BASE="${XDG_RUNTIME_DIR}/capsuleos-lab"
REQ_DIR="${BASE}/requests"
mkdir -p "${REQ_DIR}"

capture_to() {
  local out="$1"
  mkdir -p "$(dirname "${out}")"
  rm -f "${out}" "${out}.ok" "${out}.fail"
  local img_dir
  img_dir="$(xdg-user-dir PICTURES 2>/dev/null || echo "${HOME}/Images")"
  mkdir -p "${img_dir}"
  touch "${img_dir}/.capsuleos-portal-stamp"
  if gdbus call --session --dest org.freedesktop.portal.Desktop \
    --object-path /org/freedesktop/portal/desktop \
    --method org.freedesktop.portal.Screenshot.Screenshot \
    "" "{'interactive': <false>}" >/dev/null 2>&1; then
  for _ in $(seq 1 30); do
    local src
    src=$(find "${img_dir}" -maxdepth 1 -name '*.png' -newer "${img_dir}/.capsuleos-portal-stamp" -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [[ -n "${src}" && -s "${src}" ]]; then
      cp "${src}" "${out}" && touch "${out}.ok" && return 0
    fi
    sleep 0.15
  done
  fi
  if gdbus call --session --dest org.gnome.Shell.Screenshot \
    --object-path /org/gnome/Shell/Screenshot \
    --method org.gnome.Shell.Screenshot.Screenshot false false "${out}" 2>/dev/null \
    && [[ -s "${out}" ]]; then
    touch "${out}.ok"
    return 0
  fi
  if command -v gnome-screenshot >/dev/null && gnome-screenshot -f "${out}" 2>/dev/null && [[ -s "${out}" ]]; then
    touch "${out}.ok"
    return 0
  fi
  touch "${out}.fail"
  return 1
}

echo "capsuleos-screenshot-agent → ${REQ_DIR}" >&2
: >"${BASE}/agent.ready"

while true; do
  shopt -s nullglob
  for req in "${REQ_DIR}"/*.req; do
    [[ -f "${req}" ]] || continue
    out="$(tr -d '\0' <"${req}")"
    rm -f "${req}"
    [[ -n "${out}" ]] || continue
    capture_to "${out}" || true
  done
  shopt -u nullglob
  sleep 0.15
done
