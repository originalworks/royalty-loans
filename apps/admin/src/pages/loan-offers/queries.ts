import gql from 'graphql-tag';

// export const LOAN_FACTORIES_LIST_QUERY = gql`
//   query LoanFactoriesList {
//     initializedFactories {
//       id
//       version
//       blockNumber
//       timestamp
//       transactionHash
//     }
//   }
// `;
//
// export const LOAN_FACTORY_SHOW_QUERY = gql`
//   query LoanFactory($id: ID!) {
//     initializedFactory(id: $id) {
//       id
//       version
//       blockNumber
//       timestamp
//       transactionHash
//     }
//   }
// `;

export const LOAN_OFFERS_LIST_QUERY = gql`
  query LoanOffersList {
    loanContracts {
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
