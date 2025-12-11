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
    status?: "pending" | "approved" | "rejected"
  }>
  status: "pending" | "approved" | "rejected"
  isReviewed?: boolean // Track if quote has been reviewed (independent of product statuses)
  createdAt: string
  updatedAt?: string
}

