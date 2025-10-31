export interface IConfig {
  ENVIRONMENT: string;
  AUTH0_ISSUER: string;
  AUTH0_AUDIENCE: string;
}

export const config = (): IConfig => ({
  ENVIRONMENT: process.env.ENVIRONMENT ?? '',
  AUTH0_ISSUER: process.env.AUTH0_ISSUER ?? '',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE ?? '',
});
