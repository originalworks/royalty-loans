import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';
import path from 'path';

export type DbConfigs = 'db' | 'test' | 'local' | 'migration';

export const dbConfigs: { [k in DbConfigs]: DataSourceOptions } = {
  db: {
    host: process.env.DB_HOST,
    type: 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities,
    migrations: ['out/dist/migrations/*.js'],
    synchronize: false,
    ssl: {
      rejectUnauthorized: false,
    },
  },
  local: {
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    type: 'postgres',
    entities,
    migrations: [
      path.resolve(__dirname, '../../infrastructure/out/dist/migrations/*.js'),
    ],
    synchronize: false,
  },
  test: {
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
  },
  migration: {
    name: 'db-creator',
    host: process.env.DB_HOST,
    type: 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.ROOT_DB_NAME,
    synchronize: false,
    ssl: {
      rejectUnauthorized: false,
    },
  },
};
