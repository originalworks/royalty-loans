export interface IConfig {
  ENVIRONMENT: string;
  AUTH0_ISSUER: string;
  AUTH0_AUDIENCE: string;
  SENTRY_HOST: string;
  SENTRY_AUTH_TOKEN: string;
  BLOCKSCOUT_API_URL: string;
  BLOCKSCOUT_API_KEY: string;
}

export const config = (): IConfig => ({
  ENVIRONMENT: process.env.ENVIRONMENT ?? '',
  AUTH0_ISSUER: process.env.AUTH0_ISSUER ?? '',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE ?? '',
  SENTRY_HOST: process.env.SENTRY_HOST ?? 'https://us.sentry.io',
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN ?? '',
  BLOCKSCOUT_API_URL:
    process.env.BLOCKSCOUT_API_URL ??
    'https://api.blockscout.com/100/api/v2',
  BLOCKSCOUT_API_KEY: process.env.BLOCKSCOUT_API_KEY ?? '',
});
