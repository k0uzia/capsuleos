#!/usr/bin/env node
/**
 * Serveur HTTP statique — racine du dépôt CapsuleOS (smokes / captures Playwright).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/serve-capsule-http.mjs
 *   node usr/lib/capsuleos/tools/lab/serve-capsule-http.mjs --port 8765
 *   node usr/lib/capsuleos/tools/lab/serve-capsule-http.mjs --id linux-rocky
 *   CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/serve-capsule-http.mjs
 */
import net from 'net';
import { spawn } from 'child_process';
import { resolveCapsuleHttpBase } from './lab-recipe-resolver.mjs';
import { ROOT } from './replication-chain-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-rocky', port: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) opts.port = Number(args[++i]);
    else if (args[i] === '-h' || args[i] === '--help') {
      process.stdout.write(
        'Usage: node usr/lib/capsuleos/tools/lab/serve-capsule-http.mjs [--id <registryId>] [--port N]\n',
      );
      process.exit(0);
    }
  }
  return opts;
};

const portOpen = (port, host = '127.0.0.1') => new Promise((resolve) => {
  const sock = net.createConnection({ port, host }, () => {
    sock.end();
    resolve(true);
  });
  sock.on('error', () => resolve(false));
  sock.setTimeout(1500, () => {
    sock.destroy();
    resolve(false);
  });
});

const resolvePort = (opts) => {
  if (opts.port) return opts.port;
  const base = resolveCapsuleHttpBase(opts.id);
  const url = new URL(base);
  return Number(url.port) || (url.protocol === 'https:' ? 443 : 80);
};

const main = async () => {
  const opts = parseArgs();
  const port = resolvePort(opts);
  const host = '127.0.0.1';
  const base = `http://${host}:${port}`;

  if (await portOpen(port, host)) {
    process.stderr.write(`✓ Port ${port} déjà ouvert — ${base}\n`);
    process.stderr.write('  (serveur non démarré ; utilisez le serveur existant)\n');
    process.exit(0);
  }

  process.stderr.write(`=== CapsuleOS HTTP : ${base} ===\n`);
  process.stderr.write(`    racine : ${ROOT}\n`);
  process.stderr.write('    Ctrl+C pour arrêter\n');

  const child = spawn('python3', ['-m', 'http.server', String(port), '--bind', host], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  child.on('exit', (code) => process.exit(code ?? 0));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
