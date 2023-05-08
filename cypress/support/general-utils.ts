import input from "../fixtures/inputs.json"

export interface InputRequest {
    username: string
    password: string
    storeId: number
    productName: string
    productId: number
    additionalHours: number
    gygDollars: number
}

export function retInterface(): InputRequest {
    return input as InputRequest;
}