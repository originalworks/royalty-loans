import {
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
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

  @IsString()
  @Matches(/^\d+$/, {
    message: 'maxLoanAmount must be a string containing only digits',
  })
  maxLoanAmount: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'ratio must have at most 2 decimal places' },
  )
  @IsPositive()
  ratio: number;
}
