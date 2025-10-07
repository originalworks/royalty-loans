export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigDecimal: { input: any; output: any; }
  BigInt: { input: any; output: any; }
  Bytes: { input: any; output: any; }
  Int8: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
};

export type Aggregation_Interval =
  | 'day'
  | 'hour';

export type BlockChangedFilter = {
  number_gte: Scalars['Int']['input'];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars['Bytes']['input']>;
  number?: InputMaybe<Scalars['Int']['input']>;
  number_gte?: InputMaybe<Scalars['Int']['input']>;
};

export type Expense = {
  baseFeePerGas?: Maybe<Scalars['BigInt']['output']>;
  cumulativeGasUsed?: Maybe<Scalars['BigInt']['output']>;
  from?: Maybe<Scalars['Bytes']['output']>;
  gasLimit: Scalars['BigInt']['output'];
  gasPrice: Scalars['BigInt']['output'];
  gasUsed?: Maybe<Scalars['BigInt']['output']>;
  id: Scalars['Bytes']['output'];
  kind: ExpenseKind;
  loanContract: LoanContract;
  timestamp: Scalars['BigInt']['output'];
  totalCost: Scalars['BigInt']['output'];
  transactionHash: Scalars['Bytes']['output'];
  value?: Maybe<Scalars['BigInt']['output']>;
};

export type ExpenseKind =
  | 'ERC20Approve'
  | 'ERC20Transfer'
  | 'LoanCreated'
  | 'LoanProvided'
  | 'LoanRepaid'
  | 'LoanRevoked';

export type Expense_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Expense_Filter>>>;
  baseFeePerGas?: InputMaybe<Scalars['BigInt']['input']>;
  baseFeePerGas_gt?: InputMaybe<Scalars['BigInt']['input']>;
  baseFeePerGas_gte?: InputMaybe<Scalars['BigInt']['input']>;
  baseFeePerGas_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  baseFeePerGas_lt?: InputMaybe<Scalars['BigInt']['input']>;
  baseFeePerGas_lte?: InputMaybe<Scalars['BigInt']['input']>;
  baseFeePerGas_not?: InputMaybe<Scalars['BigInt']['input']>;
  baseFeePerGas_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  cumulativeGasUsed?: InputMaybe<Scalars['BigInt']['input']>;
  cumulativeGasUsed_gt?: InputMaybe<Scalars['BigInt']['input']>;
  cumulativeGasUsed_gte?: InputMaybe<Scalars['BigInt']['input']>;
  cumulativeGasUsed_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  cumulativeGasUsed_lt?: InputMaybe<Scalars['BigInt']['input']>;
  cumulativeGasUsed_lte?: InputMaybe<Scalars['BigInt']['input']>;
  cumulativeGasUsed_not?: InputMaybe<Scalars['BigInt']['input']>;
  cumulativeGasUsed_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  from?: InputMaybe<Scalars['Bytes']['input']>;
  from_contains?: InputMaybe<Scalars['Bytes']['input']>;
  from_gt?: InputMaybe<Scalars['Bytes']['input']>;
  from_gte?: InputMaybe<Scalars['Bytes']['input']>;
  from_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  from_lt?: InputMaybe<Scalars['Bytes']['input']>;
  from_lte?: InputMaybe<Scalars['Bytes']['input']>;
  from_not?: InputMaybe<Scalars['Bytes']['input']>;
  from_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  from_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  gasLimit?: InputMaybe<Scalars['BigInt']['input']>;
  gasLimit_gt?: InputMaybe<Scalars['BigInt']['input']>;
  gasLimit_gte?: InputMaybe<Scalars['BigInt']['input']>;
  gasLimit_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  gasLimit_lt?: InputMaybe<Scalars['BigInt']['input']>;
  gasLimit_lte?: InputMaybe<Scalars['BigInt']['input']>;
  gasLimit_not?: InputMaybe<Scalars['BigInt']['input']>;
  gasLimit_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  gasPrice?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_gt?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_gte?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  gasPrice_lt?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_lte?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_not?: InputMaybe<Scalars['BigInt']['input']>;
  gasPrice_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  gasUsed?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_gt?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_gte?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  gasUsed_lt?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_lte?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_not?: InputMaybe<Scalars['BigInt']['input']>;
  gasUsed_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  kind?: InputMaybe<ExpenseKind>;
  kind_in?: InputMaybe<Array<ExpenseKind>>;
  kind_not?: InputMaybe<ExpenseKind>;
  kind_not_in?: InputMaybe<Array<ExpenseKind>>;
  loanContract?: InputMaybe<Scalars['String']['input']>;
  loanContract_?: InputMaybe<LoanContract_Filter>;
  loanContract_contains?: InputMaybe<Scalars['String']['input']>;
  loanContract_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_ends_with?: InputMaybe<Scalars['String']['input']>;
  loanContract_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_gt?: InputMaybe<Scalars['String']['input']>;
  loanContract_gte?: InputMaybe<Scalars['String']['input']>;
  loanContract_in?: InputMaybe<Array<Scalars['String']['input']>>;
  loanContract_lt?: InputMaybe<Scalars['String']['input']>;
  loanContract_lte?: InputMaybe<Scalars['String']['input']>;
  loanContract_not?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_contains?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  loanContract_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_starts_with?: InputMaybe<Scalars['String']['input']>;
  loanContract_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<Expense_Filter>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalCost?: InputMaybe<Scalars['BigInt']['input']>;
  totalCost_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalCost_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalCost_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalCost_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalCost_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalCost_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalCost_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  value?: InputMaybe<Scalars['BigInt']['input']>;
  value_gt?: InputMaybe<Scalars['BigInt']['input']>;
  value_gte?: InputMaybe<Scalars['BigInt']['input']>;
  value_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  value_lt?: InputMaybe<Scalars['BigInt']['input']>;
  value_lte?: InputMaybe<Scalars['BigInt']['input']>;
  value_not?: InputMaybe<Scalars['BigInt']['input']>;
  value_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export type Expense_OrderBy =
  | 'baseFeePerGas'
  | 'cumulativeGasUsed'
  | 'from'
  | 'gasLimit'
  | 'gasPrice'
  | 'gasUsed'
  | 'id'
  | 'kind'
  | 'loanContract'
  | 'loanContract__actualRepaid'
  | 'loanContract__borrower'
  | 'loanContract__feePpm'
  | 'loanContract__id'
  | 'loanContract__isPackLoan'
  | 'loanContract__loanAmount'
  | 'loanContract__loanContract'
  | 'loanContract__recoupmentAmount'
  | 'loanContract__repaidAmount'
  | 'loanContract__status'
  | 'loanContract__timestamp'
  | 'loanContract__transactionHash'
  | 'timestamp'
  | 'totalCost'
  | 'transactionHash'
  | 'value';

