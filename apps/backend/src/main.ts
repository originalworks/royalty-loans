import { Logger } from '@nestjs/common';
import { AppInstance } from './app.instance';

async function bootstrap() {
  const app = await AppInstance.getInstance();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0', () => {
    Logger.log(
      `🚀 Application is running on: http://localhost:${process.env.PORT}`,
    );
  });
}

bootstrap();
