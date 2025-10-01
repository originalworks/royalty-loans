import { Crud, CrudController } from '@dataui/crud';
import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';

import { Auth0Guard } from '../auth/auth.guard';
import { Public } from '../auth/auth.decorator';
import {
  CreateLoanTermsDto,
  GetLoanTermByCollateralTokenAddressParamDto,
  GetLoanTermsByCollateralAddressesBodyDto,
  UpdateLoanTermsDto,
} from './loanTerms.dto';
import { LoanTerm } from './loanTerms.entity';
import { LoanTermsService } from './loanTerms.service';

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

  @Public()
  @Post('collaterals')
  async getLoanTermsByCollateralAddresses(
    @Body() body: GetLoanTermsByCollateralAddressesBodyDto,
  ) {
    return this.service.findAllLoanTermsByCollateralTokenAddresses(body);
  }
}
