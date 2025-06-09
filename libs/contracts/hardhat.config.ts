import * as dotenv from 'dotenv'

import '@typechain/hardhat'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@rumblefishdev/hardhat-kms-signer'
import '@nomicfoundation/hardhat-chai-matchers'

import { HardhatUserConfig, extendConfig } from 'hardhat/config'
import { HardhatConfig } from 'hardhat/types'

dotenv.config()

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    if (!userConfig.networks) return

    for (const networkName of Object.keys(userConfig.networks)) {
      const env = userConfig.networks[networkName]?.env ?? 'local'
      config.networks[networkName].env = env
    }
  },
)

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    masterKMS: 0,
  },
  // `verify` config used by hardhat-deploy `etherscan-verify` task
  networks: {
    // bun run start-fork:sepolia
    sepoliaFork: {
      url: `http://127.0.0.1:8545/`,
      kmsKeyId: process.env.KMS_KEY_ID_STAGE || '',
      operationalWhitelist: "0x20B8DA785aA8d97Cf07f9d20930b506c0c4Cb23B",
      usdcAddress: "0x46Bc2338a282383fe2585Ef5F0171E62FdCEf3B0",
    },
    // bun run start-fork:amoy
    amoyFork: {
      url: `http://127.0.0.2:8545/`,
      kmsKeyId: process.env.KMS_KEY_ID_STAGE || '',
      operationalWhitelist: "",
      usdcAddress: "0xd76eA12DDa2A29329808d183a11CAA5fcfE09E72"
    },
    sepoliaDev: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.KMS_KEY_ID_DEV || '',
      operationalWhitelist: "0x20B8DA785aA8d97Cf07f9d20930b506c0c4Cb23B",
      usdcAddress: "0xf6c42371dB8F98014D1c0CD0C6DF4BEf67d60e14",
      env: 'dev',
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY ?? '',
          apiUrl: 'https://api-sepolia.etherscan.io',
        },
      },
    },
    sepoliaStage: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.KMS_KEY_ID_STAGE || '',
      operationalWhitelist: "0xe294D0e64cF8d20c47D5A695e694438C3E509DCb",
      usdcAddress: "0x29Df69E505be67Eb49CA156381012Ee6049f15bd",
      env: 'stage',
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY ?? '',
          apiUrl: 'https://api-sepolia.etherscan.io',
        },
      },
    },
    sepoliaProd: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.KMS_KEY_ID_PROD || '',
      operationalWhitelist: "0x0CaA7018A6F4f9F505AC529314e0B89fcbFE1d3E",
      usdcAddress: "",
      env: 'prod',
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY ?? '',
          apiUrl: 'https://api-sepolia.etherscan.io',
        },
      },
    },
    amoyStage: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.KMS_KEY_ID_STAGE || '',
      operationalWhitelist: "0xe294D0e64cF8d20c47D5A695e694438C3E509DCb",
      usdcAddress: "0xb517627249fca087068d1B1dC49D37Cc93f1A7cC",
      env: 'stage',
      // fixes empty blocks fee calculation
      minMaxFeePerGas: 50000000001,
      minMaxPriorityFeePerGas: 50000000001,
    },
    amoyProd: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.KMS_KEY_ID_PROD || '',
      operationalWhitelist: "0x0CaA7018A6F4f9F505AC529314e0B89fcbFE1d3E",
      usdcAddress: "",
      env: 'prod',
      // fixes empty blocks fee calculation
      minMaxFeePerGas: 60000000000,
      minMaxPriorityFeePerGas: 60000000000,
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.KMS_KEY_ID_PROD || '',
      operationalWhitelist: "0x0CaA7018A6F4f9F505AC529314e0B89fcbFE1d3E",
      usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      env: 'prod',
      verify: {
        etherscan: {
          apiKey: process.env.POLYGONSCAN_API_KEY ?? '',
          apiUrl: 'https://api.polygonscan.com',
        },
      },
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.KMS_KEY_ID_PROD || '',
      operationalWhitelist: "",
      usdcAddress: "",
      env: 'prod',
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY ?? '',
          apiUrl: 'https://api.etherscan.io',
        },
      },
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      kmsKeyId: process.env.KMS_KEY_ID_PROD || '',
      operationalWhitelist: "0x0CaA7018A6F4f9F505AC529314e0B89fcbFE1d3E",
      usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      env: 'prod',
      verify: {
        etherscan: {
          apiKey: process.env.BASESCAN_API_KEY ?? '',
          apiUrl: 'https://api.basescan.org',
        },
      },
      minMaxPriorityFeePerGas: 50000000,
    },
  },
  paths: {
    cache: 'cache',
    deploy: 'deploy',
    sources: 'contracts',
    artifacts: 'artifacts',
    deployments: 'deployments',
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
   
  // used by @nomiclabs/hardhat-ethers on `hardhat verify`
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY ?? '',
      mainnet: process.env.ETHERSCAN_API_KEY ?? '',
      polygon: process.env.POLYGONSCAN_API_KEY ?? '',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY ?? '',
    },
  },
}

export default config
