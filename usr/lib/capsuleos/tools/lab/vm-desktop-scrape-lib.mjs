/**
 * Collecte structurée des entrées .desktop VM (ground truth brut).
 * Filtre aligné GNOME Shell : Type=Application, pas NoDisplay/Hidden, OnlyShowIn GNOME.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { ROOT } from './replication-chain-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Alias Snap / .desktop → clés contrat apps-catalog.json */
export const DESKTOP_ID_ALIASES = {
  firefox_firefox: 'firefox',
  'snap-store_snap-store': 'snap-store',
};

export const normalizeDesktopId = (id) => {
  if (DESKTOP_ID_ALIASES[id]) return DESKTOP_ID_ALIASES[id];
  const dup = id.match(/^(.+)_\1$/);
  if (dup) return dup[1];
  return id;
};

/** Entrées techniques absentes de la grille « Afficher les applications » Ubuntu. */
export const DESKTOP_DENY_IDS = new Set([
  'org.gnome.Evolution-alarm-notify',
  'org.gnome.evolution-data-server.OAuth2-handler',
  'org.gnome.OnlineAccounts.OAuth2',
  'org.gnome.goa-daemon',
  'org.gnome.Papers-previewer',
  'org.gnome.Zenity',
  'org.gnome.Shell.Extensions',
  'org.gnome.Shell',
  'org.gnome.Shell.PortalHelper',
  'org.gnome.Shell.Extensions.GSConnect',
  'info',
  'nm-connection-editor',
  'vim',
]);

const VM_COLLECT_SCRIPT = `set -euo pipefail
DIRS="/usr/share/applications /var/lib/snapd/desktop/applications /usr/local/share/applications"
for dir in $DIRS; do
  [ -d "$dir" ] || continue
  for f in "$dir"/*.desktop; do
    [ -f "$f" ] || continue
    id=$(basename "$f" .desktop)
    type=$(grep -m1 '^Type=' "$f" 2>/dev/null | cut -d= -f2- || true)
    [ "$type" = "Application" ] || continue
    if grep -q '^NoDisplay=true' "$f" 2>/dev/null; then continue; fi
    if grep -q '^Hidden=true' "$f" 2>/dev/null; then continue; fi
    only=$(grep -m1 '^OnlyShowIn=' "$f" 2>/dev/null | cut -d= -f2- || true)
    if [ -n "$only" ] && ! echo "$only" | grep -q 'GNOME'; then continue; fi
    notshow=$(grep -m1 '^NotShowIn=' "$f" 2>/dev/null | cut -d= -f2- || true)
    if [ -n "$notshow" ] && echo "$notshow" | grep -q 'GNOME'; then continue; fi
    name=$(grep -m1 '^Name\\[fr\\]=' "$f" 2>/dev/null | cut -d= -f2- || true)
    [ -n "$name" ] || name=$(grep -m1 '^Name=' "$f" 2>/dev/null | cut -d= -f2- || true)
    icon=$(grep -m1 '^Icon=' "$f" 2>/dev/null | cut -d= -f2- || true)
    cats=$(grep -m1 '^Categories=' "$f" 2>/dev/null | cut -d= -f2- || true)
    path="$f"
    echo "$id|$name|$icon|$cats|$path"
  done
done | sort -u
`;

export const collectDesktopEntriesViaSsh = (registryId) => {
  const res = spawnSync(process.execPath, [
    path.join(__dirname, 'lab-ssh.mjs'),
    '--id', registryId,
    '--cmd', VM_COLLECT_SCRIPT,
  ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });

  if (res.status !== 0) {
    throw new Error(`SSH desktop scrape échec: ${(res.stderr || res.stdout || '').trim()}`);
  }

  const entries = [];
  for (const line of (res.stdout || '').split('\n')) {
    const t = line.trim();
    if (!t || !t.includes('|')) continue;
    const [id, name, icon, categories, desktopPath] = t.split('|');
    const normalizedId = normalizeDesktopId(id);
    const cats = categories || '';
    const isConsoleOnly = cats.split(';').includes('ConsoleOnly');
    entries.push({
      id,
      normalizedId,
      name: name || id,
      icon: icon || null,
      categories: categories || null,
      desktopPath: desktopPath || null,
      showInGrid: !DESKTOP_DENY_IDS.has(id)
        && !DESKTOP_DENY_IDS.has(normalizedId)
        && !isConsoleOnly,
    });
  }
  return dedupeDesktopEntries(entries);
};

const dedupeDesktopEntries = (entries) => {
  const byNorm = new Map();
  for (const entry of entries) {
    const key = entry.normalizedId;
    const prev = byNorm.get(key);
    if (!prev) {
      byNorm.set(key, entry);
      continue;
    }
    const prevSnap = (prev.desktopPath || '').includes('/snapd/');
    const nextSnap = (entry.desktopPath || '').includes('/snapd/');
    if (prevSnap && !nextSnap) {
      byNorm.set(key, entry);
    }
  }
  return [...byNorm.values()];
};

export const pathsForProc = (registryId) => {
  const procDir = path.join(ROOT, 'proc', registryId);
  return {
    procDir,
    desktopRaw: path.join(procDir, 'desktop-entries-raw.json'),
    scrapeMeta: path.join(procDir, 'scrape-meta.json'),
  };
};

export const writeProcRawDump = (registryId, entries, extra = {}) => {
  const paths = pathsForProc(registryId);
  fs.mkdirSync(paths.procDir, { recursive: true });
  const payload = {
    version: 1,
    registryId,
    collectedAt: new Date().toISOString(),
    entryCount: entries.length,
    entries,
  };
  fs.writeFileSync(paths.desktopRaw, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(paths.scrapeMeta, `${JSON.stringify({
    version: 1,
    registryId,
    collectedAt: payload.collectedAt,
    source: 'vm-desktop-scrape-lib.mjs',
    searchPaths: [
      '/usr/share/applications',
      '/var/lib/snapd/desktop/applications',
      '/usr/local/share/applications',
    ],
    ...extra,
  }, null, 2)}\n`);
  return paths;
};

export const entriesToInstalled = (entries) => entries
  .filter((e) => e.showInGrid)
  .map((e) => ({
    id: e.normalizedId || normalizeDesktopId(e.id),
    desktopId: e.id,
    name: e.name,
    icon: e.icon,
    categories: e.categories,
    capsuleSlot: null,
    grid: true,
    dash: false,
  }));
