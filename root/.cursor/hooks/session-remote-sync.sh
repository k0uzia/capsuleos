#!/usr/bin/env bash
# Au démarrage de session agent : pull ff-only depuis origin (si possible).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

if [[ ! -d "${ROOT}/.git" ]]; then
  echo '{ "continue": true }'
  exit 0
fi

pull_out=""
pull_ok=true
if pull_out="$(bash "${ROOT}/usr/lib/capsuleos/tools/git-remote-sync.sh" pull origin 2>&1)"; then
  :
else
  pull_ok=false
fi

node -e "
const ok = process.argv[1] === 'true';
const out = process.argv[2] || '';
const line = ok
  ? 'Remote synchronisé (pull ff-only). Push auto après commit si hooks installés.'
  : 'Pull remote échoué — résoudre avant push : ' + out.split('\n').slice(-3).join(' ');
process.stdout.write(JSON.stringify({
  continue: true,
  additional_context: 'CapsuleOS git-remote-sync. ' + line
}));
" "$pull_ok" "$pull_out" 2>/dev/null || echo '{ "continue": true }'

exit 0
