import type * as Types from './schema.types';

export type LoanFactoriesListQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type LoanFactoriesListQuery = { initializedFactories: Array<Pick<Types.InitializedFactory, 'id' | 'version' | 'blockNumber' | 'timestamp' | 'transactionHash'>> };

export type LoanOffersListQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type LoanOffersListQuery = { loanContracts: Array<Pick<Types.LoanContract, 'id' | 'loanContract' | 'borrower' | 'collateralToken' | 'collateralTokenId' | 'collateralAmount' | 'loanAmount' | 'feePpm' | 'status' | 'timestamp' | 'transactionHash'>> };

export type LoanOfferQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type LoanOfferQuery = { loanContract?: Types.Maybe<Pick<Types.LoanContract, 'id' | 'loanContract' | 'borrower' | 'collateralToken' | 'collateralTokenId' | 'collateralAmount' | 'loanAmount' | 'feePpm' | 'status' | 'timestamp' | 'transactionHash'>> };
