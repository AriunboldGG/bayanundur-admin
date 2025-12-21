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
    status?: "sent_offer" | "create_invoice" | "spent"
  }>
  status: "sent_offer" | "create_invoice" | "spent" | "pending"
  quoteStatus?: "new" | "pending" | "in_progress" | "completed" | "rejected" // Overall quote status
  createdAt: string
  updatedAt?: string
}

