import { useState, useCallback, useEffect } from 'react';
import { createPublicClient, formatEther, http, isAddress } from 'viem';
import { gnosis } from 'viem/chains';

import { GNOSIS_RPC_URL } from '../config/config';
import { fetchLastOutgoingTx } from '../utils/blockscout';
import { fetchValidatorSentrySummary } from '../utils/sentry';

const STORAGE_KEY = 'validators-addresses';

export type ValidatorLookupResult = {
  balance: string;
  lastTxHash: string | null;
  lastTxTimestamp: number | null;
};

export type ValidatorRow = {
  id: string;
  address: string;
  balance: string | null;
  lastTxHash: string | null;
  lastTxTimestamp: number | null;
  sentryErrorCount: number | null;
  sentryWarningCount: number | null;
  sentryErrorLink: string | null;
  sentryWarningLink: string | null;
  status: 'loading' | 'error' | 'ready';
  error?: string;
};

const publicClient = GNOSIS_RPC_URL
  ? createPublicClient({
      chain: gnosis,
      transport: http(GNOSIS_RPC_URL),
    })
  : null;

export async function fetchValidatorData(
  address: string,
): Promise<ValidatorLookupResult> {
  if (!publicClient) {
    throw new Error('Gnosis RPC URL is not configured');
  }

  const balanceWei = await publicClient.getBalance({
    address: address as `0x${string}`,
  });
  const balance = formatEther(balanceWei);

  let lastTxHash: string | null = null;
  let lastTxTimestamp: number | null = null;

  try {
    const lastTx = await fetchLastOutgoingTx(address);
    if (lastTx) {
      lastTxHash = lastTx.hash;
      lastTxTimestamp = lastTx.timestamp;
    }
  } catch {
    // Explorer lookup failed; balance is still valid
  }

  return { balance, lastTxHash, lastTxTimestamp };
}

function loadAddresses(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (typeof item === 'string') return item.toLowerCase();
        if (
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { address?: string }).address === 'string'
        ) {
          return (item as { address: string }).address.toLowerCase();
        }
        return null;
      })
      .filter((address): address is string => !!address);
  } catch {
    return [];
  }
}

function saveAddresses(addresses: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
}

export const useValidators = () => {
  const [addresses, setAddresses] = useState<string[]>(loadAddresses);
  const [rows, setRows] = useState<ValidatorRow[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAddress = useCallback(async (address: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.address === address
          ? { ...row, status: 'loading' as const, error: undefined }
          : row,
      ),
    );

    try {
      const [data, sentrySummary] = await Promise.all([
        fetchValidatorData(address),
        fetchValidatorSentrySummary(address).catch(() => ({
          errorCount: 0,
          warningCount: 0,
          latestError: null,
          latestWarning: null,
        })),
      ]);

      setRows((prev) =>
        prev.map((row) =>
          row.address === address
            ? {
                ...row,
                balance: data.balance,
                lastTxHash: data.lastTxHash,
                lastTxTimestamp: data.lastTxTimestamp,
                sentryErrorCount: sentrySummary.errorCount,
                sentryWarningCount: sentrySummary.warningCount,
                sentryErrorLink: sentrySummary.latestError?.permalink ?? null,
                sentryWarningLink: sentrySummary.latestWarning?.permalink ?? null,
                status: 'ready' as const,
              }
            : row,
        ),
      );
    } catch (err) {
      setRows((prev) =>
        prev.map((row) =>
          row.address === address
            ? {
                ...row,
                status: 'error' as const,
                error: err instanceof Error ? err.message : 'Lookup failed',
              }
            : row,
        ),
      );
    }
  }, []);

  const refreshAll = useCallback(
    async (addressList: string[]) => {
      if (addressList.length === 0) {
        setRows([]);
        return;
      }

      setIsRefreshing(true);
      setRows(
        addressList.map((address) => ({
          id: address,
          address,
          balance: null,
          lastTxHash: null,
          lastTxTimestamp: null,
          sentryErrorCount: null,
          sentryWarningCount: null,
          sentryErrorLink: null,
          sentryWarningLink: null,
          status: 'loading' as const,
        })),
      );

      await Promise.all(addressList.map((address) => refreshAddress(address)));
      setIsRefreshing(false);
    },
    [refreshAddress],
  );

  useEffect(() => {
    void refreshAll(addresses);
  }, [addresses, refreshAll]);

  const addValidator = useCallback(
    (address: string) => {
      const normalized = address.trim().toLowerCase();

      if (!isAddress(normalized)) {
        return 'Invalid address';
      }
      if (addresses.includes(normalized)) {
        return 'Validator already added';
      }

      const updated = [...addresses, normalized];
      setAddresses(updated);
      saveAddresses(updated);
      return null;
    },
    [addresses],
  );

  const removeValidator = useCallback(
    (address: string) => {
      const updated = addresses.filter((entry) => entry !== address);
      setAddresses(updated);
      saveAddresses(updated);
    },
    [addresses],
  );

  return {
    rows,
    isRefreshing,
    addValidator,
    removeValidator,
    refreshAll: () => refreshAll(addresses),
  };
};
