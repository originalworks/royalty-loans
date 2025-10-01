import { Repository, In } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import {
  GetLoanTermsByCollateralAddressesBodyDto,
  GetLoanTermByCollateralTokenAddressParamDto,
} from './loanTerms.dto';
import { LoanTerm } from './loanTerms.entity';

@Injectable()
export class LoanTermsService extends TypeOrmCrudService<LoanTerm> {
  private static readonly logger = new Logger(LoanTermsService.name);

  constructor(
    @InjectRepository(LoanTerm)
    private loanTermsRepo: Repository<LoanTerm>,
  ) {
    super(loanTermsRepo);
  }

  async findByCollateralTokenAddress({
    collateralTokenAddress,
    chainId,
  }: GetLoanTermByCollateralTokenAddressParamDto): Promise<LoanTerm> {
    return await this.loanTermsRepo.findOneByOrFail({
      collateralTokenAddress,
      chainId,
    });
  }

  async findAllLoanTermsByCollateralTokenAddresses({
    chainId,
    tokenAddresses,
  }: GetLoanTermsByCollateralAddressesBodyDto): Promise<LoanTerm[]> {
    return await this.loanTermsRepo.findBy({
      chainId,
      collateralTokenAddress: In(tokenAddresses),
    });
  }
}
