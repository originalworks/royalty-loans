import hre from 'hardhat';

const LOAN_FACTORY_ADDRESS = '0x63D5BFFf71d1BFE6a093348020aecd9506Fc7EEd';
const NEW_IMPLEMENTATION_NAME = 'RoyaltyLoanFactory';

const upgradeLoanFactory = async () => {
  const [deployer] = await hre.ethers.getSigners();

  const NewImpl = await hre.ethers.getContractFactory(
    NEW_IMPLEMENTATION_NAME,
    deployer,
  );
  console.log('Upgrading RoyaltyLoanFactory...');
  try {
    await hre.upgrades.upgradeProxy(LOAN_FACTORY_ADDRESS, NewImpl, {
      kind: 'uups',
    });
    console.log('RoyaltyLoanFactory upgraded');
  } catch (err) {
    console.error(err);
  }
};

void upgradeLoanFactory();
