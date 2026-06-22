#!/usr/bin/env node
/**
 * Lance CapsuleOS en dev (statique) ou prod (PHP + router).
 * Usage : node usr/lib/capsuleos/tools/serve-capsuleos.mjs <dev|prod> [--port 8080] [--host 127.0.0.1]
 */
import { spawn } from 'child_process';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { startDevServer } from './dev-static-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const PROFILE_ALIASES = new Set(['sub', 'abonne', 'prof', 'professeur', 'creator', 'createur']);

const parseArgs = () => {
    const args = process.argv.slice(2);
    const opts = { mode: 'dev', port: 8080, host: '127.0.0.1', profile: null };
    if (args[0] === 'dev' || args[0] === 'prod') {
        opts.mode = args.shift();
    }
    for (let i = 0; i < args.length; i += 1) {
        if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) {
            opts.port = Number(args[++i]);
        } else if ((args[i] === '--host' || args[i] === '-H') && args[i + 1]) {
            opts.host = args[++i];
        } else if (args[i] === '--profile' && args[i + 1]) {
            opts.profile = String(args[++i]).toLowerCase();
        } else if (args[i] === '-h' || args[i] === '--help') {
            process.stdout.write(
                'Usage: node usr/lib/capsuleos/tools/serve-capsuleos.mjs <dev|prod> [--port N] [--host IP] [--profile sub|prof|creator]\n',
            );
            process.exit(0);
        }
    }
    return opts;
};

const main = async () => {
    const opts = parseArgs();
    if (opts.mode === 'prod' && opts.profile && !PROFILE_ALIASES.has(opts.profile)) {
        console.error(`Profil invalide : ${opts.profile} — utiliser sub, prof ou creator`);
        process.exit(1);
    }
    const build = spawnSync(
        process.execPath,
        ['usr/lib/capsuleos/tools/build-portal-site-home.mjs', opts.mode],
        { cwd: ROOT, stdio: 'inherit', env: { ...process.env, CAPSULE_PORTAL_MODE: opts.mode } },
    );
    if (build.status !== 0) {
        process.exit(build.status ?? 1);
    }

    const addr = `${opts.host}:${opts.port}`;
    process.stderr.write(`\n=== CapsuleOS [${opts.mode}] http://${addr}/ ===\n`);
    process.stderr.write(`    racine : ${ROOT}\n`);
    if (opts.mode === 'prod') {
        process.stderr.write('    accueil → index.php (portail PHP)\n');
        process.stderr.write('    routes /portal/*.php actives\n');
        if (opts.profile) {
            process.stderr.write(`    profil simulé : ${opts.profile}\n`);
            process.stderr.write('    connexion test : test / test123456789\n');
        }
    } else {
        process.stderr.write('    accueil → index.html (statique)\n');
        process.stderr.write('    /index.php et /portal/* → redirect index.html\n');
    }
    process.stderr.write('    Ctrl+C pour arrêter\n\n');

    if (opts.mode === 'prod') {
        const phpEnv = { ...process.env, CAPSULE_PORTAL_MODE: 'prod' };
        if (opts.profile) {
            phpEnv.CAPSULE_PORTAL_PROD_PROFILE = opts.profile;
        }
        const child = spawn('php', ['-S', addr, '-t', '.', 'router.php'], {
            cwd: ROOT,
            stdio: 'inherit',
            env: phpEnv,
        });
        child.on('exit', (code) => process.exit(code ?? 0));
        return;
    }

    await startDevServer({ host: opts.host, port: opts.port });
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