export type InitializedFactory = {
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['Bytes']['output'];
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['Bytes']['output'];
  version: Scalars['BigInt']['output'];
};

export type InitializedFactory_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<InitializedFactory_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<InitializedFactory_Filter>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  version?: InputMaybe<Scalars['BigInt']['input']>;
  version_gt?: InputMaybe<Scalars['BigInt']['input']>;
  version_gte?: InputMaybe<Scalars['BigInt']['input']>;
  version_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  version_lt?: InputMaybe<Scalars['BigInt']['input']>;
  version_lte?: InputMaybe<Scalars['BigInt']['input']>;
  version_not?: InputMaybe<Scalars['BigInt']['input']>;
  version_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export type InitializedFactory_OrderBy =
  | 'blockNumber'
  | 'id'
  | 'timestamp'
  | 'transactionHash'
  | 'version';

export type InitializedLoan = {
  blockNumber: Scalars['BigInt']['output'];
  blockTimestamp: Scalars['BigInt']['output'];
  id: Scalars['Bytes']['output'];
  transactionHash: Scalars['Bytes']['output'];
  version: Scalars['BigInt']['output'];
};

export type InitializedLoan_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<InitializedLoan_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<InitializedLoan_Filter>>>;
  transactionHash?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  version?: InputMaybe<Scalars['BigInt']['input']>;
  version_gt?: InputMaybe<Scalars['BigInt']['input']>;
  version_gte?: InputMaybe<Scalars['BigInt']['input']>;
  version_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  version_lt?: InputMaybe<Scalars['BigInt']['input']>;
  version_lte?: InputMaybe<Scalars['BigInt']['input']>;
  version_not?: InputMaybe<Scalars['BigInt']['input']>;
  version_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export type InitializedLoan_OrderBy =
  | 'blockNumber'
  | 'blockTimestamp'
  | 'id'
  | 'transactionHash'
  | 'version';

export type LoanContract = {
  actualRepaid: Scalars['BigInt']['output'];
  borrower: Scalars['Bytes']['output'];
  collaterals: Array<LoanContractCollateral>;
  expenses: Array<Expense>;
  feePpm: Scalars['BigInt']['output'];
  id: Scalars['Bytes']['output'];
  isPackLoan: Scalars['Boolean']['output'];
  loanAmount: Scalars['BigInt']['output'];
  loanContract: Scalars['Bytes']['output'];
  loanRepaid?: Maybe<LoanRepaid>;
  recoupmentAmount: Scalars['BigInt']['output'];
  repaidAmount: Scalars['BigInt']['output'];
  status: LoanStatus;
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['Bytes']['output'];
};


