import hre from 'hardhat';
import { deployWhitelist } from './Whitelist';
import { deployRoyaltyLoanFactory } from './RoyaltyLoanFactory';
import { writeFileSync } from 'fs';

function buildDeploymentFileName() {
  const network = process.env.HARDHAT_NETWORK || 'unknown';
  const date = new Date(Date.now());
  const month =
    date.getMonth() + 1 > 9 ? date.getMonth() + 1 : `0${date.getMonth() + 1}`;
  const day = date.getDate() > 9 ? date.getDate() : `0${date.getDate()}`;
  const hour = date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`;
  const minute =
    date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`;
  const second =
    date.getSeconds() > 9 ? date.getSeconds() : `0${date.getSeconds()}`;
  const dateString = `${date.getFullYear()}-${month}-${day}_${hour}:${minute}:${second}`;
  return `${network}__${dateString}.json`;
}

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();

  console.log('Deploying whitelists...');
  const whitelistDeployment = await deployWhitelist(deployer, [
    deployer.address,
    '0x90DA1d45b73d975CCFfFC7619cEd34443681e506',
  ]);
  console.log('Done');
  const paymentTokenAddress = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

  console.log('Deploying loanFactory...');
  const factoryDeployment = await deployRoyaltyLoanFactory(
    deployer,
    await whitelistDeployment.contract.getAddress(),
    paymentTokenAddress,
  );
  console.log('Done!');

  const deploymentFile = {
    deployer: deployer.address,
    royaltyLoanTemplate: factoryDeployment.royaltyLoanTemplate,
    royaltyLoanFactory: factoryDeployment.royaltyLoanFactory,
    whitelist: await whitelistDeployment.contract.getAddress(),
    paymentToken: paymentTokenAddress,
  };

  // DEPLOYMENT
  const deploymentDataFilePath = `./deployments/${buildDeploymentFileName()}`;
  console.log('deployment data:', deploymentFile);
  console.log('saved to:', deploymentDataFilePath);

  writeFileSync(
    deploymentDataFilePath,
    JSON.stringify(deploymentFile, null, 2),
  );
};

void main();
