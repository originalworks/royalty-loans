import {
  GNOSIS_EXPLORER_API_KEY,
  GNOSIS_EXPLORER_API_URL,
  GNOSIS_EXPLORER_URL,
} from '../config/config';

export type BlockscoutTransaction = {
  hash?: string;
  timestamp?: string;
};

type BlockscoutListResponse<T> = {
  items?: T[];
};

export type LastOutgoingTx = {
  hash: string;
  timestamp: number;
} | null;

const DEFAULT_EXPLORER_WEB_URL = 'https://gnosis.blockscout.com';

function getApiBaseUrl(): string | null {
  if (!GNOSIS_EXPLORER_API_URL) {
    return null;
  }

  return GNOSIS_EXPLORER_API_URL.replace(/\/$/, '');
}

function buildRequestUrl(path: string, params?: URLSearchParams): string | null {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const searchParams = new URLSearchParams(params);

  if (GNOSIS_EXPLORER_API_KEY) {
    searchParams.set('apikey', GNOSIS_EXPLORER_API_KEY);
  }

  const query = searchParams.toString();
  return query
    ? `${baseUrl}${normalizedPath}?${query}`
    : `${baseUrl}${normalizedPath}`;
}

async function blockscoutGet<T>(
  path: string,
  params?: URLSearchParams,
): Promise<T | null> {
  const url = buildRequestUrl(path, params);
  if (!url) {
    return null;
  }

  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  // Prefer Bearer auth for the Pro API; query apikey remains as a fallback
  // for environments that inject it via the Vite proxy.
  if (GNOSIS_EXPLORER_API_KEY && !url.startsWith('/')) {
    headers.Authorization = `Bearer ${GNOSIS_EXPLORER_API_KEY}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json() as Promise<T>;
}

export function getExplorerTxLink(txHash: string): string | null {
  if (GNOSIS_EXPLORER_URL) {
    return `${GNOSIS_EXPLORER_URL.replace(/\/$/, '')}/tx/${txHash}`;
  }

  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return null;
  }

  if (apiBase === '/blockscout-api') {
    return `${DEFAULT_EXPLORER_WEB_URL}/tx/${txHash}`;
  }

  const webBase = apiBase
    .replace(/\/\d+\/api\/v2$/, '')
    .replace(/\/api\/v2$/, '');

  return `${webBase}/tx/${txHash}`;
}

export async function fetchLastOutgoingTx(
  address: string,
): Promise<LastOutgoingTx> {
  const params = new URLSearchParams({
    filter: 'from',
  });

  const data = await blockscoutGet<
    BlockscoutListResponse<BlockscoutTransaction>
  >(`/addresses/${address}/transactions`, params);

  // Newest pending txs often omit timestamp/block fields; prefer the latest
  // confirmed outgoing transaction.
  const tx = data?.items?.find(
    (item) =>
      typeof item.hash === 'string' &&
      item.hash.length > 0 &&
      typeof item.timestamp === 'string' &&
      item.timestamp.length > 0,
  );

  if (!tx?.hash || !tx.timestamp) {
    return null;
  }

  const timestamp = new Date(tx.timestamp).getTime();
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return {
    hash: tx.hash,
    timestamp,
  };
}
