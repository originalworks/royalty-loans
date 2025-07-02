import { useAccount } from 'wagmi';
import { base } from 'wagmi/chains';

export const useGetDataProviderName = () => {
  const { chainId } = useAccount();

  return chainId === base.id ? 'graphQlBase' : 'graphQlBaseSepolia';
};
