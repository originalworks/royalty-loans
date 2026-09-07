export const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT;
export const AUTH0_ISSUER = import.meta.env.VITE_AUTH0_ISSUER;
export const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;
export const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const BASE_RPC_URL = import.meta.env.VITE_BASE_RPC_URL;
export const BASE_SUBGRAPH_URL = import.meta.env.VITE_BASE_SUBGRAPH_URL;
export const POLYGON_RPC_URL = import.meta.env.VITE_POLYGON_RPC_URL;
export const POLYGON_SUBGRAPH_URL = import.meta.env.VITE_POLYGON_SUBGRAPH_URL;
export const GNOSIS_RPC_URL = import.meta.env.VITE_GNOSIS_RPC_URL;
/** Local: `/blockscout-api` (Vite proxy). Otherwise `${BACKEND_URL}/blockscout-api`. */
export const GNOSIS_EXPLORER_API_URL =
  import.meta.env.VITE_GNOSIS_EXPLORER_API_URL ||
  (BACKEND_URL
    ? `${String(BACKEND_URL).replace(/\/$/, '')}/blockscout-api`
    : undefined);
export const GNOSIS_EXPLORER_URL = import.meta.env.VITE_GNOSIS_EXPLORER_URL;
export const SENTRY_HOST =
  import.meta.env.VITE_SENTRY_HOST ?? 'https://sentry.io';
/** Local: `/sentry-api` (Vite proxy). Otherwise `${BACKEND_URL}/sentry-api`. */
export const SENTRY_API_URL =
  import.meta.env.VITE_SENTRY_API_URL ||
  (BACKEND_URL
    ? `${String(BACKEND_URL).replace(/\/$/, '')}/sentry-api`
    : `${SENTRY_HOST}/api/0`);
export const SENTRY_ORG = import.meta.env.VITE_SENTRY_ORG;
export const SENTRY_PROJECT = import.meta.env.VITE_SENTRY_PROJECT;
export const PROD_DOMAIN = import.meta.env.VITE_PROD_DOMAIN;
export const STAGE_DOMAIN = import.meta.env.VITE_STAGE_DOMAIN;
