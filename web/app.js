const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const apiPathInput = document.getElementById('apiPath');
const callApiBtn = document.getElementById('callApi');
const apiBaseInput = document.getElementById('apiBase');
const saveSettingsBtn = document.getElementById('saveSettings');
const resetSettingsBtn = document.getElementById('resetSettings');
const clearResultsBtn = document.getElementById('clearResults');

const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
let nextId = 1;

ws.addEventListener('open', () => {
  statusEl.textContent = 'Connected';
});
ws.addEventListener('close', () => { statusEl.textContent = 'Disconnected'; });
ws.addEventListener('error', () => { statusEl.textContent = 'Error'; });

ws.addEventListener('message', (ev) => {
  try {
    const res = JSON.parse(ev.data);
    // Pretty-print the result when possible
    const pretty = typeof res.result === 'object' ? JSON.stringify(res.result, null, 2) : JSON.stringify(res);
    appendLog('Received: ' + pretty);
  } catch (err) {
    appendLog('Invalid response: ' + ev.data);
  }
});

function appendLog(s) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerText = s;
  logEl.appendChild(entry);
  // keep latest visible
  logEl.scrollTop = logEl.scrollHeight;
}

// Call API button behavior (resolved to absolute URL if API base is set)
callApiBtn.addEventListener('click', () => {
  const rawPath = apiPathInput.value || '';
  const path = resolvePathForCall(rawPath);
  const id = nextId++;
  const req = { id, tool: 'call_api', args: { path } };
  appendLog('Sending: ' + JSON.stringify(req));
  ws.send(JSON.stringify(req));
});

// Clear results button
clearResultsBtn.addEventListener('click', () => {
  logEl.textContent = '';
});

// Settings: load server-provided base and allow local override
async function loadSettings() {
  // server-provided default
  try {
    const r = await fetch('/config');
    if (r.ok) {
      const cfg = await r.json();
      if (cfg.externalApiBase) {
        apiBaseInput.value = cfg.externalApiBase;
      }
    }
  } catch (err) {
    // ignore
  }

  // local override
  const local = localStorage.getItem('mcp_api_base');
  if (local) apiBaseInput.value = local;
}

saveSettingsBtn.addEventListener('click', () => {
  const v = apiBaseInput.value || '';
  if (v) localStorage.setItem('mcp_api_base', v);
  else localStorage.removeItem('mcp_api_base');
  appendLog('Settings saved');
});

resetSettingsBtn.addEventListener('click', async () => {
  localStorage.removeItem('mcp_api_base');
  await loadSettings();
  appendLog('Settings reset');
});

// Before sending a call_api request, if the path is relative and there is a base
// configured (local override or server-provided), resolve the path to an absolute URL.
function resolvePathForCall(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const local = localStorage.getItem('mcp_api_base');
  const base = local || apiBaseInput.value || '';
  if (base) {
    try { return new URL(path, base).toString(); } catch { return path; }
  }
  return path; // no base available
}

// Call API button behavior (resolved to absolute URL if API base is set)
callApiBtn.addEventListener('click', () => {
  const rawPath = apiPathInput.value || '';
  const path = resolvePathForCall(rawPath);
  const id = nextId++;
  const req = { id, tool: 'call_api', args: { path } };
  appendLog('Sending: ' + JSON.stringify(req));
  ws.send(JSON.stringify(req));
});

// initialize
loadSettings().catch(() => {});
