import { defineConfig } from '@wagmi/cli';

export default defineConfig({
  out: 'src/generated/smart-contracts/index.ts',
  contracts: [
    {
      abi: require('./src/abis/RoyaltyLoan.json'),
      name: 'RoyaltyLoan',
    },
    {
      abi: require('./src/abis/ERC20.json'),
      name: 'ERC20',
    },
  ],
});
