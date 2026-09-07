export interface IConfig {
  ENVIRONMENT: string;
  AUTH0_ISSUER: string;
  AUTH0_AUDIENCE: string;
  SENTRY_HOST: string;
  SENTRY_AUTH_TOKEN: string;
}

export const config = (): IConfig => ({
  ENVIRONMENT: process.env.ENVIRONMENT ?? '',
  AUTH0_ISSUER: process.env.AUTH0_ISSUER ?? '',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE ?? '',
  SENTRY_HOST: process.env.SENTRY_HOST ?? 'https://us.sentry.io',
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN ?? '',
});
