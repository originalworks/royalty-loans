import { useState, useCallback, useEffect, useRef } from 'react';
import { createPublicClient, formatEther, http, isAddress } from 'viem';
import { gnosis } from 'viem/chains';

import { GNOSIS_RPC_URL } from '../config/config';
import { SENTRY_HEARTBEAT_QUERY } from '../config/sentry';
import { fetchLastOutgoingTx } from '../utils/blockscout';
import {
  fetchLatestValidatorHeartbeat,
  fetchValidatorSentrySummary,
  isHeartbeatStale,
  pickLatestIssueFromSummary,
} from '../utils/sentry';

const STORAGE_KEY = 'validators-addresses';

type StoredValidator = {
  address: string;
  username: string | null;
};

export type ValidatorLookupResult = {
  balance: string;
  lastTxHash: string | null;
  lastTxTimestamp: number | null;
};

export type HeartbeatStatus = 'loading' | 'ok' | 'stale' | 'missing' | 'error';

export type ValidatorRow = {
  id: string;
  address: string;
  username: string | null;
  balance: string | null;
  lastTxHash: string | null;
  lastTxTimestamp: number | null;
  sentryErrorCount: number | null;
  sentryWarningCount: number | null;
  sentryErrorLink: string | null;
  sentryWarningLink: string | null;
  latestIssueTitle: string | null;
  latestIssueLevel: string | null;
  latestIssueLastSeen: string | null;
  latestIssueLink: string | null;
  lastHeartbeatAt: number | null;
  heartbeatStatus: HeartbeatStatus;
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

function loadValidators(): StoredValidator[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (typeof item === 'string') {
          return { address: item.toLowerCase(), username: null };
        }
        if (
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { address?: string }).address === 'string'
        ) {
          const record = item as StoredValidator;
          return {
            address: record.address.toLowerCase(),
            username:
              typeof record.username === 'string' ? record.username : null,
          };
        }
        return null;
      })
      .filter((entry): entry is StoredValidator => !!entry);
  } catch {
    return [];
  }
}

function saveValidators(validators: StoredValidator[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validators));
}

function emptyRow(validator: StoredValidator): ValidatorRow {
  return {
    id: validator.address,
    address: validator.address,
    username: validator.username ?? null,
    balance: null,
    lastTxHash: null,
    lastTxTimestamp: null,
    sentryErrorCount: null,
    sentryWarningCount: null,
    sentryErrorLink: null,
    sentryWarningLink: null,
    latestIssueTitle: null,
    latestIssueLevel: null,
    latestIssueLastSeen: null,
    latestIssueLink: null,
    lastHeartbeatAt: null,
    heartbeatStatus: 'loading',
    status: 'loading',
  };
}

export const useValidators = () => {
  const [validators, setValidators] = useState<StoredValidator[]>(loadValidators);
  const [rows, setRows] = useState<ValidatorRow[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const validatorsRef = useRef(validators);
  validatorsRef.current = validators;

  const refreshAddress = useCallback(async (validator: StoredValidator) => {
    const { address } = validator;

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

      const latestIssue = pickLatestIssueFromSummary(sentrySummary);

      setRows((prev) =>
        prev.map((row) =>
          row.address === address
            ? {
                ...row,
                username: validator.username ?? row.username,
                balance: data.balance,
                lastTxHash: data.lastTxHash,
                lastTxTimestamp: data.lastTxTimestamp,
                sentryErrorCount: sentrySummary.errorCount,
                sentryWarningCount: sentrySummary.warningCount,
                sentryErrorLink: sentrySummary.latestError?.permalink ?? null,
                sentryWarningLink: sentrySummary.latestWarning?.permalink ?? null,
                latestIssueTitle: latestIssue?.title ?? null,
                latestIssueLevel: latestIssue?.level ?? null,
                latestIssueLastSeen: latestIssue?.timestamp ?? null,
                latestIssueLink: latestIssue?.permalink ?? null,
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

  const refreshHeartbeat = useCallback(async (address: string) => {
    try {
      const heartbeat = await fetchLatestValidatorHeartbeat(address);
      const lastHeartbeatAt = heartbeat?.timestampMs ?? null;
      const heartbeatStatus: HeartbeatStatus = lastHeartbeatAt
        ? isHeartbeatStale(lastHeartbeatAt)
          ? 'stale'
          : 'ok'
        : 'missing';

      setRows((prev) =>
        prev.map((row) =>
          row.address === address
            ? { ...row, lastHeartbeatAt, heartbeatStatus }
            : row,
        ),
      );
    } catch {
      setRows((prev) =>
        prev.map((row) =>
          row.address === address
            ? { ...row, heartbeatStatus: 'error' as const }
            : row,
        ),
      );
    }
  }, []);

  const refreshAllHeartbeats = useCallback(
    async (validatorList: StoredValidator[]) => {
      await Promise.all(
        validatorList.map((validator) => refreshHeartbeat(validator.address)),
      );
    },
    [refreshHeartbeat],
  );

  const refreshAll = useCallback(
    async (validatorList: StoredValidator[]) => {
      if (validatorList.length === 0) {
        setRows([]);
        return;
      }

      setIsRefreshing(true);
      setRows(validatorList.map(emptyRow));

      await Promise.all([
        ...validatorList.map((validator) => refreshAddress(validator)),
        refreshAllHeartbeats(validatorList),
      ]);
      setIsRefreshing(false);
    },
    [refreshAddress, refreshAllHeartbeats],
  );

  useEffect(() => {
    void refreshAll(validators);
  }, [validators, refreshAll]);

  // Poll the latest `heartbeat: …` log every 60s for each monitored validator.
  useEffect(() => {
    if (validators.length === 0) return;

    const intervalId = window.setInterval(() => {
      void refreshAllHeartbeats(validatorsRef.current);
    }, SENTRY_HEARTBEAT_QUERY.pollIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [validators.length, refreshAllHeartbeats]);

  const addValidator = useCallback(
    (address: string, username?: string | null) => {
      const normalized = address.trim().toLowerCase();

      if (!isAddress(normalized)) {
        return 'Invalid address';
      }
      if (validators.some((entry) => entry.address === normalized)) {
        return 'Validator already added';
      }

      const updated = [
        ...validators,
        {
          address: normalized,
          username: username ?? null,
        },
      ];
      setValidators(updated);
      saveValidators(updated);
      return null;
    },
    [validators],
  );

  const removeValidator = useCallback(
    (address: string) => {
      const updated = validators.filter((entry) => entry.address !== address);
      setValidators(updated);
      saveValidators(updated);
    },
    [validators],
  );

  return {
    rows,
    isRefreshing,
    addValidator,
    removeValidator,
    refreshAll: () => refreshAll(validators),
    monitoredAddresses: validators.map((entry) => entry.address),
  };
};
