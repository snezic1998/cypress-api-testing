describe('template spec', () => {
  const storeID: any = 946
  const productName: any = "Slow Cooked Beef Burrito (Mild)"
  const productId: any = 50
  const time: any = 4
  let userAuth: any
  let userCard: any
  let posMenuId: any
  let orderId: any
  let totalCost: any
  let orderNo: any

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
    }).its('body').then((body) => {
      cy.wrap(body.cardNumber).as('cardNo')
    });

    cy.get('@cardNo').then((cardNo) => {
      userCard = cardNo
    })
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
    let currentTime: any = new Date()
    currentTime = currentTime.setHours(currentTime.getHours() + time)

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
          gygDollar: {
            cardNumber: userCard,
            amount: totalCost
          }
        }
      }
    }).should((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.order).to.have.property('orderNumber')
      expect(response.body.order).to.have.property('orderId')
    }).its('body').then((body) => {
      cy.wrap(body.order.orderNumber).as('orderNumber')
    });

    cy.get('@orderNumber').then((orderNumber) => {
      orderNo = orderNumber
    })
  })

  it('Confirm Order Has Been Placed (getOrders)', () => {
    cy.api({
      url: 'https://api-external.staging.apps.gyg.com.au/staging/orders',
      headers: {
        Authorization: userAuth
      },
      method: 'GET'
    }).should((response) => {
      expect(response.status).to.eq(200);
      expect(response.body[0].order.orderNumber).equal(orderNo)
    });
  })
})