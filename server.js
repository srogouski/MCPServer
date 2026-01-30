// Minimal stdio-based tool server that exposes a `say_hello` tool.
// Reads newline-delimited JSON requests from stdin:
// { "id": <optional>, "tool": "say_hello", "args": { "name": "Alice" } }
// Responds with newline-delimited JSON:
// { "id": <same id|null>, "result": "Hello, Alice! 👋" }

const tools = {
  say_hello: ({ name } = {}) => {
    const n = typeof name === 'string' ? name : '';
    return `Hello, ${n}! 👋`;
  },

  // Call an external HTTP API. Provide either a full `path` (absolute URL)
  // or a path relative to `process.env.EXTERNAL_API_BASE`.
  // args: { path, method, headers, body }
  call_api: async ({ path, method = 'GET', headers = {}, body = null } = {}) => {
    try {
      const base = process.env.EXTERNAL_API_BASE;
      const url = base ? new URL(path, base).toString() : path;

      const fetchOpts = { method, headers };
      if (body != null) {
        // allow object bodies
        fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
        if (!fetchOpts.headers['content-type'] && !fetchOpts.headers['Content-Type']) {
          fetchOpts.headers['Content-Type'] = 'application/json';
        }
      }

      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = text; }

      // return status, headers (simple object) and body
      const hdrs = {};
      for (const [k, v] of res.headers.entries()) hdrs[k] = v;
      return { status: res.status, headers: hdrs, body: parsed };
    } catch (err) {
      return { error: (err && err.message) ? err.message : String(err) };
    }
  }
};

process.stdin.setEncoding('utf8');
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const req = JSON.parse(line);
      const id = Object.prototype.hasOwnProperty.call(req, 'id') ? req.id : null;

      if (req.tool && typeof req.tool === 'string' && tools[req.tool]) {
        // Support async tools by resolving the return value (may be a Promise).
        Promise.resolve(tools[req.tool](req.args || {}))
          .then((result) => {
            const res = { id, result };
            process.stdout.write(JSON.stringify(res) + '\n');
          })
          .catch((err) => {
            const res = { id, error: (err && err.message) ? err.message : String(err) };
            process.stdout.write(JSON.stringify(res) + '\n');
          });
      } else {
        const res = { id, error: `Unknown tool: ${String(req.tool)}` };
        process.stdout.write(JSON.stringify(res) + '\n');
      }
    } catch (err) {
      const res = { id: null, error: (err && err.message) ? err.message : String(err) };
      process.stdout.write(JSON.stringify(res) + '\n');
    }
  }
});

process.stdin.on('end', () => {
  process.exit(0);
});
