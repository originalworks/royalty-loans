import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export const useCanPerformBatchTransactions = () => {
  const { connector } = useAccount();
  const [canPerform, setCanPerform] = useState<boolean>(false);

  useEffect(() => {
    if (connector) {
      if (
        connector.id === 'coinbaseWalletSDK' ||
        connector.id === 'io.metamask'
      ) {
        setCanPerform(true);
      } else {
        connector.getProvider().then((provider) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (provider?.session?.peer.metadata.name.includes('MetaMask')) {
            setCanPerform(true);
          } else {
            setCanPerform(false);
          }
        });
      }
    } else {
      setCanPerform(false);
    }
  }, [connector]);

  return canPerform;
};
