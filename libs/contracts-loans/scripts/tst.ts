import hre from 'hardhat';
import { RoyaltyLoan__factory } from '../typechain';

const main = async () => {
  const [signer] = await hre.ethers.getSigners();

  const contract = await RoyaltyLoan__factory.connect(
    '0xB682134A33e23e9EeD6f06e9113c7b927ad09f90',
    signer,
  );

  const tst = await contract.collaterals('0');

  console.log(tst);
};

void main();
