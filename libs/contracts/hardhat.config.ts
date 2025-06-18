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
  networks: {
    holesky: {
      url: `${process.env.RPC_URL}`,
      kmsKeyId: `${process.env.KMS_KEY_ID_DEV}`,
    },
    sepolia: {
      url: `${process.env.RPC_URL}`,
      kmsKeyId: `${process.env.KMS_KEY_ID_DEV}`,
    },
    chiado: {
      url: `${process.env.RPC_URL}`,
      kmsKeyId: `${process.env.KMS_KEY_ID_DEV}`,
    },
  },
  etherscan: {
    apiKey: {
      holesky: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      chiado: process.env.BLOCKSCOUT_API_KEY || '',
    },
  },
  typechain: {
    outDir: 'typechain',
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
