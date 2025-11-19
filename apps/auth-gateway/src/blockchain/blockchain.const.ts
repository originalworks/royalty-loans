export const CHAINS = {
  Base: '8453',
  BaseSepolia: '84532',
  Polygon: '137',
} as const;

export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

export type ChainId = (typeof CHAINS)[keyof typeof CHAINS];

export const isChainSupported = (chainId: string) =>
  Object.values(CHAINS).includes(chainId as ChainId);

export const AlchemyRpcUrls: Record<ChainId, string> = {
  [CHAINS.Base]: 'https://base-mainnet.g.alchemy.com/v2/',
  [CHAINS.BaseSepolia]: 'https://base-sepolia.g.alchemy.com/v2/',
  [CHAINS.Polygon]: 'https://polygon-mainnet.g.alchemy.com/v2/',
};
