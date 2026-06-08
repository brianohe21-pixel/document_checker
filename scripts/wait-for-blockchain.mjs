import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const deploymentPath = path.join(rootDir, 'packages/contracts/deployments/localhost.json');
const envPath = path.join(rootDir, '.env');
const rpcUrl = process.env.RPC_URL ?? 'http://127.0.0.1:8545';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rpcCall(method, params = []) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function isRpcReady() {
  try {
    const data = await rpcCall('eth_chainId');
    return Boolean(data?.result);
  } catch {
    return false;
  }
}

function getContractAddress() {
  if (fs.existsSync(deploymentPath)) {
    try {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
      if (deployment.address) return deployment.address;
    } catch {
      // ignore invalid file while deploy is in progress
    }
  }

  if (fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, 'utf-8').match(/^CONTRACT_ADDRESS=(.+)$/m);
    const address = match?.[1]?.trim();
    if (address) return address;
  }

  return null;
}

async function hasBytecode(address) {
  try {
    const data = await rpcCall('eth_getCode', [address, 'latest']);
    return typeof data?.result === 'string' && data.result !== '0x';
  } catch {
    return false;
  }
}

async function main() {
  console.log('[wait-for-blockchain] Waiting for Hardhat node and contract deployment...');

  for (let i = 0; i < 180; i++) {
    if (!(await isRpcReady())) {
      await sleep(500);
      continue;
    }

    const address = getContractAddress();
    if (address && (await hasBytecode(address))) {
      console.log(`[wait-for-blockchain] Contract ready at ${address}`);
      return;
    }

    await sleep(500);
  }

  throw new Error(
    'Local blockchain contract not available after 90s. Ensure packages/contracts dev is running.',
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
