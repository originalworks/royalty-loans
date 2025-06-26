import { DataSource } from 'typeorm';

export const clearDatabase = async (
  dataSource: DataSource,
  omitTables: Array<string> = [],
) => {
  await dataSource.manager.transaction(async (tm) => {
    for (const entity of dataSource.entityMetadatas) {
      if (
        entity.tableType !== 'regular' ||
        omitTables.includes(entity.tableName)
      ) {
        continue;
      }

      await tm.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
      );
    }
  });
};

export const clearTables = async (
  dataSource: DataSource,
  tableNames: string[],
) => {
  await dataSource.manager.transaction(async (tm) => {
    for await (const tableName of tableNames) {
      await tm.query(`DELETE FROM "${tableName}";`);
    }
  });
};
