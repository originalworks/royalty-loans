import {
  SENTRY_API_URL,
  SENTRY_AUTH_TOKEN,
  SENTRY_ORG,
  SENTRY_PROJECT,
} from '../config/config';
import {
  SENTRY_ISSUE_QUERY,
  buildIssueListParams,
  buildValidatorIssueQuery,
} from '../config/sentry';

export { buildValidatorIssueQuery, SENTRY_ISSUE_QUERY } from '../config/sentry';

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

const DEFAULT_SENTRY_API_URL = 'https://sentry.io/api/0';

function isSentryConfigured(): boolean {
  return Boolean(SENTRY_API_URL && SENTRY_ORG && SENTRY_PROJECT);
}

function getApiBaseUrl(): string | null {
  if (!SENTRY_API_URL) {
    return null;
  }

  return SENTRY_API_URL.replace(/\/$/, '');
}

function getRequestHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  const apiBase = getApiBaseUrl();
  const usesProxy = apiBase?.startsWith('/');

  if (SENTRY_AUTH_TOKEN && !usesProxy) {
    headers.Authorization = `Bearer ${SENTRY_AUTH_TOKEN}`;
  }

  return headers;
}

function getOrganizationIssuesPath(): string | null {
  if (!SENTRY_ORG) {
    return null;
  }
  return `/organizations/${SENTRY_ORG}/issues/`;
}

function buildRequestUrl(path: string, params?: URLSearchParams): string | null {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const query = params?.toString();

  return query
    ? `${baseUrl}${normalizedPath}?${query}`
    : `${baseUrl}${normalizedPath}`;
}

function parseIssue(issue: Record<string, unknown>): SentryIssue | null {
  const id = issue.id;
  const title =
    typeof issue.title === 'string'
      ? issue.title
      : typeof (issue.metadata as { title?: string } | undefined)?.title ===
          'string'
        ? (issue.metadata as { title: string }).title
        : null;

  if (typeof id !== 'string' || !title) {
    return null;
  }

  const level = issue.level;
  if (
    level !== 'fatal' &&
    level !== 'error' &&
    level !== 'warning' &&
    level !== 'info' &&
    level !== 'debug'
  ) {
    return null;
  }

  return {
    id,
    title,
    level,
    count: typeof issue.count === 'string' ? issue.count : '0',
    lastSeen: typeof issue.lastSeen === 'string' ? issue.lastSeen : '',
    permalink: typeof issue.permalink === 'string' ? issue.permalink : '',
    status: typeof issue.status === 'string' ? issue.status : 'unresolved',
  };
}

function sumEventCount(issues: SentryIssue[]): number {
  return issues.reduce((total, issue) => total + Number.parseInt(issue.count, 10), 0);
}

function latestIssue(issues: SentryIssue[]): SentryIssue | null {
  if (issues.length === 0) {
    return null;
  }

  return [...issues].sort(
    (left, right) =>
      new Date(right.lastSeen).getTime() - new Date(left.lastSeen).getTime(),
  )[0];
}

async function readSentryError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (typeof payload.detail === 'string' && payload.detail.length > 0) {
      return payload.detail;
    }
  } catch {
    // Ignore non-JSON error bodies.
  }

  return response.statusText || 'Unknown error';
}

async function sentryGet<T>(path: string, params?: URLSearchParams): Promise<T | null> {
  const url = buildRequestUrl(path, params);
  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    headers: getRequestHeaders(),
  });

  if (!response.ok) {
    const detail = await readSentryError(response);

    if (response.status === 403) {
      throw new Error(
        `Sentry API forbidden: ${detail}. Ensure the token has the event:read scope and targets the correct region host.`,
      );
    }

    throw new Error(`Sentry API request failed (${response.status}): ${detail}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('Sentry API returned a non-JSON response');
  }

  return response.json() as Promise<T>;
}

export async function fetchProjectIssues(query: string): Promise<SentryIssue[]> {
  if (!isSentryConfigured()) {
    return [];
  }

  const issuesPath = getOrganizationIssuesPath();
  if (!issuesPath) {
    return [];
  }

  const data = await sentryGet<Record<string, unknown>[]>(
    issuesPath,
    buildIssueListParams(query),
  );

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((issue) => parseIssue(issue))
    .filter((issue): issue is SentryIssue => issue !== null);
}

export async function fetchValidatorSentrySummary(
  address: string,
): Promise<SentryIssueSummary> {
  const emptySummary: SentryIssueSummary = {
    errorCount: 0,
    warningCount: 0,
    latestError: null,
    latestWarning: null,
  };

  if (!isSentryConfigured()) {
    return emptySummary;
  }

  const issuesByLevel = Object.fromEntries(
    await Promise.all(
      SENTRY_ISSUE_QUERY.levels.map(async (level) => [
        level,
        await fetchProjectIssues(buildValidatorIssueQuery(address, level)),
      ]),
    ),
  ) as Partial<Record<(typeof SENTRY_ISSUE_QUERY.levels)[number], SentryIssue[]>>;

  const errors = issuesByLevel.error ?? [];
  const warnings = issuesByLevel.warning ?? [];

  return {
    errorCount: sumEventCount(errors),
    warningCount: sumEventCount(warnings),
    latestError: latestIssue(errors),
    latestWarning: latestIssue(warnings),
  };
}

export function getSentryConfigured(): boolean {
  return isSentryConfigured();
}

export function getDefaultSentryApiUrl(): string {
  return DEFAULT_SENTRY_API_URL;
}
