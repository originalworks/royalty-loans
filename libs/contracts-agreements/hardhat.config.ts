import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import '@typechain/hardhat';
import '@rumblefishdev/hardhat-kms-signer';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-verify';
import '@openzeppelin/hardhat-upgrades';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.13',
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  paths: {
    sources: './libs',
    artifacts: './artifacts',
    cache: './cache',
  },
  networks: {
    base_sepolia: {
      url: 'https://base-sepolia.g.alchemy.com/v2/h8dcbdmx9nfNtrKNQdbIQmgG1OfrK90Y',
      kmsKeyId: process.env.KMS_KEY_ID || '',
      minMaxFeePerGas: 1500000000,
      minMaxPriorityFeePerGas: 1500000000,
    },
    base: {
      url: 'https://base-mainnet.g.alchemy.com/v2/h8dcbdmx9nfNtrKNQdbIQmgG1OfrK90Y',
      kmsKeyId: process.env.KMS_KEY_ID || '',
      minMaxPriorityFeePerGas: 50000000,
    },
    amoy_dev: {
      url: 'https://polygon-amoy.g.alchemy.com/v2/RzvVKLcPA-7mRzo2_hXKsER_MMHfZ9Ss',
      kmsKeyId: process.env.KMS_KEY_ID || '',
      // temporary solution
      minMaxFeePerGas: 1500000000,
      minMaxPriorityFeePerGas: 1500000000,
    },
    amoy_stage: {
      url: 'https://polygon-amoy.g.alchemy.com/v2/RzvVKLcPA-7mRzo2_hXKsER_MMHfZ9Ss',
      kmsKeyId: process.env.KMS_KEY_ID || '',
      // temporary solution
      minMaxFeePerGas: 1500000000,
      minMaxPriorityFeePerGas: 1500000000,
    },
    sepolia_dev: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/pr5ItnqwIG3WuxpN4foFXfz2Na8FQvaZ',
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    sepolia_stage: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/pr5ItnqwIG3WuxpN4foFXfz2Na8FQvaZ',
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    shibuya_dev: {
      url: `https://shibuya.blastapi.io/79078d45-4066-43e2-8ab2-cdd3cbb3cd38`,
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    goerli_stage: {
      url: `https://eth-goerli.g.alchemy.com/v2/NYXnx2JV8F7zmCukdVwk2AhBzp8lAG7D`,
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    goerli_dev: {
      url: `https://eth-goerli.g.alchemy.com/v2/NYXnx2JV8F7zmCukdVwk2AhBzp8lAG7D`,
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    bscTestnet_stage: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    bscTestnet_dev: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    mumbai_stage: {
      url: 'https://polygon-mumbai.g.alchemy.com/v2/fX2jTRUl9YvfMw80vkFTU4d_jEXpmuXv',
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    mumbai_dev: {
      url: 'https://polygon-mumbai.g.alchemy.com/v2/fX2jTRUl9YvfMw80vkFTU4d_jEXpmuXv',
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    polygon: {
      url: 'https://polygon-mainnet.g.alchemy.com/v2/fzBxXrEt5JMUXHKXPC1rOQRVB7UctwL_',
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    bsc: {
      url: 'https://bsc-dataseed1.binance.org/',
      kmsKeyId: process.env.KMS_KEY_ID || '',
    },
    ethereum: {
      url: 'https://eth-mainnet.g.alchemy.com/v2/FuJqF1LmW8Qyv4IFbH1IJV30bAivl-Qd',
      kmsKeyId: process.env.KMS_KEY_ID || '',
      gasPrice: 15000000000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
      {
        network: 'polygonAmoy',
        chainId: 80002,
        urls: {
          apiURL:
            'https://www.oklink.com/api/explorer/v1/contract/verify/async/api/polygonAmoy',
          browserURL: 'https://www.oklink.com/polygonAmoy',
        },
      },
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
};

export default config;
