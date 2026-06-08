#!/usr/bin/env bash
# Bundle R-PWD1 — une invite mot de passe hôte pour toute une passe de captures lab.
#
# Problème résolu : virsh screenshot (qemu:///system) et clé SSH protégée déclenchent
# une boîte de dialogue à chaque appel ; les passes VΣ enchaînent des dizaines de captures.
#
# Usage (recommandé — une invite, puis la passe complète) :
#   bash root/tools/lab/lab-capture-session.sh -- \
#     node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-ubuntu
#
# Usage (shell interactif — plusieurs commandes) :
#   source root/tools/lab/lab-capture-session.sh
#   node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id=linux-ubuntu
#
# Variables optionnelles :
#   CAPSULE_LAB_SSH_IDENTITY   clé SSH (défaut ~/.ssh/capsuleos-lab)
#   CAPSULE_LAB_VIRSH_URI      URI libvirt (défaut qemu:///system)
#   CAPSULE_LAB_VIRSH_NAME     domaine pour sonde (défaut ubuntu25.10)
#   CAPSULE_LAB_SUDO_REFRESH   secondes entre sudo -v (défaut 50)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
: "${CAPSULE_LAB_SSH_IDENTITY:=$HOME/.ssh/capsuleos-lab}"
: "${CAPSULE_LAB_VIRSH_URI:=qemu:///system}"
: "${CAPSULE_LAB_VIRSH_NAME:=ubuntu25.10}"
: "${CAPSULE_LAB_SUDO_REFRESH:=50}"

SOURCED=0
[[ "${BASH_SOURCE[0]}" != "${0}" ]] && SOURCED=1

SUDO_KEEPALIVE_PID=""

