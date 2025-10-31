import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config } from './config/config';
import { PinoLoggerModule } from './pinoLogger/pinoLogger.module';
import { DataSourceOptions } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanTermsModule } from './loanTerms/loanTerms.module';
import { AuthModule } from './auth/auth.module';

@Module({})
export class AppModule {
  static forDbConnection(dbConfig: DataSourceOptions): DynamicModule {
    const imports = [
      ConfigModule.forRoot({
        load: [config],
        isGlobal: true,
      }),
      TypeOrmModule.forRoot({ ...dbConfig }),
      PinoLoggerModule,
      LoanTermsModule,
      AuthModule,
    ];

    return {
      module: AppModule,
      imports,
      providers: [],
    };
  }
}
