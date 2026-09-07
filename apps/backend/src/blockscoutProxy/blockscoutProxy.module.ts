import { Module } from '@nestjs/common';

import { BlockscoutProxyController } from './blockscoutProxy.controller';
import { BlockscoutProxyService } from './blockscoutProxy.service';

@Module({
  controllers: [BlockscoutProxyController],
  providers: [BlockscoutProxyService],
})
export class BlockscoutProxyModule {}
