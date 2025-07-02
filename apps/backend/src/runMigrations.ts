import { DataSource } from 'typeorm';
import { dbConfigs } from './config/dbConfig';
import {
  CodeDeployClient,
  LifecycleEventStatus,
  PutLifecycleEventHookExecutionStatusCommand,
} from '@aws-sdk/client-codedeploy';

export const createDBIfNotExists = async (dataBaseName: string) => {
  const dataSource = new DataSource({ ...dbConfigs.migration, logging: true });

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

export const runMigrations = async (event) => {
  const date = new Date().toISOString();
  console.log('date', date);
  const codedeploy = new CodeDeployClient({ apiVersion: date });

  const dbConfig = dbConfigs.db;
  console.log('dbconfig: ', dbConfig);
  const dataBaseName = dbConfig.database?.toString();

  if (!dataBaseName) {
    throw new Error('Database name not found');
  }

  let dataSource: DataSource | undefined;
  let result: LifecycleEventStatus | undefined;

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
    result = 'Succeeded';
    console.log('Finished running migrationss');
  } catch (error) {
    console.error('run migrations error', error);
  } finally {
    console.log('finally run migrations');
    if (dataSource) {
      await dataSource.destroy();
    }

    if (event.DeploymentId) {
      const command = new PutLifecycleEventHookExecutionStatusCommand({
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: result,
      });

      const endOfMigration = await codedeploy.send(command);

      console.log('endOfMigration', endOfMigration);
    }
  }
};
