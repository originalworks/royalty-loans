import { Module } from '@nestjs/common';

import { SignatureService } from './signature.service';

@Module({
  imports: [],
  providers: [SignatureService],
  exports: [SignatureService],
  // controllers: [LoanTermsController],
})
export class SignatureModule {}
