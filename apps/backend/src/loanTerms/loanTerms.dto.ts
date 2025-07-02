import {
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

export class CreateLoanTermsDto {
  @IsNotEmpty()
  @IsString()
  @IsEthereumAddress()
  collateralTokenAddress: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, {
    message: 'feePercentagePpm must be a string containing only digits',
  })
  feePercentagePpm: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+$/, {
    message: 'maxLoanAmount must be a string containing only digits',
  })
  maxLoanAmount: string;

  @IsNotEmpty()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'ratio must have at most 2 decimal places' },
  )
  @IsPositive()
  ratio: number;
}

export class UpdateLoanTermsDto {
  @IsOptional()
  @IsEthereumAddress()
  collateralTokenAddress?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, {
    message: 'feePercentagePpm must be a string containing only digits',
  })
  feePercentagePpm?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, {
    message: 'maxLoanAmount must be a string containing only digits',
  })
  maxLoanAmount?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'ratio must have at most 2 decimal places' },
  )
  @IsPositive()
  ratio?: number;
}

export class GetLoanTermByCollateralTokenAddressParamDto {
  @IsEthereumAddress()
  collateralTokenAddress: string;
}
