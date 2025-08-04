import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { Auth0Guard } from '../auth/auth.guard';
import { LoanTerm } from './loanTerms.entity';
import { LoanTermsService } from './loanTerms.service';
import {
  CreateLoanTermsDto,
  GetLoanTermByCollateralTokenAddressParamDto,
  UpdateLoanTermsDto,
} from './loanTerms.dto';
import { Public } from '../auth/auth.decorator';

@Crud({
  model: {
    type: LoanTerm,
  },
  dto: {
    create: CreateLoanTermsDto,
    update: UpdateLoanTermsDto,
  },
  routes: {
    only: [
      'getOneBase',
      'getManyBase',
      'deleteOneBase',
      'updateOneBase',
      'createOneBase',
    ],
  },
  query: {
    alwaysPaginate: true,
  },
})
@UseGuards(Auth0Guard)
@Controller('loan-terms')
export class LoanTermsController implements CrudController<LoanTerm> {
  constructor(public service: LoanTermsService) {}

  @Public()
  @Get('collateral/:collateralTokenAddress/:chainId')
  async getByWalletAddress(
    @Param() params: GetLoanTermByCollateralTokenAddressParamDto,
  ) {
    return this.service.findByCollateralTokenAddress(params);
  }
}
