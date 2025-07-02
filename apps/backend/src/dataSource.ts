import { DataSource } from 'typeorm';
import { dbConfigs } from './config/dbConfig';

const dataSource = new DataSource(dbConfigs.local);

console.log(dbConfigs.local);
if (!dataSource.isInitialized) {
  void dataSource.initialize();
}

export default dataSource;
