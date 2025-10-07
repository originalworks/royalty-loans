import 'hardhat/types/config';

declare module 'hardhat/types/config' {
  interface HardhatNetworkUserConfig {
    defaultWhitelist?: string;
    USDCAddress?: string;
  }

  interface HttpNetworkUserConfig {
    defaultWhitelist?: string;
    USDCAddress?: string;
  }

  interface HardhatNetworkConfig {
    defaultWhitelist?: string;
    USDCAddress?: string;
  }

  interface HttpNetworkConfig {
    defaultWhitelist?: string;
    USDCAddress?: string;
  }
}
