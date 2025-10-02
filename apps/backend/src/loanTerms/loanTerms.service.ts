import { Repository, In } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

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
    try {
      return await this.loanTermsRepo.findOneByOrFail({
        collateralTokenAddress,
        chainId,
      });
    } catch (error) {
      throw new NotFoundException(error);
    }
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
