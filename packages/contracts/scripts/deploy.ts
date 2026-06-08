import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

const HARDHAT_DEV_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId === 80002n) {
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
      throw new Error(
        'AMOY_PRIVATE_KEY is required. Set a funded Polygon Amoy wallet in .env before deploy:amoy.',
      );
    }
    const key = process.env.AMOY_PRIVATE_KEY ?? process.env.PRIVATE_KEY ?? '';
    if (key.toLowerCase() === HARDHAT_DEV_KEY.toLowerCase()) {
      throw new Error(
        'AMOY_PRIVATE_KEY must be a real funded wallet. The Hardhat dev key has no MATIC on Amoy.',
      );
    }
  }

  const Factory = await ethers.getContractFactory('CertificateRegistry');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('CertificateRegistry deployed to:', address);

  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const artifact = await ethers.provider.getCode(address);
  if (artifact === '0x') {
    throw new Error('Contract deployment failed');
  }

  const networkName = (await ethers.provider.getNetwork()).name;
  const networkKey = networkName === 'unknown' ? 'localhost' : networkName;

  const deployment = {
    address,
    network: networkKey,
    deployedAt: new Date().toISOString(),
  };

  const deploymentFile = path.join(deploymentsDir, `${networkKey}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

  console.log(`Deployment info saved to deployments/${networkKey}.json`);
  console.log('Set CONTRACT_ADDRESS=' + address + ' in your .env file');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
