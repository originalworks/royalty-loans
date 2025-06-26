import { DataSource } from 'typeorm';
import { dbCreatorConfig, dbConfigs } from './config/dbConfig';

export const createDBIfNotExists = async (dataBaseName: string) => {
  const dataSource = new DataSource({ ...dbCreatorConfig(), logging: true });

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  console.log('Created dbCreatorConnection');

  const query = await dataSource.query(
    `SELECT datname FROM pg_database WHERE datname = '${dataBaseName}'`,
  );

  if (!query[0]?.datname) {
    await dataSource.query(`CREATE DATABASE "${dataBaseName}"`);
    console.log(`${dataBaseName} was created`);
  }

  await dataSource.destroy();
  console.log('dbCreatorConnection was closed');
};

export const runMigrations = async () => {
  const date = new Date().toISOString();
  console.log('date', date);

  const dbConfig = dbConfigs.devel;
  console.log('dbconfig: ', dbConfig);
  const dataBaseName = dbConfig.database.toString();
  let dataSource: DataSource;

  await createDBIfNotExists(dataBaseName);

  try {
    dataSource = new DataSource({ ...dbConfig, logging: true });
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    console.log(`Established connection with db: ${dataBaseName}`);

    await dataSource.runMigrations({
      transaction: 'all',
    });
    console.log('Finished running migrations');
  } catch (error) {
    console.error('run migrations error', error);
  } finally {
    console.log('finally run migrations');

    await dataSource.destroy();

    console.log('DONE');
  }
};
