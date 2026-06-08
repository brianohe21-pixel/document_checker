import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function run(command, args, name) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[dev] ${name} exited with code ${code}`);
    }
  });
  return child;
}

const children = [];

function shutdown() {
  for (const child of children) {
    child.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

children.push(run('pnpm', ['--filter', '@certchain/contracts', 'dev'], 'contracts'));
children.push(run('pnpm', ['--filter', '@certchain/shared', 'dev'], 'shared'));
children.push(run('pnpm', ['--filter', '@certchain/web', 'dev'], 'web'));

const api = spawn('pnpm', ['--filter', '@certchain/api', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
children.push(api);

api.on('exit', (code) => {
  if (code && code !== 0) {
    shutdown();
  }
});
