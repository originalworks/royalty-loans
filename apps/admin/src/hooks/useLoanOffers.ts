import {
  sendCalls,
  readContract,
  writeContract,
  waitForCallsStatus,
  waitForTransactionReceipt,
} from 'wagmi/actions';
import { useState } from 'react';
import { MaxUint256 } from 'ethers';
import { useNavigate } from 'react-router';
import { useConfig, useAccount } from 'wagmi';

import { erc20Abi, royaltyLoanAbi } from '../generated/smart-contracts';
import { useCanPerformBatchTransactions } from './useCanPerformBatchTransactions';

export const useLoanOffers = () => {
  const [isLoading, setIsLoading] = useState<string>();
  const navigate = useNavigate();
  const config = useConfig();
  const { address, chainId } = useAccount();
  const canPerform = useCanPerformBatchTransactions();

  return {
    isLoading,
    processRepaymentFn: async (loanContract: `0x${string}`) => {
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

        const amount = await readContract(config, {
          abi: erc20Abi,
          address: paymentToken,
          functionName: 'balanceOf',
          args: [loanContract],
        });

        if (amount > 0) {
          const hash = await writeContract(config, {
            chainId,
            abi: royaltyLoanAbi,
            address: loanContract,
            functionName: 'processRepayment',
            args: [],
          });

          const { status } = await waitForTransactionReceipt(config, {
            hash,
          });

          if (status === 'success') {
            setTimeout(() => navigate(0), 3000);
          }
          if (status === 'reverted') console.error('Transaction reverted');
        }
      } catch (error) {
        console.error(error);
      }
    },
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

        if (canPerform) {
          const id = await sendCalls(config, {
            calls: [
              {
                abi: erc20Abi,
                to: paymentToken,
                functionName: 'approve',
                args: [loanContract, MaxUint256],
              },
              {
                abi: royaltyLoanAbi,
                to: loanContract,
                functionName: 'provideLoan',
                args: [],
              },
            ],
            forceAtomic: true, // if user rejects to use smart wallet and value is true then everything is reverted
          });

          const { status } = await waitForCallsStatus(config, id);

          if (status === 'success') {
            setTimeout(() => navigate(0), 3000);
          }
          if (status === 'failure') console.error('Transaction reverted');
        } else {
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
            setTimeout(() => navigate(0), 3000);
          }
          if (status === 'reverted') console.error('Transaction reverted');
        }
      } catch (error) {
        console.error(error);
      }
    },
  };
};
