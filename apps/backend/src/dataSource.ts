import { DataSource } from 'typeorm';
import { testDbConfig } from './config/dbConfig';

const dataSource = new DataSource(testDbConfig());

if (!dataSource.isInitialized) {
  void dataSource.initialize();
}

export default dataSource;
