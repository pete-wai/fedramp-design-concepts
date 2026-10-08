import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { validBase } from './variants.mjs';
import { LAN_BIND_ADDRESS, isLanRequestAllowed } from './lan-preview.mjs';

const directory = path.resolve(process.argv[2] || 'output/gallery');
const port = Number(process.argv[3] || 4100);
const base = validBase(process.argv[4] || '');
const mode = process.argv[5];
if ((mode !== undefined && mode !== '--lan') || process.argv.length > 6) {
  throw new Error('Usage: node scripts/serve.mjs [directory] [port] [base] [--lan]');
}
const lanMode = mode === '--lan';
const host = lanMode ? LAN_BIND_ADDRESS : '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain' };
const server = http.createServer((request, response) => {
  if (lanMode && !isLanRequestAllowed(request)) {
    response.writeHead(403, { 'content-type': 'text/plain', 'cache-control': 'no-store' });
    response.end('Access is restricted to the local preview subnet.');
    return;
  }
  try {
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (base && pathname === base) { response.writeHead(308, { Location: `${base}/${url.search}` }); response.end(); return; }
    if (base && !pathname.startsWith(`${base}/`)) { response.writeHead(404); response.end('Page not found'); return; }
    let file = path.resolve(directory, `.${pathname.slice(base.length)}`);
    if (file !== directory && !file.startsWith(`${directory}${path.sep}`)) { response.writeHead(403); response.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.pathname.endsWith('/')) { response.writeHead(308, { Location: `${url.pathname}/${url.search}` }); response.end(); return; }
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404, { 'content-type': 'text/plain' }); response.end('Page not found'); return; }
    const realFile = fs.realpathSync(file);
    const realDirectory = fs.realpathSync(directory);
    if (!realFile.startsWith(`${realDirectory}${path.sep}`)) { response.writeHead(403); response.end(); return; }
    response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    if (request.method === 'HEAD') { response.end(); return; }
    fs.createReadStream(file).pipe(response);
  } catch { response.writeHead(400); response.end('Bad request'); }
});
server.listen(port, host, () => console.log(`Serving ${directory} at http://${host}:${port}${base}/`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
