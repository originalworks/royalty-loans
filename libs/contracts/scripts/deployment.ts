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

  const whitelistDeployment = await deployWhitelist(deployer, [
    deployer.address,
    '0x90DA1d45b73d975CCFfFC7619cEd34443681e506',
  ]);

  const factoryDeployment = await deployRoyaltyLoanFactory(
    deployer,
    await whitelistDeployment.contract.getAddress(),
  );

  const deploymentFile = {
    deployer: deployer.address,
    royaltyLoanTemplate: factoryDeployment.royaltyLoanTemplate,
    royaltyLoanFactory: factoryDeployment.royaltyLoanFactory,
    whitelist: await whitelistDeployment.contract.getAddress(),
    paymentToken: '0x46Bc2338a282383fe2585Ef5F0171E62FdCEf3B0',
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
