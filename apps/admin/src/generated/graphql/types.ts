import type * as Types from './schema.types';

export type StatisticQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type StatisticQuery = { stats?: Types.Maybe<Pick<Types.Stats, 'id' | 'contractsCount' | 'expensesCount'>> };

export type LoanOffersListQueryVariables = Types.Exact<{
  first?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  skip?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  orderBy?: Types.InputMaybe<Types.LoanContract_OrderBy>;
  orderDirection?: Types.InputMaybe<Types.OrderDirection>;
}>;


export type LoanOffersListQuery = { loanContracts: Array<(
    Pick<Types.LoanContract, 'id' | 'loanContract' | 'borrower' | 'isPackLoan' | 'loanAmount' | 'feePpm' | 'status' | 'timestamp' | 'transactionHash' | 'expirationDate'>
    & { collaterals: Array<Pick<Types.LoanContractCollateral, 'tokenAddress' | 'tokenId' | 'tokenAmount'>>, expenses: Array<Pick<Types.Expense, 'gasPrice' | 'totalCost'>> }
  )> };

export type LoanOfferQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type LoanOfferQuery = { loanContract?: Types.Maybe<(
    Pick<Types.LoanContract, 'id' | 'loanContract' | 'borrower' | 'isPackLoan' | 'loanAmount' | 'feePpm' | 'status' | 'timestamp' | 'transactionHash' | 'expirationDate'>
    & { collaterals: Array<Pick<Types.LoanContractCollateral, 'tokenAddress' | 'tokenId' | 'tokenAmount'>>, expenses: Array<Pick<Types.Expense, 'gasPrice' | 'totalCost'>> }
  )> };

export type TransactionsListQueryVariables = Types.Exact<{
  first?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  skip?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  where?: Types.InputMaybe<Types.Expense_Filter>;
  orderBy?: Types.InputMaybe<Types.Expense_OrderBy>;
  orderDirection?: Types.InputMaybe<Types.OrderDirection>;
}>;


export type TransactionsListQuery = { expenses: Array<(
    Pick<Types.Expense, 'id' | 'transactionHash' | 'kind' | 'baseFeePerGas' | 'gasLimit' | 'gasPrice' | 'gasUsed' | 'cumulativeGasUsed' | 'totalCost' | 'timestamp'>
    & { loanContract: Pick<Types.LoanContract, 'id'>, collaterals: Array<Pick<Types.LoanContractCollateral, 'tokenAddress'>> }
  )> };

export type TransactionQueryVariables = Types.Exact<{
  id: Types.Scalars['ID']['input'];
}>;


export type TransactionQuery = { expense?: Types.Maybe<(
    Pick<Types.Expense, 'id' | 'transactionHash' | 'kind' | 'baseFeePerGas' | 'gasLimit' | 'gasPrice' | 'gasUsed' | 'cumulativeGasUsed' | 'totalCost' | 'timestamp'>
    & { loanContract: Pick<Types.LoanContract, 'id'>, collaterals: Array<Pick<Types.LoanContractCollateral, 'tokenAddress'>> }
  )> };
