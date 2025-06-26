import { Controller, UseGuards } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { Auth0Guard } from '../auth/auth.guard';
import { LoanTerm } from './loanTerms.entity';
import { LoanTermsService } from './loanTerms.service';

@Crud({
  model: {
    type: LoanTerm,
  },
  query: {
    alwaysPaginate: true,
  },
})
@UseGuards(Auth0Guard)
@Controller('loan-terms')
export class LoanTermsController implements CrudController<LoanTerm> {
  constructor(public service: LoanTermsService) {}

  // get base(): CrudController<UpdateRequest> {
  //   return this;
  // }

  // @Override('createOneBase')
  // async createUpdateRequest(
  //   @ParsedRequest() req: CrudRequest,
  //   @ParsedBody() dto: CreateUpdateRequestDto,
  //   @Body(ValidateInput) validatedBody: CreateUpdateRequestDto,
  // ) {
  //   return this.service.createUpdateRequest(dto);
  // }
}
