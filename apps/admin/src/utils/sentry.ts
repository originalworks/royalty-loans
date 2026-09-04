/**
 * Sentry helpers for the validators monitoring page.
 *
 * 1. Discover wallets — Explore logs aggregated by user.id (`dataset=ourlogs`).
 * 2. Per-validator errors — Discover error events filtered with
 *    `query=user.id:{address}` (`dataset=errors`), same as the Sentry UI.
 * 3. Per-validator heartbeats — latest custom `heartbeat: …` Explore log.
 *
 * All use GET /organizations/{org}/events/ and need org:read.
 */

import {
  SENTRY_API_URL,
  SENTRY_AUTH_TOKEN,
  SENTRY_HOST,
  SENTRY_ORG,
  SENTRY_PROJECT,
} from '../config/config';
import {
  SENTRY_ERROR_EVENTS_QUERY,
  SENTRY_EVENTS_QUERY,
  SENTRY_HEARTBEAT_QUERY,
  buildLogsAggregateParams,
  buildValidatorErrorEventsParams,
  buildValidatorHeartbeatParams,
  type SentryIssueLevelFilter,
} from '../config/sentry';

export {
  SENTRY_ISSUE_QUERY,
  SENTRY_EVENTS_QUERY,
  SENTRY_ERROR_EVENTS_QUERY,
  SENTRY_HEARTBEAT_QUERY,
} from '../config/sentry';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SentryIssueLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export type SentryIssue = {
  id: string;
  title: string;
  level: SentryIssueLevel;
  count: string;
  lastSeen: string;
  permalink: string;
  status: string;
};

export type SentryIssueSummary = {
  errorCount: number;
  warningCount: number;
  latestError: SentryIssue | null;
  latestWarning: SentryIssue | null;
};

export type SentryLatestIssue = {
  id: string;
  title: string;
  level: SentryIssueLevel;
  timestamp: string;
  permalink: string;
};

/** One row in the "Discover from Sentry" dialog. */
export type SentryValidatorCandidate = {
  address: string;
  username: string | null;
  eventCount: number;
  latestIssue: SentryLatestIssue | null;
};

/** Latest custom heartbeat log for a validator. */
export type SentryHeartbeat = {
  message: string;
  /** Epoch ms parsed from `heartbeat: …` or the log timestamp. */
  timestampMs: number;
};

// ---------------------------------------------------------------------------
// Constants & small helpers
// ---------------------------------------------------------------------------

const VALIDATOR_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

type DiscoverRow = Record<string, unknown>;

type DiscoverResponse = {
  data?: DiscoverRow[];
};

function isSentryConfigured(): boolean {
  return Boolean(SENTRY_API_URL && SENTRY_ORG && SENTRY_PROJECT);
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function asValidatorAddress(value: unknown): string | null {
  const raw = asString(value)?.toLowerCase() ?? null;
  return raw && VALIDATOR_ADDRESS_PATTERN.test(raw) ? raw : null;
}

function isIssueLevel(value: unknown): value is SentryIssueLevel {
  return (
    value === 'fatal' ||
    value === 'error' ||
    value === 'warning' ||
    value === 'info' ||
    value === 'debug'
  );
}

function asEventCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Discover/Explore fields may arrive dotted (`user.id`) or camelCase. */
function getDiscoverField(row: DiscoverRow, field: string): unknown {
  if (field in row) return row[field];

  const camel = field.replace(/\.([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
  if (camel in row) return row[camel];

  return undefined;
}

function buildIssuePermalink(issueId: string): string {
  const host = SENTRY_HOST.replace(/\/$/, '');
  return `${host}/organizations/${SENTRY_ORG}/issues/${issueId}/`;
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

function getApiBaseUrl(): string | null {
  return SENTRY_API_URL ? SENTRY_API_URL.replace(/\/$/, '') : null;
}

function getRequestHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: 'application/json' };
  const base = getApiBaseUrl();
  // Auth is injected by the Vite proxy for relative `/sentry-api` URLs.
  if (SENTRY_AUTH_TOKEN && base && !base.startsWith('/')) {
    headers.Authorization = `Bearer ${SENTRY_AUTH_TOKEN}`;
  }
  return headers;
}

function buildRequestUrl(
  path: string,
  params?: URLSearchParams,
): string | null {
  const base = getApiBaseUrl();
  if (!base) return null;

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const query = params?.toString();
  return query ? `${base}${normalized}?${query}` : `${base}${normalized}`;
}

async function readSentryError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload.detail) return payload.detail;
  } catch {
    // non-JSON body
  }
  return response.statusText || 'Unknown error';
}

