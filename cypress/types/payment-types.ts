export type PaymentCard = {
    braintree: {
        nonce: string,
        amount: number,
        paymentToken: string,
        checkoutType: 0,
        storeCard: false
    }
}

export type PaymentGYG = {
    gygDollar: {
        cardNumber: string,
        amount: number
    }
}

export type PaymentCardGYG = PaymentGYG & PaymentCard

export type PaymentRequest = PaymentCard | PaymentCardGYG | PaymentGYG;