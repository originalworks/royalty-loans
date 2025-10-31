import { Type } from 'class-transformer';
import {
  IsEthereumAddress,
  IsInt,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';

export class GetShareholderPaymentDataDto {
  @IsNotEmpty()
  signature: string;

  @ValidateNested()
  @Type(() => ShareholderAuthDto)
  message: ShareholderAuthDto;
}

export class ShareholderAuthDto {
  @IsEthereumAddress()
  shareholder: string;

  @IsInt()
  timestamp: number;
}
