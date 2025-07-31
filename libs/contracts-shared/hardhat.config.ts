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
  typechain: {
    outDir: 'typechain',
  },
};

export default config;
