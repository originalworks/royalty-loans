import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { SignatureService } from './signature.service';
import {
  EIP712_DELEGATED_AUTH_TYPES,
  EIP712_DOMAIN,
  EIP712_SHAREHOLDER_AUTH_TYPES,
  IDelegatedAuthType,
  IShareholderAuthType,
} from './signature.const';
import {
  GetDelegatedPaymentDataDto,
  GetShareholderPaymentDataDto,
} from './signature.dto';
import { ZeroAddress } from 'ethers';

@Controller('payment-details')
export class SignatureController {
  constructor(private signatureService: SignatureService) {}

  @Get('shareholder/template')
  getShareholderSigTemplate() {
    const message: IShareholderAuthType = {
      shareholder: ZeroAddress,
      issuedAt: 0,
      chainId: '0',
    };

    return {
      domain: EIP712_DOMAIN,
      types: EIP712_SHAREHOLDER_AUTH_TYPES,
      message,
    };
  }

  @Post('shareholder')
  @HttpCode(200)
  async getShareholderPaymentData(@Body() body: GetShareholderPaymentDataDto) {
    await this.signatureService.handleShareholderPaymentData(body);
  }

  @Get('delegated/template')
  handleDelegatedSigTemplate() {
    const message: IDelegatedAuthType = {
      shareholder: ZeroAddress,
      delegate: ZeroAddress,
      assets: [ZeroAddress],
      chainId: '0',
      startDate: 0,
      endDate: 0,
    };

    return {
      domain: EIP712_DOMAIN,
      types: EIP712_DELEGATED_AUTH_TYPES,
      message,
    };
  }

  @Post('delegated')
  @HttpCode(200)
  async getDelegatedPaymentData(@Body() body: GetDelegatedPaymentDataDto) {
    await this.signatureService.handleDelegatedPaymentData(body);
  }
}
