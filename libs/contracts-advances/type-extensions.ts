import 'hardhat/types/config';

declare module 'hardhat/types/config' {
  interface HardhatNetworkUserConfig {
    USDCAddress?: string;
  }

  interface HttpNetworkUserConfig {
    USDCAddress?: string;
  }

  interface HardhatNetworkConfig {
    USDCAddress?: string;
  }

  interface HttpNetworkConfig {
    USDCAddress?: string;
  }
}