export type LoanContractCollateralsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanContractCollateral_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<LoanContractCollateral_Filter>;
};


export type LoanContractExpensesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Expense_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Expense_Filter>;
};

export type LoanContractCollateral = {
  id: Scalars['Bytes']['output'];
  loanContract: LoanContract;
  tokenAddress: Scalars['Bytes']['output'];
  tokenAmount: Scalars['BigInt']['output'];
  tokenId: Scalars['BigInt']['output'];
};

export type LoanContractCollateral_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LoanContractCollateral_Filter>>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  loanContract?: InputMaybe<Scalars['String']['input']>;
  loanContract_?: InputMaybe<LoanContract_Filter>;
  loanContract_contains?: InputMaybe<Scalars['String']['input']>;
  loanContract_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_ends_with?: InputMaybe<Scalars['String']['input']>;
  loanContract_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_gt?: InputMaybe<Scalars['String']['input']>;
  loanContract_gte?: InputMaybe<Scalars['String']['input']>;
  loanContract_in?: InputMaybe<Array<Scalars['String']['input']>>;
  loanContract_lt?: InputMaybe<Scalars['String']['input']>;
  loanContract_lte?: InputMaybe<Scalars['String']['input']>;
  loanContract_not?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_contains?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  loanContract_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  loanContract_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  loanContract_starts_with?: InputMaybe<Scalars['String']['input']>;
  loanContract_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<LoanContractCollateral_Filter>>>;
  tokenAddress?: InputMaybe<Scalars['Bytes']['input']>;
  tokenAddress_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tokenAddress_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tokenAddress_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tokenAddress_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tokenAddress_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tokenAddress_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tokenAddress_not?: InputMaybe<Scalars['Bytes']['input']>;
  tokenAddress_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tokenAddress_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tokenAmount?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokenAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  tokenAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokenId?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokenId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export type LoanContractCollateral_OrderBy =
  | 'id'
  | 'loanContract'
  | 'loanContract__actualRepaid'
  | 'loanContract__borrower'
  | 'loanContract__feePpm'
  | 'loanContract__id'
  | 'loanContract__isPackLoan'
  | 'loanContract__loanAmount'
  | 'loanContract__loanContract'
  | 'loanContract__recoupmentAmount'
  | 'loanContract__repaidAmount'
  | 'loanContract__status'
  | 'loanContract__timestamp'
  | 'loanContract__transactionHash'
  | 'tokenAddress'
  | 'tokenAmount'
  | 'tokenId';

