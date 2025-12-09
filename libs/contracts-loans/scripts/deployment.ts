import hre from 'hardhat';
import { deployWhitelist } from './Whitelist';
import { deployRoyaltyLoanFactory } from './RoyaltyLoanFactory';
import { saveNewDeployment } from './deploymentUtils';

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();
  const paymentTokenAddress = hre.network.config.USDCAddress;
  if (!paymentTokenAddress) {
    throw new Error('USDC address not set');
  }

  let whitelistAddress = hre.network.config.defaultWhitelist;

  if (!whitelistAddress) {
    console.log('Deploying whitelists...');
    const whitelistDeployment = await deployWhitelist(deployer, [
      deployer.address,
      '0x90DA1d45b73d975CCFfFC7619cEd34443681e506',
      '0x78F2588052e48Be9bB74114b355423161e026Eea',
      '0x35afa24e1d9375934ac0749ebad4ca9b57cafb73',
      '0xB964Af78353fA64acD76EAfBD63D8c4409522f79',
    ]);
    whitelistAddress = await whitelistDeployment.contract.getAddress();
    console.log('Done');
  } else {
    console.log('Using whitelist from config...');
  }

  console.log('Deploying loanFactory...');
  const factoryDeployment = await deployRoyaltyLoanFactory(
    deployer,
    whitelistAddress,
    paymentTokenAddress,
  );
  console.log('Done!');

  const deploymentFile = {
    deployer: deployer.address,
    royaltyLoanTemplate: factoryDeployment.royaltyLoanTemplate,
    royaltyLoanFactory: factoryDeployment.royaltyLoanFactory,
    whitelist: whitelistAddress,
    paymentToken: paymentTokenAddress,
  };

  await saveNewDeployment(deploymentFile);
};

void main();
