import * as api from "../../../fixtures/bhyve-apis/order-apis"
import { retInterface } from "../../../support/general-utils"
import { InputRequest } from "../../../support/general-utils"
import { PaymentCard } from "../../../types/payment-types"

describe('Testing for Modular Design', () => {
  const req: InputRequest = retInterface()
  let userAuth: string
  let posMenuId: number
  let orderId: string
  let totalCost: number
  let paymentToken: string
  let paymentNonce: string
  let orderNo: number

  it('Sign In (signInUser)', async () => {
    userAuth = await api.signInUser(req.username, req.password)
  })

  it('Get User Confirmation (getUser)', () => {
    api.getUser(userAuth)
  })

  it('Get Store (getStore)', () => {
    api.getStore(req.storeId)
  })

  it('Get Menu (getMenu)', async () => {
    posMenuId = await api.getMenu(req.storeId)
  })

  it('Create New Order for Registered User (createOrder)', async () => {
    let temp: string[] = await api.createOrder(req.additionalHours, userAuth, req.storeId, posMenuId, req.productId, req.productName)
    
    orderId = temp[0]
    totalCost = parseFloat(temp[1])
  })

  it('Get Payment Token From Braintree (getPaymentTokenFromBraintree)', async () => {
    paymentToken = await api.getPaymentTokenFromBraintree(orderId, userAuth)
  })

  it('Insert Mock Credit Card Details into GraphQL (insertMockCreditCardDetails)', async () => {
    paymentNonce = await api.insertMockCreditCardDetails()
  })

  it('Complete Checkout Order (createCheckout)', async () => {
    const pay: PaymentCard = {
      braintree: {
        nonce: paymentNonce,
        amount: totalCost,
        paymentToken: paymentToken,
        checkoutType: 0,
        storeCard: false
      }
    }
    
    orderNo = await api.createCheckout(orderId, userAuth, pay)
  })

  it('Confirm Order Has Been Placed (getOrders)', () => {
    api.getOrders(userAuth, orderNo)
  })
})