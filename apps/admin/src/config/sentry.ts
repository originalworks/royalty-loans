import { SENTRY_PROJECT } from './config';

export type SentryIssueLevelFilter = 'error' | 'warning';

/** Shared time window for Discover / Explore queries. */
export const SENTRY_STATS_PERIOD = '14d';

/**
 * Discover validators the same way the Sentry Explore UI does:
 * aggregate logs by user.id over the stats window.
 *
 * GET /organizations/{org}/events/
 *   ?dataset=ourlogs&field=user.id&field=count(message)&sort=-count(message)
 */
export const SENTRY_EVENTS_QUERY = {
  statsPeriod: SENTRY_STATS_PERIOD,
  dataset: 'ourlogs',
  perPage: 50,
  maxPages: 10,
  fields: ['user.id', 'user.name', 'count(message)'] as const,
  sort: '-count(message)',
} as const;

/**
 * Per-validator error events — same Discover table query as the Sentry UI.
 *
 * GET /organizations/{org}/events/
 *   ?dataset=errors
 *   &field=title&field=issue.id&field=timestamp&...
 *   &query=user.id:{address}
 *   &sort=-timestamp
 */
export const SENTRY_ERROR_EVENTS_QUERY = {
  statsPeriod: SENTRY_STATS_PERIOD,
  dataset: 'errors',
  perPage: 50,
  maxPages: 10,
  fields: [
    'title',
    'project',
    'user.display',
    'timestamp',
    'trace',
    'issue.id',
    'level',
  ] as const,
  sort: '-timestamp',
} as const;

/**
 * Latest custom heartbeat log per validator (Explore / ourlogs).
 *
 * Message shape: `heartbeat: [timestamp]`
 * Polled every 60s; stale if older than 60s.
 */
export const SENTRY_HEARTBEAT_QUERY = {
  statsPeriod: '1h',
  dataset: 'ourlogs',
  perPage: 1,
  fields: ['timestamp', 'message', 'user.id'] as const,
  sort: '-timestamp',
  messageQuery: 'heartbeat',
  pollIntervalMs: 60_000,
  staleAfterMs: 120_000,
} as const;

/** @deprecated Prefer SENTRY_STATS_PERIOD / SENTRY_ERROR_EVENTS_QUERY. Kept for UI labels. */
export const SENTRY_ISSUE_QUERY = {
  statsPeriod: SENTRY_STATS_PERIOD,
  levels: ['error', 'warning'] as const satisfies readonly SentryIssueLevelFilter[],
} as const;

/** Params for Explore logs table aggregates (group by user.id). */
export function buildLogsAggregateParams(cursor?: string): URLSearchParams {
  const params = new URLSearchParams({
    dataset: SENTRY_EVENTS_QUERY.dataset,
    statsPeriod: SENTRY_EVENTS_QUERY.statsPeriod,
    per_page: String(SENTRY_EVENTS_QUERY.perPage),
    sort: SENTRY_EVENTS_QUERY.sort,
    sampling: 'NORMAL',
    query: '',
  });

  params.append('caseInsensitive', '');

  for (const field of SENTRY_EVENTS_QUERY.fields) {
    params.append('field', field);
  }

  if (SENTRY_PROJECT) {
    params.append('project', SENTRY_PROJECT);
  }

  if (cursor) {
    params.set('cursor', cursor);
  }

  return params;
}

/**
 * Params for Discover error events filtered to one validator.
 * `level` is appended when fetching warnings separately.
 */
export function buildValidatorErrorEventsParams(
  address: string,
  options?: { level?: SentryIssueLevelFilter; cursor?: string },
): URLSearchParams {
  const levelClause = options?.level ? ` level:${options.level}` : '';

  const params = new URLSearchParams({
    dataset: SENTRY_ERROR_EVENTS_QUERY.dataset,
    statsPeriod: SENTRY_ERROR_EVENTS_QUERY.statsPeriod,
    per_page: String(SENTRY_ERROR_EVENTS_QUERY.perPage),
    sort: SENTRY_ERROR_EVENTS_QUERY.sort,
    // Filter on the API — do not pull unrelated project events.
    query: `user.id:${address}${levelClause}`,
  });

  for (const field of SENTRY_ERROR_EVENTS_QUERY.fields) {
    params.append('field', field);
  }

  if (SENTRY_PROJECT) {
    params.append('project', SENTRY_PROJECT);
  }

  if (options?.cursor) {
    params.set('cursor', options.cursor);
  }

  return params;
}

/**
 * Params for the latest custom `heartbeat: …` Explore log for one validator.
 */
export function buildValidatorHeartbeatParams(
  address: string,
): URLSearchParams {
  const params = new URLSearchParams({
    dataset: SENTRY_HEARTBEAT_QUERY.dataset,
    statsPeriod: SENTRY_HEARTBEAT_QUERY.statsPeriod,
    per_page: String(SENTRY_HEARTBEAT_QUERY.perPage),
    sort: SENTRY_HEARTBEAT_QUERY.sort,
    sampling: 'NORMAL',
    query: `user.id:${address} ${SENTRY_HEARTBEAT_QUERY.messageQuery}`,
  });

  params.append('caseInsensitive', '');

  for (const field of SENTRY_HEARTBEAT_QUERY.fields) {
    params.append('field', field);
  }

  if (SENTRY_PROJECT) {
    params.append('project', SENTRY_PROJECT);
  }

  return params;
}
