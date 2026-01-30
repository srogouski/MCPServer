import { spawn } from 'child_process';

const node = process.execPath;
const child = spawn(node, ['server.js'], { stdio: ['pipe', 'pipe', 'inherit'] });

function sendRequest(tool, args = {}, id = 1) {
  const req = { id, tool, args };
  child.stdin.write(JSON.stringify(req) + '\n');

  return new Promise((resolve, reject) => {
    let buffer = '';

    const onData = (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const res = JSON.parse(line);
          if (res.id === id) {
            child.stdout.off('data', onData);
            resolve(res);
          }
        } catch (err) {
          // ignore parse errors for partial lines
        }
      }
    };

    child.stdout.on('data', onData);

    // Timeout in case server doesn't respond
    setTimeout(() => {
      child.stdout.off('data', onData);
      reject(new Error('timeout waiting for response'));
    }, 5000);
  });
}

(async () => {
  const name = process.argv[2] || 'Alice';
  try {
    const res = await sendRequest('say_hello', { name }, 1);
    console.log('Response from server:', res);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    try { child.stdin.end(); } catch (e) {}
    try { child.kill(); } catch (e) {}
  }
})();
