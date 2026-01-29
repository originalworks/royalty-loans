import hre from 'hardhat';
import { getLatestDeployment, saveNewDeployment } from './deploymentUtils';

const deployNewTemplate = async () => {
  const [deployer] = await hre.ethers.getSigners();

  console.log(`Deploying royaltyLoanTemplate...`);

  const template = await (
    await hre.ethers.getContractFactory('RoyaltyLoan', deployer)
  ).deploy();

  await template.waitForDeployment();
  const newAddress = await template.getAddress();

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
