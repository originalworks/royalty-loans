import hre from 'hardhat';
import { deployRoyaltyAdvanceFactory } from './RoyaltyAdvanceFactory';
import { saveNewDeployment } from './deploymentUtils';

const AGREEMENT_FACTORY_ADDRESS = '0x';

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();
  const paymentTokenAddress = hre.network.config.USDCAddress;
  if (!paymentTokenAddress) {
    throw new Error('USDC address not set');
  }

  console.log('Deploying loanFactory...');
  const factoryDeployment = await deployRoyaltyAdvanceFactory(
    deployer,
    paymentTokenAddress,
    AGREEMENT_FACTORY_ADDRESS,
  );
  console.log('Done!');

  const deploymentFile = {
    deployer: deployer.address,
    royaltyAdvanceTemplate: factoryDeployment.royaltyAdvanceTemplate,
    royaltyAdvanceFactory: factoryDeployment.royaltyAdvanceFactory,
    agreementFactory: AGREEMENT_FACTORY_ADDRESS,
    paymentToken: paymentTokenAddress,
  };

  await saveNewDeployment(deploymentFile);
};

void main();
