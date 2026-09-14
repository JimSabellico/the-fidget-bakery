import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import checkout from './api/checkout.js';
import contact from './api/contact.js';
import config from './api/config.js';
import referralLink from './api/referral-link.js';
import stripeWebhook from './api/stripe-webhook.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  if (req.url === '/api/contact' || req.url === '/api/checkout' || req.url === '/api/config' || req.url === '/api/referral-link' || req.url === '/api/stripe-webhook') {
    if (req.url === '/api/stripe-webhook') {
      res.status = code => { res.statusCode = code; return res; };
      res.json = obj => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
      return stripeWebhook(req, res);
    }
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { req.body = JSON.parse(raw || '{}'); } catch { req.body = {}; }
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
    return (req.url === '/api/contact' ? contact : req.url === '/api/config' ? config : req.url === '/api/referral-link' ? referralLink : checkout)(req, res);
  }
  const safe = path.normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^\.\.([/\\]|$)/, '');
  const pageRoute = /^\/(fidgets|wiggles)(\/[^/]+)?$/.test(safe) || /^\/(teachers|teacher-packs|custom|contact|cart|where-to-buy|share-the-fun)$/.test(safe);
  const file = path.join(root, safe === '/' || pageRoute ? 'index.html' : safe);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
server.listen(process.env.PORT || 3000, () => console.log(`Fidget Bakery preview: http://localhost:${process.env.PORT || 3000}`));
