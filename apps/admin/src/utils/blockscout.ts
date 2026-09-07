import axios from 'axios';

import {
  GNOSIS_EXPLORER_API_URL,
  GNOSIS_EXPLORER_URL,
} from '../config/config';

export type LastOutgoingTx = {
  hash: string;
  timestamp: number;
} | null;

const DEFAULT_EXPLORER_WEB_URL = 'https://gnosis.blockscout.com';

type EthTxListResponse = {
  status?: string;
  message?: string;
  result?:
    | Array<{
        hash?: string;
        timeStamp?: string;
      }>
    | string;
};

function getApiBaseUrl(): string | null {
  if (!GNOSIS_EXPLORER_API_URL) {
    return null;
  }

  return GNOSIS_EXPLORER_API_URL.replace(/\/$/, '');
}

function usesBackendProxy(): boolean {
  const base = getApiBaseUrl();
  return Boolean(base && !base.startsWith('/'));
}

function getRequestHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: 'application/json' };
  // Absolute URL: backend proxy — send the Auth0 token.
  if (usesBackendProxy()) {
    const auth = axios.defaults.headers.common.Authorization;
    if (typeof auth === 'string' && auth.length > 0) {
      headers.Authorization = auth;
    }
  }
  return headers;
}

function buildBackendRequestUrl(path: string): string | null {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function getExplorerTxLink(txHash: string): string | null {
  if (GNOSIS_EXPLORER_URL) {
    return `${GNOSIS_EXPLORER_URL.replace(/\/$/, '')}/tx/${txHash}`;
  }

  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return null;
  }

  if (apiBase === '/blockscout-api' || apiBase.endsWith('/blockscout-api')) {
    return `${DEFAULT_EXPLORER_WEB_URL}/tx/${txHash}`;
  }

  return `${DEFAULT_EXPLORER_WEB_URL}/tx/${txHash}`;
}

export async function fetchLastOutgoingTx(
  address: string,
): Promise<LastOutgoingTx> {
  if (usesBackendProxy()) {
    const url = buildBackendRequestUrl(
      `/addresses/${address}/last-outgoing-tx`,
    );
    if (!url) return null;

    const response = await fetch(url, { headers: getRequestHeaders() });
    if (!response.ok) return null;

    const data = (await response.json()) as LastOutgoingTx;
    if (!data?.hash || !Number.isFinite(data.timestamp)) {
      return null;
    }
    return data;
  }

  const explorer = (GNOSIS_EXPLORER_URL || DEFAULT_EXPLORER_WEB_URL).replace(
    /\/$/,
    '',
  );
  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address,
    page: '1',
    offset: '1',
    sort: 'desc',
    filter_by: 'from',
  });
  const url = `${explorer}/api?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as EthTxListResponse;
  if (payload.status !== '1' || !Array.isArray(payload.result)) {
    return null;
  }

  const tx = payload.result[0];
  if (!tx?.hash || !tx.timeStamp) {
    return null;
  }

  const timestamp = Number.parseInt(tx.timeStamp, 10) * 1000;
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return { hash: tx.hash, timestamp };
}
