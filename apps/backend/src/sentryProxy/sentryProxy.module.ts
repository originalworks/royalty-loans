import { Module } from '@nestjs/common';

import { SentryProxyController } from './sentryProxy.controller';
import { SentryProxyService } from './sentryProxy.service';

@Module({
  controllers: [SentryProxyController],
  providers: [SentryProxyService],
})
export class SentryProxyModule {}
