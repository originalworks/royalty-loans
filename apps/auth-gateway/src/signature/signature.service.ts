import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { GetShareholderPaymentDataDto } from './signature.dto';
import { verifyTypedData } from 'ethers';
import {
  EIP712_DOMAIN,
  EIP712_SHAREHOLDER_AUTH_TYPES,
} from './signature.const';

@Injectable()
export class SignatureService {
  private static readonly logger = new Logger(SignatureService.name);

  async handleShareholderPaymentData({
    message,
    signature,
  }: GetShareholderPaymentDataDto) {
    const recoveredShareholder = verifyTypedData(
      EIP712_DOMAIN,
      EIP712_SHAREHOLDER_AUTH_TYPES,
      message,
      signature,
    );

    if (
      recoveredShareholder.toLocaleLowerCase() !==
      message.shareholder.toLowerCase()
    ) {
      throw new UnauthorizedException(
        'Signature does not match claimed address',
      );
    }

    const diffMs = Date.now() - message.timestamp;
    const isExpired = diffMs < 0 && diffMs > 24 * 60 * 60 * 1000;

    if (isExpired) {
      throw new UnauthorizedException('Signature expired');
    }
  }
}
