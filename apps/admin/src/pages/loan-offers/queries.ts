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
    $orderBy: String
    $orderDirection: String
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
      collateralToken
      collateralTokenId
      collateralAmount
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
      collateralToken
      collateralTokenId
      collateralAmount
      loanAmount
      feePpm
      status
      timestamp
      transactionHash
    }
  }
`;
