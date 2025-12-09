import hre from 'hardhat';
import { getLatestDeployment } from './deploymentUtils';

const addressToWhitelist = '';

export const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  const { whitelist: whitelistAddress } = await getLatestDeployment();

  const whitelist = await hre.ethers.getContractAt(
    'Whitelist',
    whitelistAddress,
    deployer,
  );

  const tx = await whitelist.addToWhitelist(addressToWhitelist);
  console.log(`Adding to whitelist at tx ${tx.hash}...`);

  await tx.wait();

  console.log('DONE!');
};

void main();
