# Briefs agents (générés)

Briefs opérationnels par entrée `os-registry.json`, produits par :

```bash
node usr/lib/capsuleos/tools/print-agent-brief.mjs <id> --write
node usr/lib/capsuleos/tools/print-agent-brief.mjs --list --tier P2 --status planned
```

Exemple : `linux-elementary.md` après `print-agent-brief.mjs linux-elementary --write`.

Ne pas éditer à la main si l’entrée registre change — regénérer le brief.

Formation : [parcours-agent.md](../parcours-agent.md).