export type LoanContract_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  actualRepaid?: InputMaybe<Scalars['BigInt']['input']>;
  actualRepaid_gt?: InputMaybe<Scalars['BigInt']['input']>;
  actualRepaid_gte?: InputMaybe<Scalars['BigInt']['input']>;
  actualRepaid_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  actualRepaid_lt?: InputMaybe<Scalars['BigInt']['input']>;
  actualRepaid_lte?: InputMaybe<Scalars['BigInt']['input']>;
  actualRepaid_not?: InputMaybe<Scalars['BigInt']['input']>;
  actualRepaid_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<LoanContract_Filter>>>;
  borrower?: InputMaybe<Scalars['Bytes']['input']>;
  borrower_contains?: InputMaybe<Scalars['Bytes']['input']>;
  borrower_gt?: InputMaybe<Scalars['Bytes']['input']>;
  borrower_gte?: InputMaybe<Scalars['Bytes']['input']>;
  borrower_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  borrower_lt?: InputMaybe<Scalars['Bytes']['input']>;
  borrower_lte?: InputMaybe<Scalars['Bytes']['input']>;
  borrower_not?: InputMaybe<Scalars['Bytes']['input']>;
  borrower_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  borrower_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collaterals_?: InputMaybe<LoanContractCollateral_Filter>;
  expenses_?: InputMaybe<Expense_Filter>;
  feePpm?: InputMaybe<Scalars['BigInt']['input']>;
  feePpm_gt?: InputMaybe<Scalars['BigInt']['input']>;
  feePpm_gte?: InputMaybe<Scalars['BigInt']['input']>;
  feePpm_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  feePpm_lt?: InputMaybe<Scalars['BigInt']['input']>;
  feePpm_lte?: InputMaybe<Scalars['BigInt']['input']>;
  feePpm_not?: InputMaybe<Scalars['BigInt']['input']>;
  feePpm_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  isPackLoan?: InputMaybe<Scalars['Boolean']['input']>;
  isPackLoan_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isPackLoan_not?: InputMaybe<Scalars['Boolean']['input']>;
  isPackLoan_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  loanAmount?: InputMaybe<Scalars['BigInt']['input']>;
  loanAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  loanAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  loanAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  loanAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  loanAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  loanAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  loanAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  loanContract?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_contains?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_gt?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_gte?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  loanContract_lt?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_lte?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  loanRepaid?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_?: InputMaybe<LoanRepaid_Filter>;
  loanRepaid_contains?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_ends_with?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_gt?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_gte?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_in?: InputMaybe<Array<Scalars['String']['input']>>;
  loanRepaid_lt?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_lte?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_not?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_not_contains?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  loanRepaid_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_starts_with?: InputMaybe<Scalars['String']['input']>;
  loanRepaid_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<LoanContract_Filter>>>;
  recoupmentAmount?: InputMaybe<Scalars['BigInt']['input']>;
  recoupmentAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  recoupmentAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  recoupmentAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  recoupmentAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  recoupmentAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  recoupmentAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  recoupmentAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  repaidAmount?: InputMaybe<Scalars['BigInt']['input']>;
  repaidAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  repaidAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  repaidAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  repaidAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  repaidAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  repaidAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  repaidAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  status?: InputMaybe<LoanStatus>;
  status_in?: InputMaybe<Array<LoanStatus>>;
  status_not?: InputMaybe<LoanStatus>;
  status_not_in?: InputMaybe<Array<LoanStatus>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type LoanContract_OrderBy =
  | 'actualRepaid'
  | 'borrower'
  | 'collaterals'
  | 'expenses'
  | 'feePpm'
  | 'id'
  | 'isPackLoan'
  | 'loanAmount'
  | 'loanContract'
  | 'loanRepaid'
  | 'loanRepaid__id'
  | 'loanRepaid__loanContract'
  | 'loanRepaid__repaymentAmount'
  | 'loanRepaid__timestamp'
  | 'loanRepaid__transactionHash'
  | 'recoupmentAmount'
  | 'repaidAmount'
  | 'status'
  | 'timestamp'
  | 'transactionHash';

export type LoanPartialyRepaid = {
  id: Scalars['Bytes']['output'];
  loanContract: Scalars['Bytes']['output'];
  repaymentAmount: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['Bytes']['output'];
};

export type LoanPartialyRepaid_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LoanPartialyRepaid_Filter>>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  loanContract?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_contains?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_gt?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_gte?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  loanContract_lt?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_lte?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<LoanPartialyRepaid_Filter>>>;
  repaymentAmount?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  repaymentAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type LoanPartialyRepaid_OrderBy =
  | 'id'
  | 'loanContract'
  | 'repaymentAmount'
  | 'timestamp'
  | 'transactionHash';

export type LoanProvided = {
  id: Scalars['Bytes']['output'];
  lender: Scalars['Bytes']['output'];
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['Bytes']['output'];
};

export type LoanProvided_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LoanProvided_Filter>>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  lender?: InputMaybe<Scalars['Bytes']['input']>;
  lender_contains?: InputMaybe<Scalars['Bytes']['input']>;
  lender_gt?: InputMaybe<Scalars['Bytes']['input']>;
  lender_gte?: InputMaybe<Scalars['Bytes']['input']>;
  lender_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  lender_lt?: InputMaybe<Scalars['Bytes']['input']>;
  lender_lte?: InputMaybe<Scalars['Bytes']['input']>;
  lender_not?: InputMaybe<Scalars['Bytes']['input']>;
  lender_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  lender_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<LoanProvided_Filter>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type LoanProvided_OrderBy =
  | 'id'
  | 'lender'
  | 'timestamp'
  | 'transactionHash';

export type LoanRepaid = {
  id: Scalars['Bytes']['output'];
  loanContract: Scalars['Bytes']['output'];
  repaymentAmount: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['Bytes']['output'];
};

export type LoanRepaid_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LoanRepaid_Filter>>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  loanContract?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_contains?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_gt?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_gte?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  loanContract_lt?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_lte?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<LoanRepaid_Filter>>>;
  repaymentAmount?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  repaymentAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  repaymentAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type LoanRepaid_OrderBy =
  | 'id'
  | 'loanContract'
  | 'repaymentAmount'
  | 'timestamp'
  | 'transactionHash';

