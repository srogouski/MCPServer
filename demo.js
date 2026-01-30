import { spawn } from 'child_process';

const names = ['Alex','Morgan','Taylor','Jordan','Riley','Sam','Casey','Jamie'];

function runClient(name) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, ['client.js', name], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    p.stdout.on('data', (c) => { out += c.toString(); });
    p.on('close', () => resolve({ name, output: out.trim() }));
  });
}

(async () => {
  console.log('Starting demo: spawning clients...');
  const tasks = names.map(runClient);
  const results = await Promise.all(tasks);

  console.log('\nDemo results:');
  for (const r of results) {
    console.log(`- ${r.name}: ${r.output || '<no output>'}`);
  }

  console.log('\nDemo complete.');
})();
