import gql from 'graphql-tag';

export const STATISTICS_QUERY = gql`
  query Statistic($id: ID!) {
    stats(id: $id) {
      id
      contractsCount
      expensesCount
    }
  }
`;

export const LOAN_OFFERS_LIST_QUERY = gql`
  query LoanOffersList(
    $first: Int
    $skip: Int
    $orderBy: LoanContract_orderBy
    $orderDirection: OrderDirection
  ) {
    loanContracts(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      loanContract
      borrower
      isPackLoan
      collaterals {
        tokenAddress
        tokenId
        tokenAmount
      }
      loanAmount
      feePpm
      status
      timestamp
      transactionHash
      expenses {
        gasPrice
        totalCost
      }
    }
  }
`;

export const LOAN_OFFER_SHOW_QUERY = gql`
  query LoanOffer($id: ID!) {
    loanContract(id: $id) {
      id
      loanContract
      borrower
      isPackLoan
      collaterals {
        tokenAddress
        tokenId
        tokenAmount
      }
      loanAmount
      feePpm
      status
      timestamp
      transactionHash
      expenses {
        gasPrice
        totalCost
      }
    }
  }
`;

export const TRANSACTIONS_LIST_QUERY = gql`
  query TransactionsList(
    $first: Int
    $skip: Int
    $where: Expense_filter
    $orderBy: Expense_orderBy
    $orderDirection: OrderDirection
  ) {
    expenses(
      first: $first
      skip: $skip
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      loanContract {
        id
      }
      collaterals {
        tokenAddress
      }
      transactionHash
      kind
      baseFeePerGas
      gasLimit
      gasPrice
      gasUsed
      cumulativeGasUsed
      totalCost
      timestamp
    }
  }
`;

export const TRANSACTION_SHOW_QUERY = gql`
  query Transaction($id: ID!) {
    expense(id: $id) {
      id
      loanContract {
        id
      }
      collaterals {
        tokenAddress
      }
      transactionHash
      kind
      baseFeePerGas
      gasLimit
      gasPrice
      gasUsed
      cumulativeGasUsed
      totalCost
      timestamp
    }
  }
`;
