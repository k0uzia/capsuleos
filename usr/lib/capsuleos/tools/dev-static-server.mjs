#!/usr/bin/env node
/**
 * Serveur HTTP statique dev — redirige les routes PHP vers index.html.
 * Usage interne : serve-capsuleos.mjs dev
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.php': 'text/html; charset=utf-8',
};

const NO_STORE = new Set([
    '/usr/lib/capsuleos/site/portal-site-home.js',
    '/index.html',
    '/account.html',
    '/sw.js',
]);

const shouldRedirectToDevHome = (pathname) => {
    if (pathname === '/portal/account.php') {
        return false;
    }
    if (pathname === '/index.php') {
        return true;
    }
    if (pathname === '/portal' || pathname.startsWith('/portal/')) {
        return true;
    }
    return false;
};

const devRedirectTarget = (pathname, url) => {
    if (pathname === '/portal/account.php') {
        return `/account.html${url.search || ''}${url.hash || ''}`;
    }
    if (shouldRedirectToDevHome(pathname)) {
        return `/index.html${url.search || ''}${url.hash || ''}`;
    }
    return null;
};

const resolveFile = (pathname) => {
    const rel = pathname === '/' ? '/index.html' : pathname;
    const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
    const abs = path.join(ROOT, safe);
    if (!abs.startsWith(ROOT)) {
        return null;
    }
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
        const index = path.join(abs, 'index.html');
        return fs.existsSync(index) ? index : null;
    }
    return fs.existsSync(abs) && fs.statSync(abs).isFile() ? abs : null;
};

/**
 * @param {{ host?: string, port?: number }} opts
 */
export const startDevServer = (opts = {}) => {
    const host = opts.host || '127.0.0.1';
    const port = opts.port || 8080;

    const server = http.createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${host}:${port}`);
        const pathname = decodeURIComponent(url.pathname);

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Method not allowed');
            return;
        }

        const redirectTarget = devRedirectTarget(pathname, url);
        if (redirectTarget !== null) {
            res.writeHead(302, {
                Location: redirectTarget,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            });
            res.end();
            return;
        }

        const filePath = resolveFile(pathname);
        if (!filePath) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`404 — ${pathname}\n`);
            return;
        }

        const rel = `/${path.relative(ROOT, filePath).split(path.sep).join('/')}`;
        const ext = path.extname(filePath).toLowerCase();
        const headers = {
            'Content-Type': MIME[ext] || 'application/octet-stream',
        };
        if (NO_STORE.has(rel) || rel.endsWith('portal-site-home.js')) {
            headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
        }

        if (req.method === 'HEAD') {
            res.writeHead(200, headers);
            res.end();
            return;
        }

        res.writeHead(200, headers);
        fs.createReadStream(filePath).pipe(res);
    });

    return new Promise((resolve, reject) => {
        server.on('error', reject);
        server.listen(port, host, () => resolve(server));
    });
};

if (import.meta.url === `file://${process.argv[1]}`) {
    const port = Number(process.env.PORT || 8080);
    const host = process.env.HOST || '127.0.0.1';
    startDevServer({ host, port }).then(() => {
        process.stderr.write(`dev-static-server http://${host}:${port}/\n`);
    });
}
