export interface PriceQuote {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  additionalInfo: string
  position: string
  company: string
  selectedProducts: Array<{
    productId: string
    productName: string
    quantity?: number
  }>
  status: "pending" | "approved" | "rejected" | "sent"
  createdAt: string
  updatedAt?: string
}

