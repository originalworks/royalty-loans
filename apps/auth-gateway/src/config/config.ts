export interface IConfig {
  ENVIRONMENT: string;
  ALCHEMY_API_KEY: string;
}

export const config = (): IConfig => ({
  ENVIRONMENT: process.env.ENVIRONMENT ?? '',
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY ?? '',
});
