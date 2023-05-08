const braintreeQuery = `mutation tokenizeCreditCard($input: TokenizeCreditCardInput!) {
    tokenizeCreditCard(input: $input) {
      paymentMethod {
        id
        usage
        createdAt
        details {
          __typename
          ... on CreditCardDetails {
            cardholderName
            last4
            expirationMonth
            expirationYear
            brandCode
            billingAddress {
              fullName
              company
              addressLine1
              addressLine2
              adminArea1
              adminArea2
              postalCode
              countryCode
            }
          }
        }
        verifications {
          edges {
            node {
              status
            }
          }
        }
        customer {
          id
          email
          firstName
          lastName
        }
      }
    }
  }`;

  export {braintreeQuery}