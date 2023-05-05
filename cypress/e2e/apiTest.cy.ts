import {braintreeQuery} from "../fixtures/braintreeQuery"
import mockCreditCard from "../fixtures/mockCreditCard.json"

describe('template spec', () => {
  const storeID: any = 946
  const productName: any = "Slow Cooked Beef Burrito (Mild)"
  const productId: any = 50
  let userAuth: any
  let posMenuId: any
  let orderId: any
  let totalCost: any
  let paymentToken: any
  let paymentNonce: any

  it('Sign In (signInUser)', () => {
    cy.api("POST", "https://api-external.staging.apps.gyg.com.au/staging/auth/signin", {
      username: "sam.nezic@bilue.com.au",
      password: "Test1234"
    }).should((response) => {
      expect(response.status).to.eq(200);
    }).its('body').then((body) => {
      cy.wrap(body.accessToken).as('auth')
    })

    cy.get('@auth').then((auth) => {
      userAuth = auth
    })
  })

  it('Get User Confirmation (getUser)', () => {
    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/user',
      headers: {
        Authorization: userAuth
      },
      method: 'GET'
    }).should((response) => {
      expect(response.status).to.eq(200);
    });
  })

  it('Get Store (getStore)', () => {
    cy.api("GET", "https://api-external.staging.apps.gyg.com.au/staging/store/" + storeID).should((response) => {
      expect(response.status).to.eq(200);
    });
  })

  it('Get Menu (getMenu)', () => {
    cy.api("GET", "https://api-external.staging.apps.gyg.com.au/staging/menu/1/" + storeID).should((response) => {
      expect(response.status).to.eq(200);
    }).its('body').then((body) => {
      cy.wrap(body.menu.posMenuId).as('menuId')
    });

    cy.get('@menuId').then((menuId) => {
      posMenuId = menuId
    })
  })

  it('Create New Order for Registered User (createOrder)', () => {
    const currentTime: any = new Date()

    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/orders',
      headers: {
        Authorization: userAuth
      },
      method: 'POST',
      body: {
        storeId: storeID,
        collectionType: "PICKUP",
        posMenuId: posMenuId,
        pickUpTime: currentTime,
        basketItems: [{
          id: productId,
          name: productName,
          quantity: 1,
          removeModifiers: [],
          addModifiers: [],
          extraModifiers: []
        }],
        channelId: 1,
        type: 1,
        clientPlatformVersion: "AppiOS",
        clientVersion: "8.234"
      }
    }).should((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.basket.storeInvalidProducts).to.have.lengthOf(0)
    }).its('body').then((body) => {
      cy.wrap(body.orderId).as('orderNo')
      cy.wrap(body.basket.totalIncl).as('totalIncl')
    });

    cy.get('@orderNo').then((orderNo) => {
      orderId = orderNo
    })

    cy.get('@totalIncl').then((totalIncl) => {
      totalCost = totalIncl
    })
  })

  it('Get Payment Token From Braintree (getPaymentTokenFromBraintree)', () => {
    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/orders/' + orderId + '/accesstoken',
      headers: {
        Authorization: userAuth,
        "Cache-Control": "no-cache"
      },
      method: 'GET'
    }).should((response) => {
      expect(response.status).to.eq(200);
    }).its('body').then((body) => {
      cy.wrap(body.clientToken).as('clientToken')
    });

    cy.get('@clientToken').then((clientToken) => {
      paymentToken = clientToken
    })
  })

  it('Insert Mock Credit Card Details into GraphQL (insertMockCreditCardDetails)', () => {
    cy.api({
      url: 'https://payments.sandbox.braintree-api.com/graphql',
      headers: {
        Authorization: "Basic d3hxZ3pqZnRxZnhkcnBmczpkNjA5NWQ4Y2VhYTVjZjE2NWNiYzUxNDNmMDI5YTIzNw==",
        "Braintree-Version": "2019-01-01"
      },
      method: 'POST',
      body: {
        query: braintreeQuery,
        variables: mockCreditCard
      }
    }).should((response) => {
      expect(response.status).to.eq(200);
    }).its('body').then((body) => {
      cy.wrap(body.data.tokenizeCreditCard.paymentMethod.id).as('nonce')
    });

    cy.get('@nonce').then((nonce) => {
      paymentNonce = nonce
    })
  })

  it('Complete Checkout Order (createCheckout)', () => {
    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/orders/' + orderId + '/checkout',
      headers: {
        Authorization: userAuth
      },
      method: 'POST',
      body: {
        customer: {},
        payment: {
          braintree: {
            nonce: paymentNonce,
            amount: totalCost,
            paymentToken: paymentToken,
            checkoutType: 0,
            storeCard: false
          }
        }
      }
    }).should((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.order).to.have.property('orderNumber')
      expect(response.body.order).to.have.property('orderId')
    });
  })
})
//Test