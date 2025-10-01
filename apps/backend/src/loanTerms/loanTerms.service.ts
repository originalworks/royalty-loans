import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoanTerm } from './loanTerms.entity';
import { Repository, In } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import {
  GetLoanTermByCollateralTokenAddressParamDto,
  GetLoanTermsByCollateralAddressesBodyDto,
} from './loanTerms.dto';

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
