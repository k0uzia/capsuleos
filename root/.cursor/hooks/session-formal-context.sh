#!/usr/bin/env bash
# Injecte le contexte décision formelle au démarrage de session agent.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
ID="${CAPSULE_REGISTRY_ID:-linux-rocky}"

if [[ ! -f "${ROOT}/usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs" ]]; then
  echo '{}'
  exit 0
fi

action=$(node "${ROOT}/usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs" --id "$ID" 2>/dev/null || echo '{}')
node -e "
const action=JSON.parse(process.argv[1]);
const msg=action.complete
  ? 'Chaîne replication '+action.registryId+' : domaine courant complet. Extension P1 ou polish skin.'
  : 'R-AUTO : prochaine action — '+ (action.command||action.message);
process.stdout.write(JSON.stringify({
  continue:true,
  additional_context: 'CapsuleOS logique formelle. '+msg+' Contrat : etc/capsuleos/contracts/agent-action-aliases.json'
}));
" "$action" 2>/dev/null || echo '{ "continue": true }'

exit 0
