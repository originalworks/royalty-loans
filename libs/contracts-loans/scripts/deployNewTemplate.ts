import hre from 'hardhat';
import { getLatestDeployment, saveNewDeployment } from './deploymentUtils';

const deployNewTemplate = async () => {
  const [deployer] = await hre.ethers.getSigners();

  console.log('Deploying RoyaltyLoan...');

  const royaltyLoanTemplate = await (
    await hre.ethers.getContractFactory('RoyaltyLoan', deployer)
  ).deploy();

  await royaltyLoanTemplate.waitForDeployment();
  const newAddress = await royaltyLoanTemplate.getAddress();

  console.log(`Deployed at ${newAddress}`);

  const latestDeployment = await getLatestDeployment();
  await saveNewDeployment({
    ...latestDeployment,
    royaltyLoanTemplate: newAddress,
  });

  const factory = await hre.ethers.getContractAt(
    'RoyaltyLoanFactory',
    latestDeployment.royaltyLoanFactory,
    deployer,
  );

  const tx = await factory.setTemplateAddress(newAddress);
  console.log(`Setting new template address in tx ${tx.hash}...`);
  await tx.wait();

  console.log('Done');
};

void deployNewTemplate();
