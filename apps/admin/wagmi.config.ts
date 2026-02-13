import { defineConfig } from '@wagmi/cli';

export default defineConfig({
  out: 'src/generated/smart-contracts/index.ts',
  contracts: [
    {
      abi: require('./src/abis/AgreementERC1155.json'),
      name: 'AgreementERC1155',
    },
    {
      abi: require('./src/abis/ERC20.json'),
      name: 'ERC20',
    },
    {
      abi: require('./src/abis/RoyaltyLoan.json'),
      name: 'RoyaltyLoan',
    },
  ],
});
