import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEthereumAddress,
  IsInt,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';

export class ShareholderAuthDto {
  @IsEthereumAddress()
  shareholder: string;

  @IsInt()
  issuedAt: number;

  @IsNotEmpty()
  chainId: string;
}
export class GetShareholderPaymentDataDto {
  @IsNotEmpty()
  signature: string;

  @ValidateNested()
  @Type(() => ShareholderAuthDto)
  message: ShareholderAuthDto;

  @IsArray()
  @ArrayNotEmpty()
  @IsEthereumAddress({ each: true })
  assets: string[];
}

export class DelegatedAuthDto {
  @IsEthereumAddress()
  shareholder: string;

  @IsEthereumAddress()
  delegate: string;

  @IsNotEmpty()
  chainId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEthereumAddress({ each: true })
  assets: string[];

  @IsInt()
  startDate: number;

  @IsInt()
  endDate: number;
}

export class GetDelegatedPaymentDataDto {
  @IsNotEmpty()
  shareholderSignature: string;

  @ValidateNested()
  @Type(() => DelegatedAuthDto)
  shareholderMessage: DelegatedAuthDto;

  @IsNotEmpty()
  delegateSignature: string;
}
