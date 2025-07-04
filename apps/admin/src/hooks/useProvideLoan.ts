import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from 'wagmi/actions';
import { useState } from 'react';
import { MaxUint256 } from 'ethers';
import { useNavigate } from 'react-router';
import { useConfig, useAccount } from 'wagmi';

import { erc20Abi, royaltyLoanAbi } from '../generated/smart-contracts';

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

        const paymentToken = await readContract(config, {
          chainId,
          abi: royaltyLoanAbi,
          address: loanContract,
          functionName: 'paymentToken',
          args: [],
        });

        if (!paymentToken) return;

        const approveHash = await writeContract(config, {
          chainId,
          abi: erc20Abi,
          address: paymentToken,
          functionName: 'approve',
          args: [loanContract, MaxUint256],
        });

        const { status: approveStatus } = await waitForTransactionReceipt(
          config,
          {
            hash: approveHash,
          },
        );

        if (approveStatus !== 'success') return;

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
