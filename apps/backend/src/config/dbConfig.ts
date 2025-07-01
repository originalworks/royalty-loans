import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';

export const testDbConfig = (): DataSourceOptions => ({
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  type: 'postgres',
  entities,
  migrations: ['dist/migrations/*.js'],
  synchronize: true,
  dropSchema: true,
});
