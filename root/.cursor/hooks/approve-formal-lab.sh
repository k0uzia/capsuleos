#!/usr/bin/env bash
# Hook beforeShellExecution — auto-allow chaîne formelle (agent-action-aliases.json).
# R-ASK1 : commit/push/sudo ad hoc → demander à l'humain.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
ALIASES="${ROOT}/etc/capsuleos/contracts/agent-action-aliases.json"

input=$(cat)
command=$(printf '%s' "$input" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  try { const j=JSON.parse(d); process.stdout.write((j.command||'').trim()); }
  catch { process.exit(1); }
});")

if [[ -z "$command" ]] || [[ ! -f "$ALIASES" ]]; then
  echo '{ "permission": "allow" }'
  exit 0
fi

result=$(node -e "
const fs=require('fs');
const cmd=process.argv[1];
const a=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const match=(patterns)=>patterns.some(p=>new RegExp(p,'i').test(cmd));
if (match(a.alwaysAsk?.patterns||[])) {
  const bundle=Object.entries(a.passwordBundles||{}).find(([,b])=>
    (b.replaces||[]).some(r=>cmd.includes(r)));
  if (bundle) {
    const [,b]=bundle;
    process.stdout.write(JSON.stringify({
      permission:'ask',
      user_message:'R-PWD1 : préférer le bundle '+b.script+' (une seule invite mot de passe).',
      agent_message:'Grouper via '+b.script+' — voir agent-action-aliases.json'
    }));
  } else {
    process.stdout.write(JSON.stringify({
      permission:'ask',
      user_message:'Action réservée (R-ASK1) — validation humaine requise.',
      agent_message:'commit/push/sudo ad hoc : attendre instruction explicite.'
    }));
  }
  process.exit(0);
}
if (match(a.autoAllow?.patterns||[])) {
  process.stdout.write(JSON.stringify({
    permission:'allow',
    agent_message:'R-AUTO : commande alignée agent-action-aliases.json'
  }));
  process.exit(0);
}
process.stdout.write(JSON.stringify({ permission:'allow' }));
" "$command" "$ALIASES")

echo "$result"
exit 0
