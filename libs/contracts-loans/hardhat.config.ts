import * as dotenv from 'dotenv';

import '@typechain/hardhat';
import '@rumblefishdev/hardhat-kms-signer';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-verify';
import '@openzeppelin/hardhat-upgrades';

import { extendConfig, HardhatUserConfig } from 'hardhat/config';
import { HardhatConfig } from 'hardhat/types';

// extendConfig(
//   (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
//     if (!userConfig.networks) return;

//     for (const networkName of Object.keys(userConfig.networks)) {
//       const whitelistedAddresses =
//         userConfig.networks[networkName]?.whitelistedAddresses ?? [];
//       config.networks[networkName].whitelistedAddresses = whitelistedAddresses;

//       const env = userConfig.networks[networkName]?.env ?? 'local';
//       config.networks[networkName].env = env;
//     }
//   },
// );

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: { evmVersion: 'cancun' },
  },
  networks: {
    base_sepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: `${process.env.KMS_KEY_ID}`,
      minMaxPriorityFeePerGas: 1500000000,
      defaultWhitelist: '0xa460BcC532C48B218F3e3580d9eb7653EA2A9D21',
      USDCAddress: '0x46Bc2338a282383fe2585Ef5F0171E62FdCEf3B0',
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: `${process.env.KMS_KEY_ID}`,
      timeout: 100000,
      defaultWhitelist: '0xa460BcC532C48B218F3e3580d9eb7653EA2A9D21',
      USDCAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: `${process.env.KMS_KEY_ID}`,
      defaultWhitelist: '0xa460BcC532C48B218F3e3580d9eb7653EA2A9D21',
      USDCAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    },
  },
  etherscan: {
    apiKey: {
      holesky: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      chiado: process.env.BLOCKSCOUT_API_KEY || '',
      base_sepolia: process.env.BASESCAN_API_KEY ?? '',
      base: process.env.BASESCAN_API_KEY ?? '',
      polygon: process.env.POLYGONSCAN_API_KEY ?? '',
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
