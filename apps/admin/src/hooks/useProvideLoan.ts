import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useConfig, useAccount } from 'wagmi';
import { waitForTransactionReceipt, writeContract } from 'wagmi/actions';

import { royaltyLoanAbi } from '../generated/smart-contracts';

export const useProvideLoan = () => {
  const [isLoading, setIsLoading] = useState<string>();
  const navigate = useNavigate();
  const config = useConfig();
  const { address, chainId } = useAccount();

  return {
    isLoading,
    provideLoanFn: async (loanContract: `0x${string}`) => {
      if (!address) return;

      try {
        setIsLoading(loanContract);

        const hash = await writeContract(config, {
          chainId,
          abi: royaltyLoanAbi,
          address: loanContract,
          functionName: 'provideLoan',
          args: [],
        });

        const { status } = await waitForTransactionReceipt(config, {
          hash: hash,
        });

        if (status === 'success') {
          navigate(0);
        }
        if (status === 'reverted') console.error('Transaction reverted');
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(undefined);
      }
    },
  };
};
