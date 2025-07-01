import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { testDbConfig } from './config/dbConfig';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

const createApp = (appInstance: NestExpressApplication) => {
  appInstance.enableCors();
  appInstance.useLogger(appInstance.get(Logger));

  return appInstance.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
};

export class AppInstance {
  private static instance: NestExpressApplication;

  public static async getInstance() {
    if (!AppInstance.instance) {
      const appInstance = await NestFactory.create<NestExpressApplication>(
        AppModule.forDbConnection(testDbConfig()),
        { cors: true },
      );
      AppInstance.instance = createApp(appInstance);
    }
    return AppInstance.instance;
  }
}
