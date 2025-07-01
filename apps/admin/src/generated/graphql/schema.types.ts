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
  borrower: Scalars['Bytes']['output'];
  collateralAmount: Scalars['BigInt']['output'];
  collateralToken: Scalars['Bytes']['output'];
  collateralTokenId: Scalars['BigInt']['output'];
  feePpm: Scalars['BigInt']['output'];
  id: Scalars['Bytes']['output'];
  loanAmount: Scalars['BigInt']['output'];
  loanContract: Scalars['Bytes']['output'];
  status: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['Bytes']['output'];
};

export type LoanContract_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
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
  collateralAmount?: InputMaybe<Scalars['BigInt']['input']>;
  collateralAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateralAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralToken?: InputMaybe<Scalars['Bytes']['input']>;
  collateralTokenId?: InputMaybe<Scalars['BigInt']['input']>;
  collateralTokenId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralTokenId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralTokenId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralTokenId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collateralTokenId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collateralTokenId_not?: InputMaybe<Scalars['BigInt']['input']>;
  collateralTokenId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collateralToken_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_gt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_gte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  collateralToken_lt?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_lte?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_not?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  collateralToken_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
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
  or?: InputMaybe<Array<InputMaybe<LoanContract_Filter>>>;
  status?: InputMaybe<Scalars['String']['input']>;
  status_contains?: InputMaybe<Scalars['String']['input']>;
  status_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  status_ends_with?: InputMaybe<Scalars['String']['input']>;
  status_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  status_gt?: InputMaybe<Scalars['String']['input']>;
  status_gte?: InputMaybe<Scalars['String']['input']>;
  status_in?: InputMaybe<Array<Scalars['String']['input']>>;
  status_lt?: InputMaybe<Scalars['String']['input']>;
  status_lte?: InputMaybe<Scalars['String']['input']>;
  status_not?: InputMaybe<Scalars['String']['input']>;
  status_not_contains?: InputMaybe<Scalars['String']['input']>;
  status_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  status_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  status_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  status_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  status_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  status_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  status_starts_with?: InputMaybe<Scalars['String']['input']>;
  status_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
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
  | 'borrower'
  | 'collateralAmount'
  | 'collateralToken'
  | 'collateralTokenId'
  | 'feePpm'
  | 'id'
  | 'loanAmount'
  | 'loanContract'
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

/** Defines the order direction, either ascending or descending */
export type OrderDirection =
  | 'asc'
  | 'desc';

export type Query = {
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  initializedFactories: Array<InitializedFactory>;
  initializedFactory?: Maybe<InitializedFactory>;
  initializedLoan?: Maybe<InitializedLoan>;
  initializedLoans: Array<InitializedLoan>;
  loanContract?: Maybe<LoanContract>;
  loanContracts: Array<LoanContract>;
  loanPartialyRepaid?: Maybe<LoanPartialyRepaid>;
  loanPartialyRepaids: Array<LoanPartialyRepaid>;
  loanProvided?: Maybe<LoanProvided>;
  loanProvideds: Array<LoanProvided>;
  loanRepaid?: Maybe<LoanRepaid>;
  loanRepaids: Array<LoanRepaid>;
  loanRevoked?: Maybe<LoanRevoked>;
  loanRevokeds: Array<LoanRevoked>;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
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

export type Subscription = {
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  initializedFactories: Array<InitializedFactory>;
  initializedFactory?: Maybe<InitializedFactory>;
  initializedLoan?: Maybe<InitializedLoan>;
  initializedLoans: Array<InitializedLoan>;
  loanContract?: Maybe<LoanContract>;
  loanContracts: Array<LoanContract>;
  loanPartialyRepaid?: Maybe<LoanPartialyRepaid>;
  loanPartialyRepaids: Array<LoanPartialyRepaid>;
  loanProvided?: Maybe<LoanProvided>;
  loanProvideds: Array<LoanProvided>;
  loanRepaid?: Maybe<LoanRepaid>;
  loanRepaids: Array<LoanRepaid>;
  loanRevoked?: Maybe<LoanRevoked>;
  loanRevokeds: Array<LoanRevoked>;
};


export type Subscription_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type SubscriptionInitializedFactoriesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InitializedFactory_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InitializedFactory_Filter>;
};


export type SubscriptionInitializedFactoryArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionInitializedLoanArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionInitializedLoansArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<InitializedLoan_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<InitializedLoan_Filter>;
};


export type SubscriptionLoanContractArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionLoanContractsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanContract_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanContract_Filter>;
};


export type SubscriptionLoanPartialyRepaidArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionLoanPartialyRepaidsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanPartialyRepaid_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanPartialyRepaid_Filter>;
};


export type SubscriptionLoanProvidedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionLoanProvidedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanProvided_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanProvided_Filter>;
};


export type SubscriptionLoanRepaidArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionLoanRepaidsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanRepaid_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanRepaid_Filter>;
};


export type SubscriptionLoanRevokedArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type SubscriptionLoanRevokedsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LoanRevoked_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LoanRevoked_Filter>;
};

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
   *
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
