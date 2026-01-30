import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';

const port = process.env.PORT || 3000;
const publicDir = path.resolve('./web');

const tools = {
  say_hello: ({ name } = {}) => {
    const n = typeof name === 'string' ? name : '';
    return `Hello, ${n}! 👋`;
  },

  // Call external HTTP API. Use full URL in `path` or relative to EXTERNAL_API_BASE.
  call_api: async ({ path, method = 'GET', headers = {}, body = null } = {}) => {
    try {
      const base = process.env.EXTERNAL_API_BASE;
      const url = base ? new URL(path, base).toString() : path;
      const opts = { method, headers };
      if (body != null) {
        opts.body = typeof body === 'string' ? body : JSON.stringify(body);
        if (!opts.headers['content-type'] && !opts.headers['Content-Type']) {
          opts.headers['Content-Type'] = 'application/json';
        }
      }
      const res = await fetch(url, opts);
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      const hdrs = {};
      for (const [k, v] of res.headers.entries()) hdrs[k] = v;
      return { status: res.status, headers: hdrs, body: parsed };
    } catch (err) {
      return { error: (err && err.message) ? err.message : String(err) };
    }
  }
};

const server = http.createServer((req, res) => {
  // Provide a small config endpoint that exposes EXTERNAL_API_BASE to the UI
  if (req.url === '/config') {
    const cfg = { externalApiBase: process.env.EXTERNAL_API_BASE || null };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cfg));
    return;
  }

  // Serve static files from ./web
  let filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(publicDir, decodeURIComponent(filePath));

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(fullPath).toLowerCase();
    const type = ext === '.html' ? 'text/html' : ext === '.js' ? 'application/javascript' : 'text/plain';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const req = JSON.parse(msg.toString());
      if (req.tool && tools[req.tool]) {
        Promise.resolve(tools[req.tool](req.args || {}))
          .then((result) => {
            ws.send(JSON.stringify({ id: req.id ?? null, result }));
          })
          .catch((err) => {
            ws.send(JSON.stringify({ id: req.id ?? null, error: (err && err.message) ? err.message : String(err) }));
          });
      } else {
        ws.send(JSON.stringify({ id: req.id ?? null, error: `Unknown tool: ${String(req.tool)}` }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ id: null, error: (err && err.message) ? err.message : String(err) }));
    }
  });
});

server.listen(port, () => {
  console.log(`Web demo server running on http://localhost:${port}`);
});
