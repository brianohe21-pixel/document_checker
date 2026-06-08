import { spawn } from 'child_process';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractsDir = path.join(__dirname, '..');
const rootDir = path.join(contractsDir, '../..');
const envPath = path.join(rootDir, '.env');
const rpcUrl = 'http://127.0.0.1:8545';

function updateEnv(key, value) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  content = pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
  fs.writeFileSync(envPath, content);
}

async function waitForRpc(maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
      });
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Hardhat node did not start');
}

async function deployAndConfigure() {
  const deploymentsDir = path.join(contractsDir, 'deployments');
  if (fs.existsSync(deploymentsDir)) {
    fs.rmSync(deploymentsDir, { recursive: true, force: true });
  }

  execSync('npx hardhat run scripts/deploy.ts --network localhost', {
    cwd: contractsDir,
    stdio: 'inherit',
  });

  const deployment = JSON.parse(
    fs.readFileSync(path.join(contractsDir, 'deployments/localhost.json'), 'utf-8'),
  );

  updateEnv('RPC_URL', rpcUrl);
  updateEnv(
    'PRIVATE_KEY',
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  );
  updateEnv('CONTRACT_ADDRESS', deployment.address);

  console.log(`\n[dev-node] Contract deployed at ${deployment.address}\n`);
}

const node = spawn('npx', ['hardhat', 'node'], {
  cwd: contractsDir,
  stdio: 'inherit',
  shell: true,
});

node.on('exit', (code) => process.exit(code ?? 1));

waitForRpc()
  .then(deployAndConfigure)
  .catch((err) => {
    console.error('[dev-node]', err.message);
    node.kill();
    process.exit(1);
  });
