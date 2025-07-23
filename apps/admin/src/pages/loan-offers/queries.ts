import gql from 'graphql-tag';

export const LOAN_OFFERS_LIST_QUERY = gql`
  query LoanOffersList($first: Int, $skip: Int) {
    loanContracts(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
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
