import hre from 'hardhat';

const LOAN_FACTORY_ADDRESS = '0x7F089CB03A9Ad6e89F2a42A186059Dce29FC2360';
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
