import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config } from './config/config';
import { PinoLoggerModule } from './pinoLogger/pinoLogger.module';
import { SignatureModule } from './signature/signature.module';

@Module({})
export class AppModule {
  static forDbConnection(): DynamicModule {
    const imports = [
      ConfigModule.forRoot({
        load: [config],
        isGlobal: true,
      }),
      PinoLoggerModule,
      SignatureModule,
    ];

    return {
      module: AppModule,
      imports,
      providers: [],
    };
  }
}
