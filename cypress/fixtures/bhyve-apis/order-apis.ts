import { braintreeQuery } from "../braintree/braintreeQuery"
import * as PaymentType from "../../types/payment-types"
import mockCreditCard from "../braintree/mockCreditCard.json"

export async function signInUser(username: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cy.api("POST", "https://api-external.staging.apps.gyg.com.au/staging/auth/signin", {
      username: username,
      password: password
    }).should((response) => {
      expect(response.status).to.eq(200);
    }).its('body').then((body) => {
      cy.wrap(body.accessToken).as('auth')
      cy.get('@auth').then((auth) => {
        return resolve(auth.toString());
      })
    })
  })
}

export async function getUser(auth: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/user',
      headers: {
        Authorization: auth
      },
      method: 'GET'
    }).should((response) => {
      expect(response.status).to.eq(200);
    }).its('body').then((body) => {
      cy.wrap(body.cardNumber).as('cardNo')
      cy.get('@cardNo').then((cardNo) => {
        return resolve(cardNo.toString());
      })
    })
  })
}

export async function getStore(storeId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    cy.api("GET", "https://api-external.staging.apps.gyg.com.au/staging/store/" + storeId).should((response) => {
      expect(response.status).to.eq(200);
    })
  })
}

export async function getMenu(storeId: number): Promise<number> {
  return new Promise((resolve, reject) => {
    cy.api("GET", "https://api-external.staging.apps.gyg.com.au/staging/menu/1/" + storeId).should((response) => {
      expect(response.status).to.eq(200);
    }).its('body').then((body) => {
      cy.wrap(body.menu.posMenuId).as('menuId')
      cy.get('@menuId').then((menuId) => {
        return resolve(parseInt(menuId.toString()))
      })
    })
  })
}

export async function createOrder(additionalHours: number, auth: string, storeId: number, posMenuId: number, productId: number, productName: string): Promise<string[]> {
  let ret: string[] = new Array

  return new Promise((resolve, reject) => {
    let currentTime: any = new Date()
    if (additionalHours != 0)
      currentTime = currentTime.setHours(currentTime.getHours() + additionalHours)

    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/orders',
      headers: {
        Authorization: auth
      },
      method: 'POST',
      body: {
        storeId: storeId,
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
      cy.get('@orderNo').then((orderNo) => {
        ret.push(orderNo.toString())
        cy.get('@totalIncl').then((totalIncl) => {
          ret.push(totalIncl.toString())
          return resolve(ret)
        })
      })
    })
  })
}

export async function getPaymentTokenFromBraintree(orderId: string, auth: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/orders/' + orderId + '/accesstoken',
      headers: {
        Authorization: auth,
        "Cache-Control": "no-cache"
      },
      method: 'GET'
    }).should((response) => {
      expect(response.status).to.eq(200);
    }).its('body').then((body) => {
      cy.wrap(body.clientToken).as('clientToken')
      cy.get('@clientToken').then((clientToken) => {
        return resolve(clientToken.toString())
      })
    })
  })
}

export async function insertMockCreditCardDetails(): Promise<string> {
  return new Promise((resolve, reject) => {
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
      cy.get('@nonce').then((nonce) => {
        return resolve(nonce.toString())
      })
    })
  })
}

export async function createCheckout(orderId: string, auth: string, payment: PaymentType.PaymentRequest): Promise<number> {
  return new Promise((resolve, reject) => {
    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/orders/' + orderId + '/checkout',
      headers: {
        Authorization: auth
      },
      method: 'POST',
      body: {
        customer: {},
        payment: payment
      }
    }).should((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.order).to.have.property('orderNumber')
      expect(response.body.order).to.have.property('orderId')
    }).its('body').then((body) => {
      cy.wrap(body.order.orderNumber).as('orderNumber')
      cy.get('@orderNumber').then((orderNumber) => {
        return resolve(parseInt(orderNumber.toString()))
      })
    })
  })
}

export async function getOrders(auth: string, orderNo: number): Promise<string> {
  return new Promise((resolve, reject) => {
    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/orders',
      headers: {
        Authorization: auth
      },
      method: 'GET'
    }).should((response) => {
      expect(response.status).to.eq(200);
      expect(response.body[0].order.orderNumber).equal(orderNo)
    })
  })
}