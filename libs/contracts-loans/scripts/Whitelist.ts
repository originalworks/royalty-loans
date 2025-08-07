import hre from 'hardhat';
import { Signer } from 'ethers';

export async function deployWhitelist(
  deployer: Signer,
  initiallyWhitelisted: string[],
) {
  const Whitelist = await hre.ethers.getContractFactory('Whitelist');
  const whitelist = await Whitelist.connect(deployer).deploy(deployer);
  await whitelist.waitForDeployment();

  for (let i = 0; i < initiallyWhitelisted.length; i++) {
    const address = initiallyWhitelisted[i];
    await whitelist.addToWhitelist(address);
  }

  return {
    contract: whitelist,
    contractVerificationInput: {
      deployedContractAddress: await whitelist.getAddress(),
      args: [await deployer.getAddress()],
    },
  };
}
