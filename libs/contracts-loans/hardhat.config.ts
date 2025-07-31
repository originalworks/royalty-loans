import * as dotenv from 'dotenv';

import '@typechain/hardhat';
import '@rumblefishdev/hardhat-kms-signer';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-verify';
import '@openzeppelin/hardhat-upgrades';

import { HardhatUserConfig } from 'hardhat/config';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: { evmVersion: 'cancun' },
  },
  paths: {
    sources: './libs',
    artifacts: './artifacts',
    cache: './cache',
  },
  networks: {
    base_sepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: `${process.env.KMS_KEY_ID}`,
      minMaxPriorityFeePerGas: 1500000000,
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: `${process.env.KMS_KEY_ID}`,
      timeout: 100000,
    },
  },
  etherscan: {
    apiKey: {
      holesky: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      chiado: process.env.BLOCKSCOUT_API_KEY || '',
      base_sepolia: process.env.BASESCAN_API_KEY ?? '',
      base: process.env.BASESCAN_API_KEY ?? '',
    },
    customChains: [
      {
        network: 'base_sepolia',
        chainId: 84532,
        urls: {
          apiURL: 'https://api-sepolia.basescan.org/api',
          browserURL: 'https://sepolia-explorer.base.org',
        },
      },
    ],
  },
  typechain: {
    outDir: 'typechain',
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
