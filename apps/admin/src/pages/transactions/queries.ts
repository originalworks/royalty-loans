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

export const TRANSACTIONS_LIST_QUERY = gql`
  query TransactionsList(
    $first: Int
    $skip: Int
    $loanContractAddress: String
    $orderBy: String
    $orderDirection: String
  ) {
    expenses(
      first: $first
      skip: $skip
      where: { loanContract_: { loanContract_contains: $loanContractAddress } }
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      loanContract {
        id
        collateralToken
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
        collateralToken
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
