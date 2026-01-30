# MCP Server Demo

Quick demo to show the local MCP client/server example.

Prerequisites
- Node.js (16+)

Install (if you haven't already):

```powershell
npm install
```

Run the demo (spawns multiple clients):

```powershell
npm run demo
```

Or run a single client with a custom name:

```powershell
node client.js Stephen
```

What it does
- `server.js` is a minimal newline-delimited JSON tool server exposing `say_hello`.
- `client.js` spawns `server.js`, sends `{ tool: 'say_hello', args: { name } }`, and logs the response.
- `demo.js` runs several `client.js` instances concurrently to showcase multiple requests and responses.

Web demo
- Start the web demo server and open the UI in your browser:

```powershell
npm run web
# then open http://localhost:3000 in a browser
```

The web UI lets you type a name and click "Send say_hello" to demonstrate the MCP request/response flow over WebSocket.

Calling external APIs from the server
- You can make the server call an external HTTP API via the `call_api` tool.

Usage (CLI/stdin): send a request like:

```json
{ "id": 1, "tool": "call_api", "args": { "path": "/status" } }
```

If `EXTERNAL_API_BASE` is set in the environment the `path` will be resolved relative to that base. Example (PowerShell):

```powershell
$env:EXTERNAL_API_BASE = 'https://api.example.com'
echo '{ "id": 1, "tool": "call_api", "args": { "path": "/status" } }' | node server.js
```

The server will return a JSON response containing `status`, `headers`, and `body` (parsed JSON when possible).

Want a web-based demo or a demo that uses the installed `@modelcontextprotocol/sdk` transport? I can implement that next.