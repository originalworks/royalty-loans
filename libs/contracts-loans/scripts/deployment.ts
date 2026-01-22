import hre from 'hardhat';
import { deployRoyaltyLoanFactory } from './RoyaltyLoanFactory';
import { saveNewDeployment } from './deploymentUtils';

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();
  const paymentTokenAddress = hre.network.config.USDCAddress;
  if (!paymentTokenAddress) {
    throw new Error('USDC address not set');
  }

  console.log('Deploying loanFactory...');
  const factoryDeployment = await deployRoyaltyLoanFactory(
    deployer,
    paymentTokenAddress,
  );
  console.log('Done!');

  const deploymentFile = {
    deployer: deployer.address,
    standardRoyaltyLoanTemplate: factoryDeployment.standardRoyaltyLoanTemplate,
    beneficiaryRoyaltyLoanTemplate:
      factoryDeployment.beneficiaryRoyaltyLoanTemplate,
    royaltyLoanFactory: factoryDeployment.royaltyLoanFactory,
    paymentToken: paymentTokenAddress,
  };

  await saveNewDeployment(deploymentFile);
};

void main();