function parseNextCursor(linkHeader: string | null): string | null {
  if (!linkHeader) return null;

  const next = linkHeader
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.includes('rel="next"'));

  if (!next?.includes('results="true"')) return null;

  const match = next.match(/[?&]cursor=([^&>]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

type PageResult<T> = { items: T[]; nextCursor: string | null };

async function fetchAllPages<T>(
  fetchPage: (cursor?: string) => Promise<PageResult<T> | null>,
  maxPages: number,
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const result = await fetchPage(cursor);
    if (!result || result.items.length === 0) break;

    all.push(...result.items);
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }

  return all;
}

/** GET /organizations/{org}/events/ with Link-header pagination. */
async function fetchOrganizationEventsPage(
  params: URLSearchParams,
): Promise<PageResult<DiscoverRow> | null> {
  if (!SENTRY_ORG) return null;

  const url = buildRequestUrl(
    `/organizations/${SENTRY_ORG}/events/`,
    params,
  );
  if (!url) return null;

  const response = await fetch(url, { headers: getRequestHeaders() });

  if (!response.ok) {
    const detail = await readSentryError(response);
    if (response.status === 403) {
      throw new Error(
        `Sentry API forbidden: ${detail}. Organization events require the org:read scope.`,
      );
    }
    throw new Error(`Sentry API request failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as DiscoverResponse | DiscoverRow[];
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : [];

  return {
    items,
    nextCursor: parseNextCursor(response.headers.get('link')),
  };
}

// ---------------------------------------------------------------------------
// Per-validator error events (dataset=errors, query=user.id:…)
// ---------------------------------------------------------------------------

function eventRowToIssue(
  row: DiscoverRow,
  fallbackLevel: SentryIssueLevel,
): SentryIssue | null {
  const issueId = asString(getDiscoverField(row, 'issue.id'));
  const title = asString(getDiscoverField(row, 'title'));
  if (!issueId || !title) return null;

  const levelValue = getDiscoverField(row, 'level');
  const level = isIssueLevel(levelValue) ? levelValue : fallbackLevel;
  const timestamp = asString(getDiscoverField(row, 'timestamp')) ?? '';

  return {
    id: issueId,
    title,
    level,
    count: '1',
    lastSeen: timestamp,
    permalink: buildIssuePermalink(issueId),
    status: 'unresolved',
  };
}

/**
 * Fetch Discover error events for one validator.
 * Filtering is done by Sentry via `query=user.id:{address}` (and optional level).
 */
async function fetchValidatorErrorEvents(
  address: string,
  level?: SentryIssueLevelFilter,
): Promise<DiscoverRow[]> {
  return fetchAllPages(
    (cursor) =>
      fetchOrganizationEventsPage(
        buildValidatorErrorEventsParams(address, { level, cursor }),
      ),
    SENTRY_ERROR_EVENTS_QUERY.maxPages,
  );
}

function summarizeErrorEvents(
  rows: DiscoverRow[],
  fallbackLevel: SentryIssueLevel,
  options?: { excludeLevel?: SentryIssueLevel },
): { count: number; latest: SentryIssue | null } {
  const issueIds = new Set<string>();
  let latest: SentryIssue | null = null;

  for (const row of rows) {
    const levelValue = getDiscoverField(row, 'level');
    if (
      options?.excludeLevel &&
      levelValue === options.excludeLevel
    ) {
      continue;
    }

    const issue = eventRowToIssue(row, fallbackLevel);
    if (!issue) continue;

    issueIds.add(issue.id);
    // Rows arrive sorted by -timestamp; first valid row is the latest.
    if (!latest) latest = issue;
  }

  return { count: issueIds.size, latest };
}

export function pickLatestIssueFromSummary(
  summary: SentryIssueSummary,
): SentryLatestIssue | null {
  const candidates = [summary.latestError, summary.latestWarning].filter(
    (value): value is SentryIssue => value !== null,
  );
  if (candidates.length === 0) return null;

  const issue = [...candidates].sort(
    (a, b) =>
      new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime(),
  )[0];

  return {
    id: issue.id,
    title: issue.title,
    level: issue.level,
    timestamp: issue.lastSeen,
    permalink: issue.permalink,
  };
}

/**
 * Error/warning summary for one validator.
 * Uses Discover `dataset=errors` with `query=user.id:{address}` — filtering
 * happens on the API (same as the Sentry Discover table).
 */
export async function fetchValidatorSentrySummary(
  address: string,
): Promise<SentryIssueSummary> {
  const empty: SentryIssueSummary = {
    errorCount: 0,
    warningCount: 0,
    latestError: null,
    latestWarning: null,
  };
  if (!isSentryConfigured()) return empty;

  // Errors: exact UI filter (`user.id` only on dataset=errors).
  // Warnings: same endpoint with `level:warning` added server-side.
  const [errorRows, warningRows] = await Promise.all([
    fetchValidatorErrorEvents(address),
    fetchValidatorErrorEvents(address, 'warning'),
  ]);

  const errors = summarizeErrorEvents(errorRows, 'error', {
    excludeLevel: 'warning',
  });
  const warnings = summarizeErrorEvents(warningRows, 'warning');

  return {
    errorCount: errors.count,
    warningCount: warnings.count,
    latestError: errors.latest,
    latestWarning: warnings.latest,
  };
}

async function enrichWithLatestIssues(
  candidates: SentryValidatorCandidate[],
): Promise<SentryValidatorCandidate[]> {
  return Promise.all(
    candidates.map(async (candidate) => {
      try {
        const summary = await fetchValidatorSentrySummary(candidate.address);
        const latestIssue = pickLatestIssueFromSummary(summary);
        return latestIssue ? { ...candidate, latestIssue } : candidate;
      } catch {
        return candidate;
      }
    }),
  );
}

// ---------------------------------------------------------------------------
// Per-validator heartbeat logs (dataset=ourlogs, message contains "heartbeat")
// ---------------------------------------------------------------------------

const HEARTBEAT_MESSAGE_PATTERN = /heartbeat:\s*(.+)$/i;

function parseHeartbeatTimestamp(
  message: string,
  fallbackTimestamp: string | null,
): number | null {
  const match = message.match(HEARTBEAT_MESSAGE_PATTERN);
  const raw = match?.[1]?.trim();

  if (raw) {
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber)) {
      // Seconds vs milliseconds — treat small values as unix seconds.
      return asNumber < 1e12 ? asNumber * 1000 : asNumber;
    }

    const asDate = Date.parse(raw);
    if (Number.isFinite(asDate)) return asDate;
  }

  if (fallbackTimestamp) {
    const fallback = Date.parse(fallbackTimestamp);
    if (Number.isFinite(fallback)) return fallback;
  }

  return null;
}

/**
 * Fetch the latest custom `heartbeat: [timestamp]` Explore log for one
 * validator (`dataset=ourlogs`, `query=user.id:{address} heartbeat`).
 */
export async function fetchLatestValidatorHeartbeat(
  address: string,
): Promise<SentryHeartbeat | null> {
  if (!isSentryConfigured()) return null;

  const page = await fetchOrganizationEventsPage(
    buildValidatorHeartbeatParams(address),
  );
  const row = page?.items[0];
  if (!row) return null;

  const message = asString(getDiscoverField(row, 'message'));
  if (!message || !message.toLowerCase().includes('heartbeat')) return null;

  const logTimestamp = asString(getDiscoverField(row, 'timestamp'));
  const timestampMs = parseHeartbeatTimestamp(message, logTimestamp);
  if (timestampMs === null) return null;

  return { message, timestampMs };
}

export function isHeartbeatStale(
  timestampMs: number | null,
  nowMs: number = Date.now(),
): boolean {
  if (timestampMs === null) return true;
  return nowMs - timestampMs > SENTRY_HEARTBEAT_QUERY.staleAfterMs;
}

// ---------------------------------------------------------------------------
// Discovery — Explore logs aggregated by user.id
// ---------------------------------------------------------------------------

function parseLogsAggregateRows(
  rows: DiscoverRow[],
): SentryValidatorCandidate[] {
  const byAddress = new Map<string, SentryValidatorCandidate>();

  for (const row of rows) {
    const address = asValidatorAddress(getDiscoverField(row, 'user.id'));
    if (!address) continue;

    const username = asString(getDiscoverField(row, 'user.name'));
    const eventCount = asEventCount(getDiscoverField(row, 'count(message)'));

    const existing = byAddress.get(address);
    if (!existing) {
      byAddress.set(address, {
        address,
        username,
        eventCount,
        latestIssue: null,
      });
      continue;
    }

    byAddress.set(address, {
      address,
      username: existing.username ?? username,
      eventCount: existing.eventCount + eventCount,
      latestIssue: null,
    });
  }

  return [...byAddress.values()].sort(
    (left, right) => right.eventCount - left.eventCount,
  );
}

async function discoverFromLogsAggregates(): Promise<
  SentryValidatorCandidate[]
> {
  const rows = await fetchAllPages(
    (cursor) =>
      fetchOrganizationEventsPage(buildLogsAggregateParams(cursor)),
    SENTRY_EVENTS_QUERY.maxPages,
  );
  return parseLogsAggregateRows(rows);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchValidatorCandidatesFromSentry(): Promise<
  SentryValidatorCandidate[]
> {
  if (!isSentryConfigured()) return [];

  const candidates = await discoverFromLogsAggregates();
  return enrichWithLatestIssues(candidates);
}

export function getSentryConfigured(): boolean {
  return isSentryConfigured();
}
