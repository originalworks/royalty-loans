import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoanTerm } from './loanTerms.entity';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

@Injectable()
export class LoanTermsService extends TypeOrmCrudService<LoanTerm> {
  private static readonly logger = new Logger(LoanTermsService.name);

  constructor(
    @InjectRepository(LoanTerm)
    private loanTermsRepo: Repository<LoanTerm>,
  ) {
    super(loanTermsRepo);
  }

  async findByCollateralTokenAddress(
    collateralTokenAddress: string,
  ): Promise<LoanTerm> {
    return await this.loanTermsRepo.findOneByOrFail({ collateralTokenAddress });
  }
}
