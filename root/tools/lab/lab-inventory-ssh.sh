#!/usr/bin/env bash
# Résout user@host lab depuis variables d'environnement ou etc/capsuleos/lab-inventory.json.
# Usage : source "$(dirname "$0")/lab-inventory-ssh.sh"
#         SSH_TARGET="$(resolve_lab_ssh linux-mint KDE_NEON_SSH MINT_SSH)"
set -euo pipefail

_lab_ssh_root() {
  if [[ -n "${CAPSULEOS_ROOT:-}" && -d "${CAPSULEOS_ROOT}/etc/capsuleos" ]]; then
    echo "$CAPSULEOS_ROOT"
    return
  fi
  local here="${BASH_SOURCE[1]:-${BASH_SOURCE[0]}}"
  here="$(cd "$(dirname "$here")" && pwd)"
  if [[ -f "$here/../../etc/capsuleos/lab-inventory.example.json" ]]; then
    cd "$here/../.." && pwd
    return
  fi
  if [[ -f "$here/../../../etc/capsuleos/lab-inventory.example.json" ]]; then
    cd "$here/../../.." && pwd
    return
  fi
  echo "lab-inventory-ssh: racine CapsuleOS introuvable" >&2
  return 1
}

resolve_lab_ssh() {
  local registry_id="$1"
  shift || true
  local env_name val root resolved
  for env_name in "$@"; do
    val="${!env_name:-}"
    if [[ -n "$val" ]]; then
      echo "$val"
      return 0
    fi
  done
  root="$(_lab_ssh_root)" || return 1
  if [[ -f "$root/etc/capsuleos/lab-inventory.json" ]]; then
    resolved="$(node "$root/usr/lib/capsuleos/tools/lab/lab-inventory-resolve.mjs" --id "$registry_id" 2>/dev/null)" || true
    if [[ -n "$resolved" ]]; then
      echo "$resolved"
      return 0
    fi
  fi
  echo "lab-inventory-ssh: configurez etc/capsuleos/lab-inventory.json (registryId: $registry_id) ou exportez une variable SSH lab" >&2
  return 1
}
