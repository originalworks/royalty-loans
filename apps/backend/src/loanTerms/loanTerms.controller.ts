import {
  Get,
  Body,
  Post,
  Param,
  HttpCode,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';

import { Auth0Guard } from '../auth/auth.guard';
import { Public } from '../auth/auth.decorator';
import {
  CreateLoanTermsDto,
  UpdateLoanTermsDto,
  GetLoanTermsByCollateralAddressesBodyDto,
  GetLoanTermByCollateralTokenAddressParamDto,
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
  async getLoanTermByCollateralAddress(
    @Param() params: GetLoanTermByCollateralTokenAddressParamDto,
  ) {
    return this.service.findByCollateralTokenAddress(params);
  }

  @Public()
  @Post('collaterals')
  @HttpCode(200)
  async getLoanTermsByCollateralAddresses(
    @Body() body: GetLoanTermsByCollateralAddressesBodyDto,
  ) {
    return this.service.findAllLoanTermsByCollateralTokenAddresses(body);
  }
}