cleanup() {
  if [[ -n "${SUDO_KEEPALIVE_PID}" ]] && kill -0 "${SUDO_KEEPALIVE_PID}" 2>/dev/null; then
    kill "${SUDO_KEEPALIVE_PID}" 2>/dev/null || true
    wait "${SUDO_KEEPALIVE_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

setup_ssh_agent() {
  local key="$1"
  [[ -f "${key}" ]] || return 0

  if [[ -z "${SSH_AUTH_SOCK:-}" ]] || ! ssh-add -l &>/dev/null; then
    eval "$(ssh-agent -s)" >/dev/null
    export SSH_AGENT_PID SSH_AUTH_SOCK
  fi

  if ssh-add -l &>/dev/null; then
    return 0
  fi

  echo "→ Clé SSH lab (une invite si passphrase) : ${key}"
  ssh-add "${key}" </dev/tty || {
    echo "  ⚠ ssh-add ignoré — clé sans agent ou sans passphrase" >&2
  }
}

refresh_sudo() {
  if ! sudo -v; then
    echo "✗ sudo -v échoué — session lab annulée" >&2
    return 1
  fi
}

start_sudo_keepalive() {
  (
    while true; do
      sleep "${CAPSULE_LAB_SUDO_REFRESH}"
      sudo -v 2>/dev/null || break
    done
  ) &
  SUDO_KEEPALIVE_PID=$!
}

virsh_domstate() {
  local vm="$1"
  local use_sudo="${2:-0}"
  if [[ "${use_sudo}" -eq 1 ]]; then
    sudo -n virsh -c "${CAPSULE_LAB_VIRSH_URI}" domstate "${vm}" 2>/dev/null || true
  else
    virsh -c "${CAPSULE_LAB_VIRSH_URI}" domstate "${vm}" 2>/dev/null || true
  fi
}

try_virsh_screenshot() {
  local vm="$1" test="$2" use_sudo="${3:-0}" err=""
  if [[ "${use_sudo}" -eq 1 ]]; then
    err="$(sudo -n virsh -c "${CAPSULE_LAB_VIRSH_URI}" screenshot "${vm}" --file "${test}" 2>&1)" || true
  else
    err="$(virsh -c "${CAPSULE_LAB_VIRSH_URI}" screenshot "${vm}" --file "${test}" 2>&1)" || true
  fi
  if [[ -s "${test}" ]]; then
    rm -f "${test}"
    return 0
  fi
  rm -f "${test}"
  [[ -n "${err}" ]] && echo "${err}" >&2
  return 1
}

probe_virsh_mode() {
  local vm="$1"
  local test="/tmp/capsuleos-lab-virsh-probe-$$.png"
  local state attempt

  state="$(virsh_domstate "${vm}" 0)"
  if [[ -z "${state}" ]]; then
    echo "  ⚠ domaine « ${vm} » introuvable sur ${CAPSULE_LAB_VIRSH_URI}" >&2
    virsh -c "${CAPSULE_LAB_VIRSH_URI}" list --all >&2 || true
    echo "failed"
    return 1
  fi
  if [[ "${state}" != "running" && "${state}" != "en cours d'exécution" ]]; then
    echo "  ⚠ domaine « ${vm} » état : ${state} (attendu : running)" >&2
    echo "  → virsh -c ${CAPSULE_LAB_VIRSH_URI} start ${vm}" >&2
    echo "failed"
    return 1
  fi

  for attempt in 1 2 3; do
    rm -f "${test}"
    if try_virsh_screenshot "${vm}" "${test}" 0; then
      echo "direct"
      return 0
    fi
    [[ "${attempt}" -lt 3 ]] && sleep 2
  done

  for attempt in 1 2; do
    rm -f "${test}"
    if try_virsh_screenshot "${vm}" "${test}" 1; then
      echo "sudo"
      return 0
    fi
    [[ "${attempt}" -lt 2 ]] && sleep 2
  done

  echo "failed"
  return 1
}

export CAPSULE_LAB_SESSION=1
export CAPSULE_LAB_VIRSH_URI
export CAPSULE_LAB_SSH_IDENTITY
export LAB_ROOT="${ROOT}"
export LAB_VIRSH_URI="${CAPSULE_LAB_VIRSH_URI}"

echo "=== Session captures lab (R-PWD1) ==="

setup_ssh_agent "${CAPSULE_LAB_SSH_IDENTITY}"

echo "→ Mot de passe hôte (sudo — une fois pour toute la session)"
refresh_sudo
start_sudo_keepalive

VIRSH_MODE="$(probe_virsh_mode "${CAPSULE_LAB_VIRSH_NAME}" || true)"
case "${VIRSH_MODE}" in
  direct)
    unset CAPSULE_LAB_VIRSH_PREFIX
    export CAPSULE_LAB_VIRSH_PREFIX=""
    echo "✓ virsh direct (sans sudo) — domaine ${CAPSULE_LAB_VIRSH_NAME}"
    ;;
  sudo)
    export CAPSULE_LAB_VIRSH_PREFIX="sudo -n"
    echo "✓ virsh via sudo -n (ticket sudo maintenu) — domaine ${CAPSULE_LAB_VIRSH_NAME}"
    ;;
  *)
    echo "✗ virsh screenshot impossible pour « ${CAPSULE_LAB_VIRSH_NAME} »" >&2
    echo "  Vérifier : virsh -c ${CAPSULE_LAB_VIRSH_URI} domstate ${CAPSULE_LAB_VIRSH_NAME}" >&2
    echo "  Allumer  : virsh -c ${CAPSULE_LAB_VIRSH_URI} start ${CAPSULE_LAB_VIRSH_NAME}" >&2
    echo "  Repli    : node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id=linux-ubuntu (si virsh direct OK sans session)" >&2
    [[ "${SOURCED}" -eq 1 ]] && return 1
    exit 1
    ;;
esac

echo "  CAPSULE_LAB_SESSION=1"
echo "  CAPSULE_LAB_VIRSH_PREFIX=${CAPSULE_LAB_VIRSH_PREFIX:-<vide>}"
echo "  Renouvellement sudo toutes les ${CAPSULE_LAB_SUDO_REFRESH}s jusqu'à fin de session."

if [[ "${SOURCED}" -eq 1 ]]; then
  echo "→ Session active dans ce shell."
  return 0
fi

if [[ "${1:-}" == "--" ]]; then
  shift
  if [[ $# -eq 0 ]]; then
    echo "Usage : $0 -- <commande> [args...]" >&2
    exit 1
  fi
  echo "→ Exécution : $*"
  exec "$@"
fi

if [[ $# -gt 0 ]]; then
  echo "→ Exécution : $*"
  exec "$@"
fi

cat <<EOF
Session prête. Exemples :
  $0 -- node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-ubuntu
  $0 -- node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id=linux-ubuntu
  source $0 && bash root/tools/lab/vm-ubuntu-capture-host.sh
EOF
