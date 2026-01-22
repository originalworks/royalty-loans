import hre from 'hardhat';
import { getLatestDeployment, saveNewDeployment } from './deploymentUtils';

type TemplateType = 'Standard' | 'Beneficiary';

const deployNewTemplate = async (type: TemplateType) => {
  const [deployer] = await hre.ethers.getSigners();

  console.log(`Deploying ${type}RoyaltyLoanTemplate...`);

  let template;

  if (type === 'Standard') {
    template = await (
      await hre.ethers.getContractFactory('RoyaltyLoan', deployer)
    ).deploy();
  } else {
    template = await (
      await hre.ethers.getContractFactory('BeneficiaryRoyaltyLoan', deployer)
    ).deploy();
  }

  await template.waitForDeployment();
  const newAddress = await template.getAddress();

  console.log(`Deployed at ${newAddress}`);

  const latestDeployment = await getLatestDeployment();

  if (type === 'Standard') {
    await saveNewDeployment({
      ...latestDeployment,
      standardRoyaltyLoanTemplate: newAddress,
    });
  } else {
    await saveNewDeployment({
      ...latestDeployment,
      beneficiaryRoyaltyLoanTemplate: newAddress,
    });
  }

  const factory = await hre.ethers.getContractAt(
    'RoyaltyLoanFactory',
    latestDeployment.royaltyLoanFactory,
    deployer,
  );

  const tx = await factory.setTemplateAddress(
    type === 'Standard' ? 0n : 1n,
    newAddress,
  );
  console.log(`Setting new template address in tx ${tx.hash}...`);
  await tx.wait();

  console.log('Done');
};

void deployNewTemplate('Standard');