export type LoanRevoked = {
  id: Scalars['Bytes']['output'];
  loanContract: Scalars['Bytes']['output'];
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['Bytes']['output'];
};

export type LoanRevoked_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LoanRevoked_Filter>>>;
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  loanContract?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_contains?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_gt?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_gte?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  loanContract_lt?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_lte?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  loanContract_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<LoanRevoked_Filter>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  transactionHash?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_gte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  transactionHash_lt?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_lte?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  transactionHash_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type LoanRevoked_OrderBy =
  | 'id'
  | 'loanContract'
  | 'timestamp'
  | 'transactionHash';

export type LoanStatus =
  | 'Active'
  | 'Pending'
  | 'Recouped'
  | 'Revoked';

/** Defines the order direction, either ascending or descending */
export type OrderDirection =
  | 'asc'
  | 'desc';

export type Query = {
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  expense?: Maybe<Expense>;
  expenses: Array<Expense>;
  initializedFactories: Array<InitializedFactory>;
  initializedFactory?: Maybe<InitializedFactory>;
  initializedLoan?: Maybe<InitializedLoan>;
  initializedLoans: Array<InitializedLoan>;
  loanContract?: Maybe<LoanContract>;
  loanContractCollateral?: Maybe<LoanContractCollateral>;
  loanContractCollaterals: Array<LoanContractCollateral>;
  loanContracts: Array<LoanContract>;
  loanPartialyRepaid?: Maybe<LoanPartialyRepaid>;
  loanPartialyRepaids: Array<LoanPartialyRepaid>;
  loanProvided?: Maybe<LoanProvided>;
  loanProvideds: Array<LoanProvided>;
  loanRepaid?: Maybe<LoanRepaid>;
  loanRepaids: Array<LoanRepaid>;
  loanRevoked?: Maybe<LoanRevoked>;
  loanRevokeds: Array<LoanRevoked>;
  stats?: Maybe<Stats>;
  stats_collection: Array<Stats>;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type QueryExpenseArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryExpensesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Expense_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Expense_Filter>;
};


export type QueryInitializedFactoriesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InitializedFactory_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InitializedFactory_Filter>;
};


export type QueryInitializedFactoryArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryInitializedLoanArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryInitializedLoansArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InitializedLoan_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InitializedLoan_Filter>;
};


export type QueryLoanContractArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryLoanContractCollateralArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryLoanContractCollateralsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanContractCollateral_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanContractCollateral_Filter>;
};


export type QueryLoanContractsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanContract_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanContract_Filter>;
};


export type QueryLoanPartialyRepaidArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryLoanPartialyRepaidsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanPartialyRepaid_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanPartialyRepaid_Filter>;
};


export type QueryLoanProvidedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryLoanProvidedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanProvided_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanProvided_Filter>;
};


export type QueryLoanRepaidArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryLoanRepaidsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanRepaid_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanRepaid_Filter>;
};


export type QueryLoanRevokedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryLoanRevokedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanRevoked_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanRevoked_Filter>;
};


export type QueryStatsArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryStats_CollectionArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Stats_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Stats_Filter>;
};

export type Stats = {
  contractsCount: Scalars['BigInt']['output'];
  expensesCount: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
};

export type Stats_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Stats_Filter>>>;
  contractsCount?: InputMaybe<Scalars['BigInt']['input']>;
  contractsCount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  contractsCount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  contractsCount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  contractsCount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  contractsCount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  contractsCount_not?: InputMaybe<Scalars['BigInt']['input']>;
  contractsCount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  expensesCount?: InputMaybe<Scalars['BigInt']['input']>;
  expensesCount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  expensesCount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  expensesCount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  expensesCount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  expensesCount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  expensesCount_not?: InputMaybe<Scalars['BigInt']['input']>;
  expensesCount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_gt?: InputMaybe<Scalars['String']['input']>;
  id_gte?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_lt?: InputMaybe<Scalars['String']['input']>;
  id_lte?: InputMaybe<Scalars['String']['input']>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<Stats_Filter>>>;
};

export type Stats_OrderBy =
  | 'contractsCount'
  | 'expensesCount'
  | 'id';

export type _Block_ = {
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']['output']>;
  /** The block number */
  number: Scalars['Int']['output'];
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars['Bytes']['output']>;
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars['Int']['output']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String']['output'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']['output'];
};

export type _SubgraphErrorPolicy_ =
  /** Data will be returned even if the subgraph has indexing errors */
  | 'allow'
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  | 'deny';
