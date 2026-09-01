import { SENTRY_PROJECT } from './config';

export type SentryIssueLevelFilter = 'error' | 'warning';

export const SENTRY_ISSUE_QUERY = {
  /** Sentry search filter applied to all issue requests. */
  status: 'is:unresolved',
  /** Time window for inline issue stats (Sentry API statsPeriod). */
  statsPeriod: '14d',
  /** Maximum number of issues returned per request. */
  limit: 25,
  /** Issue levels fetched for each validator address. */
  levels: ['error', 'warning'] as const satisfies readonly SentryIssueLevelFilter[],
} as const;

export function buildValidatorIssueQuery(
  address: string,
  level: SentryIssueLevelFilter,
): string {
  return `${address}`;
}

function buildIssueSearchQuery(searchQuery: string): string {
  return [
    SENTRY_ISSUE_QUERY.status,
    SENTRY_PROJECT ? `project:${SENTRY_PROJECT}` : null,
    searchQuery,
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildIssueListParams(searchQuery: string): URLSearchParams {
  return new URLSearchParams({
    // query: buildIssueSearchQuery(searchQuery),
    limit: String(SENTRY_ISSUE_QUERY.limit),
    statsPeriod: SENTRY_ISSUE_QUERY.statsPeriod,
  });
}
