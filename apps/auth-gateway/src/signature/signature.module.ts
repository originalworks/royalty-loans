import { Module } from '@nestjs/common';

import { SignatureService } from './signature.service';
import { SignatureController } from './signature.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  providers: [SignatureService],
  exports: [SignatureService],
  controllers: [SignatureController],
})
export class SignatureModule {}
