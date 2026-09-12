import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import checkout from './api/checkout.js';
import contact from './api/contact.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer(async (req, res) => {
  if (req.url === '/api/contact' || req.url === '/api/checkout') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { req.body = JSON.parse(raw || '{}'); } catch { req.body = {}; }
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
    return (req.url === '/api/contact' ? contact : checkout)(req, res);
  }
  const safe = path.normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^\.\.([/\\]|$)/, '');
  const file = path.join(root, safe === '/' ? 'index.html' : safe);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
server.listen(process.env.PORT || 3000, () => console.log(`Fidget Bakery preview: http://localhost:${process.env.PORT || 3000}`));
