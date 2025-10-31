import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { SignatureService } from './signature.service';
import {
  EIP712_DOMAIN,
  EIP712_SHAREHOLDER_AUTH_TYPES,
  IShareholderAuthType,
} from './signature.const';
import { ethers, verifyTypedData } from 'ethers';
import { GetShareholderPaymentDataDto } from './signature.dto';

@Controller('payment-details')
export class SignatureController {
  constructor(private signatureService: SignatureService) {}

  @Get('shareholder/template')
  getPersonalSigTemplate() {
    const message: IShareholderAuthType = {
      shareholder: ethers.ZeroAddress,
      issuedAt: 0,
    };

    return {
      domain: EIP712_DOMAIN,
      types: EIP712_SHAREHOLDER_AUTH_TYPES,
      message,
    };
  }

  @Post('shareholder')
  async getShareholderPaymentData(@Body() body: GetShareholderPaymentDataDto) {
    await this.signatureService.handleShareholderPaymentData(body);
  }

  //   @Post('eip712')
  //   async handleEIP712Sig() {}

  //   @Get()

  //   @Get('eip712/template')
  //   handleEIP712SigTemplate() {
  //     const message: IEIP712AuthorizationType = {
  //       shareholder: '0x0000000000000000000000000000000000000000',
  //       delegate: '0x0000000000000000000000000000000000000000',
  //       assets: ['0x0000000000000000000000000000000000000000'],
  //       startDate: 0,
  //       endDate: 0,
  //       expirationDate: 0,
  //     };

  //     return {
  //       domain: EIP712_DOMAIN,
  //       types: EIP712_TYPES,
  //       message,
  //     };
  //   }
}
