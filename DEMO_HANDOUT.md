**MCP Client/Server Demo — One-Slide Summary**

- **Purpose:** Demonstrate a minimal, extendable Model Context Protocol (MCP) client/server showing live request→response behavior.

- **Architecture:**
  - Server: `web_server.js` (HTTP + WebSocket) exposing a `say_hello` tool.
  - CLI server: `server.js` (newline-delimited JSON/stdio) for simple tool execution.
  - Clients: `client.js` (CLI), browser UI (`web/index.html` + `web/app.js`), and `demo.js` (multiple concurrent CLI clients).

- **Live demo steps:**
  1. Install deps: `npm install`
  2. Web UI (director-facing): `npm run web` → open http://localhost:3000
     - Type a name and click “Send say_hello” to show request and response in real time.
  3. CLI concurrency demo (optional): `npm run demo` — shows multiple clients calling the server and summarizing results.

- **What to highlight:**
  - Simple JSON request format: `{ id, tool: "say_hello", args: { name } }` → response `{ id, result }`.
  - Real-time interaction over WebSocket and working CLI version for automation/testing.
  - Easy to extend: add new tool functions to `web_server.js` or `server.js` in minutes.

- **Next/Options:**
  - Integrate `@modelcontextprotocol/sdk` transports and types for standards compliance.
  - Add a polished web UI or slide PDF export for executive presentation.
  - Record a short screencast of the demo for distribution.

Prepared by: Demo generator (local repo)
