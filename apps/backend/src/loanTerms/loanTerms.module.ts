import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoanTerm } from './loanTerms.entity';
import { LoanTermsService } from './loanTerms.service';
import { LoanTermsController } from './loanTerms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanTerm])],
  providers: [LoanTermsService],
  exports: [LoanTermsService],
  controllers: [LoanTermsController],
})
export class LoanTermsModule {}
