import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');

const LOCAL_RPC = 'http://127.0.0.1:8545';
const LOCAL_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

function waitForRpc(url, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = async () => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
        });
        if (res.ok) {
          resolve();
          return;
        }
      } catch {
        // retry
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error('Hardhat node not reachable at ' + url));
        return;
      }
      setTimeout(check, 1000);
    };
    check();
  });
}

function updateEnv(key, value) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  content = pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
  fs.writeFileSync(envPath, content);
}

async function main() {
  console.log('Waiting for local Hardhat node...');
  await waitForRpc(LOCAL_RPC);

  console.log('Deploying CertificateRegistry to localhost...');
  execSync('pnpm deploy:local', {
    cwd: path.join(rootDir, 'packages/contracts'),
    stdio: 'inherit',
  });

  const deploymentPath = path.join(rootDir, 'packages/contracts/deployments/localhost.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));

  updateEnv('RPC_URL', LOCAL_RPC);
  updateEnv('PRIVATE_KEY', LOCAL_PRIVATE_KEY);
  updateEnv('CONTRACT_ADDRESS', deployment.address);

  console.log('\nLocal blockchain configured in .env:');
  console.log('  RPC_URL=' + LOCAL_RPC);
  console.log('  CONTRACT_ADDRESS=' + deployment.address);
  console.log('\nRestart the API (pnpm dev) if it is already running.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
