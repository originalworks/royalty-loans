import { defineConfig } from '@wagmi/cli';

export default defineConfig({
  out: 'src/generated/smart-contracts/index.ts',
  contracts: [
    {
      abi: require('./src/abis/RoyaltyLoan.json'),
      name: 'RoyaltyLoan',
    },
  ],
});
