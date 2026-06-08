import { run } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const deploymentPath = path.join(__dirname, '../deployments/amoy.json');
  if (!fs.existsSync(deploymentPath)) {
    throw new Error('No deployment found. Run deploy:amoy first.');
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8')) as {
    address: string;
  };

  await run('verify:verify', {
    address: deployment.address,
    constructorArguments: [],
  });

  console.log('Contract verified on PolygonScan');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
