import { Controller, UseGuards } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { Auth0Guard } from '../auth/auth.guard';
import { LoanTerm } from './loanTerms.entity';
import { LoanTermsService } from './loanTerms.service';
import { CreateLoanTermsDto } from './loanTerms.dto';

@Crud({
  model: {
    type: LoanTerm,
  },
  dto: {
    create: CreateLoanTermsDto,
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
}
