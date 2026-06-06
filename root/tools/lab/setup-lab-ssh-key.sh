#!/usr/bin/env bash
# Bundle R-PWD1 — configuration clé SSH lab (une invite utilisateur).
# Usage : bash root/tools/lab/setup-lab-ssh-key.sh [user@host]
set -euo pipefail

TARGET="${1:-}"
KEY="${HOME}/.ssh/capsuleos-lab"

if [[ ! -f "${KEY}.pub" ]]; then
  ssh-keygen -t ed25519 -f "${KEY}" -N "" -C "capsuleos-lab"
fi

if [[ -z "${TARGET}" ]]; then
  echo "Clé prête : ${KEY}.pub"
  echo "Copie : ssh-copy-id -i ${KEY}.pub <user@vm-ip>"
  exit 0
fi

ssh-copy-id -i "${KEY}.pub" -o IdentitiesOnly=yes "${TARGET}"
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "${KEY}" "${TARGET}" 'echo OK lab-ssh'
