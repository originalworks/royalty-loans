import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { dbConfigs } from './config/dbConfig';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

const createApp = (appInstance: NestExpressApplication) => {
  // Link is required for Sentry Discover pagination cursors.
  appInstance.enableCors({
    exposedHeaders: ['Link'],
  });
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
        AppModule.forDbConnection(dbConfigs.db),
        { cors: true },
      );
      AppInstance.instance = createApp(appInstance);
    }
    return AppInstance.instance;
  }

  public static async getLocalInstance() {
    if (!AppInstance.instance) {
      const appInstance = await NestFactory.create<NestExpressApplication>(
        AppModule.forDbConnection(dbConfigs.local),
        { cors: true },
      );
      AppInstance.instance = createApp(appInstance);
    }
    return AppInstance.instance;
  }
}
