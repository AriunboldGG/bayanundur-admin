"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, CheckCircle, XCircle, Download, FileDown, FileText, Trash2 } from "lucide-react"
import { PriceQuote } from "@/lib/types"
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType } from "docx"
import { saveAs } from "file-saver"

// Mock data removed - now fetching from Firebase

const statusColors = {
  sent_offer: "bg-blue-100 text-blue-800 border-blue-200",
  create_invoice: "bg-purple-100 text-purple-800 border-purple-200",
  spent: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels = {
  sent_offer: "Үнийн санал",
  create_invoice: "Нэхэмжлэл",
  spent: "Зарлагын баримт",
  pending: "Хүлээгдэж буй",
}

const stockStatusColors = {
  inStock: "bg-green-100 text-green-800 border-green-200",
  preOrder: "bg-orange-100 text-orange-800 border-orange-200",
}

const stockStatusLabels = {
  inStock: "Бэлэн байгаа",
  preOrder: "Захиалгаар",
}


export default function QuotesPage() {
  const [quotes, setQuotes] = useState<PriceQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<PriceQuote | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSendOfferDialogOpen, setIsSendOfferDialogOpen] = useState(false)
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false)
  const [isSpentDialogOpen, setIsSpentDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [invoicePrices, setInvoicePrices] = useState<Record<string, string>>({})
  const [invoiceQuantities, setInvoiceQuantities] = useState<Record<string, number>>({})
  const [invoiceDeliveryTimes, setInvoiceDeliveryTimes] = useState<Record<string, string>>({})
  const [invoiceNumber, setInvoiceNumber] = useState<string>("")
  const [invoiceDate, setInvoiceDate] = useState<string>("")
  const [spentPrices, setSpentPrices] = useState<Record<string, string>>({})
  const [spentQuantities, setSpentQuantities] = useState<Record<string, number>>({})
  const [spentDeliveryTimes, setSpentDeliveryTimes] = useState<Record<string, string>>({})
  const [spentNumber, setSpentNumber] = useState<string>("")
  const [spentDate, setSpentDate] = useState<string>("")
  const [selectedForSendOffer, setSelectedForSendOffer] = useState<Set<string>>(new Set())
  const [selectedForInvoice, setSelectedForInvoice] = useState<Set<string>>(new Set())
  const [selectedForSpent, setSelectedForSpent] = useState<Set<string>>(new Set())
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [quoteNumber, setQuoteNumber] = useState<string>("")
  const [quoteDate, setQuoteDate] = useState<string>("")
  const [companyNote, setCompanyNote] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("БАЯН ӨНДӨР ХХК")
  const [companyAddress, setCompanyAddress] = useState<string>("УБ хот, Хан-Уул дүүрэг, 20-р хороо, Чингисийн өргөн чөлөө, Мишээл сити оффис М1 тауэр, 11 давхарт, 1107, 1108 тоот")
  const [companyEmail, setCompanyEmail] = useState<string>("sales1@bayan-undur.mn")
  const [companyPhone, setCompanyPhone] = useState<string>("70118585")
  const [companyMobile, setCompanyMobile] = useState<string>("99080867")
  const [companyRegNumber, setCompanyRegNumber] = useState<string>("5332044")
  const [companyBankName, setCompanyBankName] = useState<string>("Худалдаа хөгжлийн банк")
  const [companyAccountNumber, setCompanyAccountNumber] = useState<string>("MN610004000 415148288")
  const [buyerRegNumber, setBuyerRegNumber] = useState<string>("")
  const [sendOfferQuantities, setSendOfferQuantities] = useState<Record<string, number>>({})
  const [sendOfferDeliveryTimes, setSendOfferDeliveryTimes] = useState<Record<string, string>>({})

  // Generate quote number when dialog opens
  useEffect(() => {
    if (isSendOfferDialogOpen && selectedQuote) {
      const currentDate = new Date().toISOString().split("T")[0]
      setQuoteDate(currentDate)
      
      // Initialize Компанийн тэмдэглэл and company info from saved data
      setCompanyName((selectedQuote as any).companyName || "БАЯН ӨНДӨР ХХК")
      setCompanyNote((selectedQuote as any).companyNote || "")
      setCompanyAddress((selectedQuote as any).companyAddress || "УБ хот, Хан-Уул дүүрэг, 20-р хороо, Чингисийн өргөн чөлөө, Мишээл сити оффис М1 тауэр, 11 давхарт, 1107, 1108 тоот")
      setCompanyEmail((selectedQuote as any).companyEmail || "sales1@bayan-undur.mn")
      setCompanyPhone((selectedQuote as any).companyPhone || "70118585")
      setCompanyMobile((selectedQuote as any).companyMobile || "99080867")
      setCompanyRegNumber((selectedQuote as any).companyRegNumber || "5332044")
      setCompanyBankName((selectedQuote as any).companyBankName || "Худалдаа хөгжлийн банк")
      setCompanyAccountNumber((selectedQuote as any).companyAccountNumber || "MN610004000 415148288")
      setBuyerRegNumber((selectedQuote as any).buyerRegNumber || "")
      
      // Initialize quantities and delivery times for selected products
      const initialQuantities: Record<string, number> = {}
      const initialDeliveryTimes: Record<string, string> = {}
      selectedQuote.selectedProducts
        .filter((product, index) => selectedForSendOffer.has(getProductKey(product, index)))
        .forEach((product, index) => {
          const productId = getProductKey(product, index)
          if (!productId) return
          initialQuantities[productId] = product.quantity || 0
          initialDeliveryTimes[productId] = (product as any).delivery_time || (product as any).deliveryTime || ""
        })
      setSendOfferQuantities(initialQuantities)
      setSendOfferDeliveryTimes(initialDeliveryTimes)
      
      // Generate quote number asynchronously
      let isMounted = true
      generateQuoteNumber(currentDate)
        .then((number) => {
          if (isMounted) {
            setQuoteNumber(number)
          }
        })
        .catch((error) => {
          console.error("Error generating quote number:", error)
          if (isMounted) {
            // Fallback: generate a simple number if API fails
            const year = new Date().getFullYear()
            const month = String(new Date().getMonth() + 1).padStart(2, '0')
            const day = String(new Date().getDate()).padStart(2, '0')
            setQuoteNumber(`BU-QT-${year}${month}${day}-001`)
          }
        })
      
      return () => {
        isMounted = false
      }
    } else if (!isSendOfferDialogOpen) {
      // Reset when dialog closes
      setQuoteNumber("")
      setQuoteDate("")
      setCompanyName("БАЯН ӨНДӨР ХХК")
      setCompanyNote("")
      setCompanyAddress("УБ хот, Хан-Уул дүүрэг, 20-р хороо, Чингисийн өргөн чөлөө, Мишээл сити оффис М1 тауэр, 11 давхарт, 1107, 1108 тоот")
      setCompanyEmail("sales1@bayan-undur.mn")
      setCompanyPhone("70118585")
      setCompanyMobile("99080867")
      setCompanyRegNumber("5332044")
      setCompanyBankName("Худалдаа хөгжлийн банк")
      setCompanyAccountNumber("MN610004000 415148288")
      setBuyerRegNumber("")
      setSendOfferQuantities({})
      setSendOfferDeliveryTimes({})
    }
  }, [isSendOfferDialogOpen, selectedQuote?.id])

  // Generate invoice number when invoice dialog opens
  useEffect(() => {
    if (isCreateInvoiceDialogOpen && selectedQuote) {
      const currentDate = new Date().toISOString().split("T")[0]
      setInvoiceDate(currentDate)

      // Initialize quantities and delivery times for selected products
      const initialQuantities: Record<string, number> = {}
      const initialDeliveryTimes: Record<string, string> = {}
      selectedQuote.selectedProducts
        .filter((product, index) => selectedForInvoice.has(getProductKey(product, index)))
        .forEach((product, index) => {
          const productId = getProductKey(product, index)
          if (!productId) return
          initialQuantities[productId] = product.quantity || 0
          initialDeliveryTimes[productId] = (product as any).delivery_time || (product as any).deliveryTime || ""
        })
      setInvoiceQuantities(initialQuantities)
      setInvoiceDeliveryTimes(initialDeliveryTimes)

      // Use saved invoice number/date if available, otherwise generate new
      const savedInvoiceNumber = (selectedQuote as any).invoiceNumber || ""
      const savedInvoiceDate = (selectedQuote as any).invoiceDate || ""
      if (savedInvoiceNumber) {
        setInvoiceNumber(savedInvoiceNumber)
      } else {
        generateInvoiceNumber(currentDate)
          .then((number) => setInvoiceNumber(number))
          .catch((error) => {
            console.error("Error generating invoice number:", error)
            const year = new Date().getFullYear()
            const month = String(new Date().getMonth() + 1).padStart(2, '0')
            const day = String(new Date().getDate()).padStart(2, '0')
            setInvoiceNumber(`BU-INV-${year}${month}${day}-001`)
          })
      }
      if (savedInvoiceDate) {
        setInvoiceDate(savedInvoiceDate)
      }
    } else if (!isCreateInvoiceDialogOpen) {
      setInvoiceNumber("")
      setInvoiceDate("")
      setInvoiceQuantities({})
      setInvoiceDeliveryTimes({})
    }
  }, [isCreateInvoiceDialogOpen, selectedQuote?.id])

  // Generate spent number when expense receipt dialog opens
  useEffect(() => {
    if (isSpentDialogOpen && selectedQuote) {
      const currentDate = new Date().toISOString().split("T")[0]
      setSpentDate(currentDate)

      // Initialize quantities and delivery times for selected products
      const initialQuantities: Record<string, number> = {}
      const initialDeliveryTimes: Record<string, string> = {}
      selectedQuote.selectedProducts
        .filter((product, index) => selectedForSpent.has(getProductKey(product, index)))
        .forEach((product, index) => {
          const productId = getProductKey(product, index)
          if (!productId) return
          initialQuantities[productId] = product.quantity || 0
          initialDeliveryTimes[productId] = (product as any).delivery_time || (product as any).deliveryTime || ""
        })
      setSpentQuantities(initialQuantities)
      setSpentDeliveryTimes(initialDeliveryTimes)

      // Use saved spent number/date if available, otherwise generate new
      const savedSpentNumber = (selectedQuote as any).spentNumber || ""
      const savedSpentDate = (selectedQuote as any).spentDate || ""
      if (savedSpentNumber) {
        setSpentNumber(savedSpentNumber)
      } else {
        generateSpentNumber(currentDate)
          .then((number) => setSpentNumber(number))
          .catch((error) => {
            console.error("Error generating spent number:", error)
            const year = new Date().getFullYear()
            const month = String(new Date().getMonth() + 1).padStart(2, '0')
            const day = String(new Date().getDate()).padStart(2, '0')
            setSpentNumber(`BU-EXP-${year}${month}${day}-001`)
          })
      }
      if (savedSpentDate) {
        setSpentDate(savedSpentDate)
      }
    } else if (!isSpentDialogOpen) {
      setSpentNumber("")
      setSpentDate("")
      setSpentQuantities({})
      setSpentDeliveryTimes({})
    }
  }, [isSpentDialogOpen, selectedQuote?.id])

  // Function to generate quote number in format: BU-QT-YYYYMMDD-XXX
  const generateQuoteNumber = async (quoteDate?: string): Promise<string> => {
    // Use provided date or current date
    const date = quoteDate ? new Date(quoteDate) : new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}` // YYYYMMDD format
    
    // Format: BU-QT-YYYYMMDD-XXX
    const prefix = `BU-QT-${dateStr}`
    
    try {
      // Fetch all quotes to check for existing quote numbers
      const response = await fetch("/api/quotes")
      const result = await response.json()
      
      if (result.success) {
        // Filter quotes that match the date pattern
        const sameDateQuotes = result.data.filter((quote: PriceQuote) => {
          // Check if quote has a quoteNumber field that matches our pattern
          const quoteNumber = (quote as any).quoteNumber || ""
          if (quoteNumber && quoteNumber.startsWith(prefix)) {
            return true
          }
          
          // Also check createdAt to see if it's the same date (for quotes without quoteNumber)
          if (quote.createdAt) {
            const quoteDate = new Date(quote.createdAt)
            const quoteYear = quoteDate.getFullYear()
            const quoteMonth = String(quoteDate.getMonth() + 1).padStart(2, '0')
            const quoteDay = String(quoteDate.getDate()).padStart(2, '0')
            const quoteDateStr = `${quoteYear}${quoteMonth}${quoteDay}`
            return quoteDateStr === dateStr
          }
          return false
        })
        
        // Find the highest sequential number for this date
        let maxNumber = 0
        sameDateQuotes.forEach((quote: PriceQuote) => {
          const quoteNumber = (quote as any).quoteNumber || ""
          if (quoteNumber && quoteNumber.startsWith(prefix)) {
            // Extract the sequential number (XXX part)
            const match = quoteNumber.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`))
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNumber) {
                maxNumber = num
              }
            }
          }
        })
        
        // Generate next number (padded to 3 digits)
        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        return `${prefix}-${nextNumber}`
      }
    } catch (error) {
      console.error("Error generating quote number:", error)
    }
    
    // Fallback: return with 001 if no quotes found for this date
    return `${prefix}-001`
  }

  // Function to generate invoice number in format: BU-INV-YYYYMMDD-XXX
  const generateInvoiceNumber = async (invoiceDate?: string): Promise<string> => {
    const date = invoiceDate ? new Date(invoiceDate) : new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    const prefix = `BU-INV-${dateStr}`

    try {
      const response = await fetch("/api/quotes")
      const result = await response.json()
      if (result.success) {
        const sameDateInvoices = result.data.filter((quote: PriceQuote) => {
          const existingNumber = (quote as any).invoiceNumber || ""
          if (existingNumber && existingNumber.startsWith(prefix)) {
            return true
          }
          if ((quote as any).invoiceDate) {
            const savedDate = new Date((quote as any).invoiceDate)
            const savedDateStr = `${savedDate.getFullYear()}${String(savedDate.getMonth() + 1).padStart(2, '0')}${String(savedDate.getDate()).padStart(2, '0')}`
            return savedDateStr === dateStr
          }
          return false
        })

        let maxNumber = 0
        sameDateInvoices.forEach((quote: PriceQuote) => {
          const existingNumber = (quote as any).invoiceNumber || ""
          if (existingNumber && existingNumber.startsWith(prefix)) {
            const match = existingNumber.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`))
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNumber) {
                maxNumber = num
              }
            }
          }
        })

        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        return `${prefix}-${nextNumber}`
      }
    } catch (error) {
      console.error("Error generating invoice number:", error)
    }

    return `${prefix}-001`
  }

  // Function to generate expense receipt number in format: BU-EXP-YYYYMMDD-XXX
  const generateSpentNumber = async (spentDateValue?: string): Promise<string> => {
    const date = spentDateValue ? new Date(spentDateValue) : new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`
    const prefix = `BU-EXP-${dateStr}`

    try {
      const response = await fetch("/api/quotes")
      const result = await response.json()
      if (result.success) {
        const sameDateSpent = result.data.filter((quote: PriceQuote) => {
          const existingNumber = (quote as any).spentNumber || ""
          if (existingNumber && existingNumber.startsWith(prefix)) {
            return true
          }
          if ((quote as any).spentDate) {
            const savedDate = new Date((quote as any).spentDate)
            const savedDateStr = `${savedDate.getFullYear()}${String(savedDate.getMonth() + 1).padStart(2, '0')}${String(savedDate.getDate()).padStart(2, '0')}`
            return savedDateStr === dateStr
          }
          return false
        })

        let maxNumber = 0
        sameDateSpent.forEach((quote: PriceQuote) => {
          const existingNumber = (quote as any).spentNumber || ""
          if (existingNumber && existingNumber.startsWith(prefix)) {
            const match = existingNumber.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`))
            if (match) {
              const num = parseInt(match[1], 10)
              if (num > maxNumber) {
                maxNumber = num
              }
            }
          }
        })

        const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
        return `${prefix}-${nextNumber}`
      }
    } catch (error) {
      console.error("Error generating spent number:", error)
    }

    return `${prefix}-001`
  }

  // Fetch quotes from Firebase
  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Build query params for date filtering
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      const url = `/api/quotes${params.toString() ? `?${params.toString()}` : ""}`
      const response = await fetch(url)
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMsg = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMsg = errorData.error
          }
        } catch {
          // If response is not JSON, use default message
        }
        throw new Error(errorMsg)
      }
      
      const result = await response.json()

      if (result.success) {
        setQuotes(result.data || [])
      } else {
        // Use the error message from the API as-is (it already includes helpful instructions)
        setError(result.error || "Failed to fetch quotes")
      }
    } catch (err: any) {
      console.error("Error fetching quotes:", err)
      let errorMsg = err?.message || "Failed to load quotes. Please try again."
      
      // Check if it's a Firebase configuration error first (most specific)
      if (err?.message?.includes("not initialized") || err?.message?.includes("Missing required") || err?.message?.includes("Firebase Admin") || err?.message?.includes("Firebase configuration")) {
        // Only add the message if it's not already included
        if (!err.message.includes(".env.local") && !err.message.includes("environment variables")) {
          const isProduction = process.env.NODE_ENV === "production";
          if (isProduction) {
            errorMsg = `${err.message} Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your deployment platform.`
          } else {
            errorMsg = `${err.message} Please add these to your .env.local file.`
          }
        } else {
          errorMsg = err.message
        }
      }
      // Check if it's a network connection error (fetch failed completely, not HTTP error status)
      // Network errors: TypeError (Failed to fetch), NetworkError, or fetch timeout
      // NOT HTTP error status codes (those are server errors, handled above)
      else if (err?.name === "TypeError" && err?.message?.includes("fetch")) {
        // This is a real network error - fetch couldn't reach the server
        errorMsg = "Unable to connect to the server. Please check your network connection and try again."
      }
      else if (err?.name === "NetworkError" || err?.message?.includes("NetworkError")) {
        errorMsg = "Unable to connect to the server. Please check your network connection and try again."
      }
      // HTTP error status codes (like 500) are server errors, not network errors
      // These should show the actual error message from the API
      else if (err?.message?.includes("HTTP error")) {
        // Keep the original error message which includes the API error details
        errorMsg = err.message
      }
      
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch quotes when date filters change (with debounce)
  useEffect(() => {
    // Skip initial load (already handled by first useEffect)
    if (quotes.length === 0 && isLoading) return

    const timer = setTimeout(() => {
      fetchQuotes()
      setSelectedQuotes(new Set()) // Clear selections when filters change
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const handleViewQuote = (quote: PriceQuote) => {
    setSelectedQuote(quote)
    setIsDialogOpen(true)
    // Initialize selections based on existing product statuses
    const sendOfferSet = new Set<string>()
    const invoiceSet = new Set<string>()
    const spentSet = new Set<string>()
    quote.selectedProducts.forEach((product, index) => {
      const productKey = getProductKey(product, index)
      if (!productKey) return
      const statusValue = product.status || (product as any).status_type || "pending"
      if (["sent_offer", "create_invoice", "spent"].includes(statusValue)) {
        sendOfferSet.add(productKey)
      }
      if (["create_invoice", "spent"].includes(statusValue)) {
        invoiceSet.add(productKey)
      }
      if (statusValue === "spent") {
        spentSet.add(productKey)
      }
    })
    setSelectedForSendOffer(sendOfferSet)
    setSelectedForInvoice(invoiceSet)
    setSelectedForSpent(spentSet)
  }

  // Calculate overall quote status based on product statuses
  const calculateQuoteStatus = (products: PriceQuote["selectedProducts"]): PriceQuote["status"] => {
    if (products.length === 0) return "pending"
    
    // If all products are spent, quote is spent
    const allSpent = products.every((p) => p.status === "spent")
    if (allSpent) return "spent"
    
    // If all products are at create_invoice or spent, quote is create_invoice
    const allInvoiceOrSpent = products.every((p) => p.status === "create_invoice" || p.status === "spent")
    if (allInvoiceOrSpent) return "create_invoice"
    
    // If any product has a status, use sent_offer
    const hasStatus = products.some((p) => p.status)
    if (hasStatus) return "sent_offer"
    
    return "pending"
  }

  const quoteStatusColors = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    pending: "bg-orange-100 text-orange-800 border-orange-200",
    in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  }

  const quoteStatusLabels = {
    new: "New",
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected",
  }

  // Get display status for main table
  const getDisplayStatus = (quote: PriceQuote): { label: string; color: string } => {
    const status = quote.quoteStatus || "new"
    return {
      label: quoteStatusLabels[status],
      color: quoteStatusColors[status],
    }
  }

  const getProductKey = (product: any, index?: number): string => {
    const key =
      product?.productId ??
      product?.id ??
      product?.product_id ??
      (index !== undefined ? `product-${index}` : "")
    return key ? String(key) : ""
  }

  const toNumber = (value: any): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0
    }
    const parsed = parseFloat(String(value))
    return Number.isFinite(parsed) ? parsed : 0
  }

  const handleProductStatusChange = async (
    quoteId: string,
    productId: string,
    newStatus: "sent_offer" | "create_invoice" | "spent"
  ): Promise<void> => {
    try {
      // Find the quote and update the product status
      const quote = quotes.find(q => q.id === quoteId)
      if (!quote) {
        throw new Error("Quote not found")
      }

      const updatedProducts = quote.selectedProducts.map((product, index) => {
        const resolvedProductId = getProductKey(product, index)
        if (!resolvedProductId) return product
        return resolvedProductId === productId
          ? { ...product, productId: resolvedProductId, status: newStatus, status_type: newStatus }
          : { ...product, productId: resolvedProductId }
      })
      const newQuoteStatus = calculateQuoteStatus(updatedProducts)

      // Save to Firebase
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedProducts: updatedProducts,
          status: newQuoteStatus,
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Update local state
        setQuotes(
          quotes.map((q) => {
            if (q.id === quoteId) {
              return result.data
            }
            return q
          })
        )
        
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote(result.data)
        }
      } else {
        throw new Error(result.error || "Failed to update product status")
      }
    } catch (err: any) {
      console.error("Error updating product status:", err)
      alert("Failed to update product status. Please try again.")
      throw err // Re-throw to allow Promise.all to handle errors
    }
  }

  const handleQuoteStatusChange = async (quoteId: string, newStatus: "new" | "pending" | "in_progress" | "completed" | "rejected") => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteStatus: newStatus }),
      })

      const result = await response.json()
      if (result.success) {
        // Update local state
        setQuotes(
          quotes.map((quote) => {
            if (quote.id === quoteId) {
              return result.data
            }
            return quote
          })
        )
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote(result.data)
        }
      } else {
        alert(result.error || "Failed to update quote status")
      }
    } catch (err: any) {
      console.error("Error updating quote status:", err)
      alert("Failed to update quote status. Please try again.")
    }
  }

  const formatDate = (dateString: string | Date | any) => {
    if (!dateString) return "Огноо байхгүй"
    
    try {
      let date: Date
      
      // Handle Firestore Timestamp objects
      if (dateString && typeof dateString === 'object' && dateString.toDate) {
        date = dateString.toDate()
      } 
      // Handle Firestore Timestamp with seconds/nanoseconds
      else if (dateString && typeof dateString === 'object' && dateString.seconds) {
        date = new Date(dateString.seconds * 1000)
      }
      // Handle string dates
      else if (typeof dateString === 'string') {
        date = new Date(dateString)
      }
      // Handle Date objects
      else if (dateString instanceof Date) {
        date = dateString
      }
      else {
        date = new Date(dateString)
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Огноо буруу"
      }
      
      return date.toLocaleString("mn-MN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error, dateString)
      return "Огноо буруу"
    }
  }

  // Generate Татаж авах document for Send Offer
  const handleDownloadSendOfferWord = async () => {
    if (!selectedQuote) return

    const selectedProducts = selectedQuote.selectedProducts.filter(
      (product, index) => selectedForSendOffer.has(getProductKey(product, index))
    )

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "Үнийн санал илгээх форм",
            heading: "Heading1",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Үнийн саналын дугаар: ", bold: true }),
              new TextRun({ text: quoteNumber || `BU-QT-${new Date().toISOString().split("T")[0]}-001` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Огноо: ", bold: true }),
              new TextRun({ text: quoteDate ? formatDate(quoteDate) : formatDate(selectedQuote.createdAt) }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Худалдан авагчийн нэр: ", bold: true }),
              new TextRun({ text: `${selectedQuote.firstName} ${selectedQuote.lastName}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Албан тушаал: ", bold: true }),
              new TextRun({ text: selectedQuote.position || "-" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Компани: ", bold: true }),
              new TextRun({ text: selectedQuote.company }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Регистерийн №: ", bold: true }),
              new TextRun({ text: buyerRegNumber || "-" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Нэмэлт мэдээлэл: ", bold: true }),
              new TextRun({ text: selectedQuote.additionalInfo || "" }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Үнийн санал илгээгч компанийн мэдээлэл",
            heading: "Heading2",
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Компанийн нэр: ", bold: true }),
              new TextRun({ text: companyName }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Регистерийн №: ", bold: true }),
              new TextRun({ text: companyRegNumber }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Хаяг: ", bold: true }),
              new TextRun({ text: companyAddress }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Email: ", bold: true }),
              new TextRun({ text: companyEmail }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Утас, Факс: ", bold: true }),
              new TextRun({ text: companyPhone }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Гар утас: ", bold: true }),
              new TextRun({ text: companyMobile }),
            ],
          }),
          ...(companyNote ? [new Paragraph({
            children: [
              new TextRun({ text: "Компанийн тэмдэглэл: ", bold: true }),
              new TextRun({ text: companyNote }),
            ],
          })] : []),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Сонгосон бараа",
            heading: "Heading2",
          }),
          new DocxTable({
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph("№")] }),
                  new DocxTableCell({ children: [new Paragraph("Гүйлгээний утга")] }),
                  new DocxTableCell({ children: [new Paragraph("Код")] }),
                  new DocxTableCell({ children: [new Paragraph("Хэмжих нэгж")] }),
                  new DocxTableCell({ children: [new Paragraph("Тоо")] }),
                  new DocxTableCell({ children: [new Paragraph("Барааны төлөв")] }),
                  new DocxTableCell({ children: [new Paragraph("Нийлүүлэх хугацаа")] }),
                  new DocxTableCell({ children: [new Paragraph("Нэгжийн үнэ")] }),
                  new DocxTableCell({ children: [new Paragraph("Нийт дүн(НӨАТ орсон)")] }),
                ],
              }),
              ...selectedProducts.map((product, index) => {
                const productId = getProductKey(product, index)
                const unitPrice = (product as any).price || (product as any).priceNum || 0
                const quantity = sendOfferQuantities[productId] !== undefined 
                  ? sendOfferQuantities[productId] 
                  : (product.quantity || 0)
                const total = unitPrice * quantity
                const productCode = (product as any).product_code || (product as any).productCode || ""
                const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                const deliveryTime = sendOfferDeliveryTimes[productId] !== undefined 
                  ? sendOfferDeliveryTimes[productId] 
                  : ((product as any).delivery_time || (product as any).deliveryTime || "")
                const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                const statusLabel = stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock
                
                // Format delivery time date if it exists
                let deliveryTimeDisplay = "-"
                if (deliveryTime) {
                  try {
                    const date = new Date(deliveryTime)
                    if (!isNaN(date.getTime())) {
                      deliveryTimeDisplay = date.toLocaleDateString("mn-MN")
                    } else {
                      deliveryTimeDisplay = deliveryTime
                    }
                  } catch {
                    deliveryTimeDisplay = deliveryTime
                  }
                }
                
                return new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph(String(index + 1))] }),
                    new DocxTableCell({ children: [new Paragraph(transactionDescription)] }),
                    new DocxTableCell({ children: [new Paragraph(productCode || "-")] }),
                    new DocxTableCell({ children: [new Paragraph(unitOfMeasurement)] }),
                    new DocxTableCell({ children: [new Paragraph(String(quantity))] }),
                    new DocxTableCell({ children: [new Paragraph(statusLabel)] }),
                    new DocxTableCell({ children: [new Paragraph(deliveryTimeDisplay)] }),
                    new DocxTableCell({ children: [new Paragraph(String(unitPrice))] }),
                    new DocxTableCell({ children: [new Paragraph(String(total))] }),
                  ],
                })
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          // Stamp and Signature Section
          new DocxTable({
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Тэмдэг: ", bold: true }),
                      ],
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Нягтлан бодогч: ", bold: true }),
                        new TextRun({ text: "_________________ / _________________ / _________________" }),
                      ],
                    })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const fileDate = quoteDate || new Date().toISOString().split("T")[0]
    const fileQuoteNumber = quoteNumber || selectedQuote.id
    saveAs(blob, `Send offer - ${fileQuoteNumber} - ${fileDate}.docx`)
  }

  // Generate Татаж авах document for Invoice
  const handleDownloadInvoiceWord = async () => {
    if (!selectedQuote) return

    const selectedProducts = selectedQuote.selectedProducts.filter(
        (product, index) => selectedForInvoice.has(getProductKey(product, index))
      )

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "НЭХЭМЖЛЭЛ ",
            heading: "Heading1",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Нэхэмжлэлийн дугаар: ", bold: true }),
              new TextRun({ text: invoiceNumber || `BU-INV-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-001` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Огноо: ", bold: true }),
              new TextRun({ text: invoiceDate ? formatDate(invoiceDate) : formatDate(selectedQuote.createdAt) }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Худалдан авагчийн нэр: ", bold: true }),
              new TextRun({ text: `${selectedQuote.firstName} ${selectedQuote.lastName}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Албан тушаал: ", bold: true }),
              new TextRun({ text: selectedQuote.position || "-" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Компани: ", bold: true }),
              new TextRun({ text: selectedQuote.company }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Регистерийн №: ", bold: true }),
              new TextRun({ text: buyerRegNumber || "-" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Нэмэлт мэдээлэл: ", bold: true }),
              new TextRun({ text: selectedQuote.additionalInfo || "" }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Нэхэмжлэл илгээгч компанийн мэдээлэл",
            heading: "Heading2",
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Компанийн нэр: ", bold: true }),
              new TextRun({ text: companyName }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Регистерийн №: ", bold: true }),
              new TextRun({ text: companyRegNumber }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Банкны нэр: ", bold: true }),
              new TextRun({ text: companyBankName }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Дансны дугаар: ", bold: true }),
              new TextRun({ text: companyAccountNumber }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Хаяг: ", bold: true }),
              new TextRun({ text: companyAddress }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Email: ", bold: true }),
              new TextRun({ text: companyEmail }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Утас, Факс: ", bold: true }),
              new TextRun({ text: companyPhone }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Гар утас: ", bold: true }),
              new TextRun({ text: companyMobile }),
            ],
          }),
          ...(companyNote ? [new Paragraph({
            children: [
              new TextRun({ text: "Компанийн тэмдэглэл: ", bold: true }),
              new TextRun({ text: companyNote }),
            ],
          })] : []),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Сонгосон бараа",
            heading: "Heading2",
          }),
          new DocxTable({
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph("№")] }),
                  new DocxTableCell({ children: [new Paragraph("Гүйлгээний утга")] }),
                  new DocxTableCell({ children: [new Paragraph("Код")] }),
                  new DocxTableCell({ children: [new Paragraph("Хэмжих нэгж")] }),
                  new DocxTableCell({ children: [new Paragraph("Тоо")] }),
                  new DocxTableCell({ children: [new Paragraph("Барааны төлөв")] }),
                  new DocxTableCell({ children: [new Paragraph("Нийлүүлэх хугацаа")] }),
                  new DocxTableCell({ children: [new Paragraph("Нэгжийн үнэ")] }),
                  new DocxTableCell({ children: [new Paragraph("Нийт дүн(НӨАТ орсон)")] }),
                ],
              }),
              ...selectedProducts.map((product, index) => {
                const productId = getProductKey(product, index)
                const fallbackPrice = (product as any).price || (product as any).priceNum || 0
                const unitPrice = parseFloat(invoicePrices[productId] || String(fallbackPrice)) || 0
                const quantity = invoiceQuantities[productId] !== undefined 
                  ? invoiceQuantities[productId] 
                  : (product.quantity || 0)
                const total = unitPrice * quantity
                const productCode = (product as any).product_code || (product as any).productCode || ""
                const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                const deliveryTime = invoiceDeliveryTimes[productId] !== undefined
                  ? invoiceDeliveryTimes[productId]
                  : ((product as any).delivery_time || (product as any).deliveryTime || "")
                const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                const statusLabel = stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock
                
                // Format delivery time date if it exists
                let deliveryTimeDisplay = "-"
                if (deliveryTime) {
                  try {
                    const date = new Date(deliveryTime)
                    if (!isNaN(date.getTime())) {
                      deliveryTimeDisplay = date.toLocaleDateString("mn-MN")
                    } else {
                      deliveryTimeDisplay = deliveryTime
                    }
                  } catch {
                    deliveryTimeDisplay = deliveryTime
                  }
                }
                
                return new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph(String(index + 1))] }),
                    new DocxTableCell({ children: [new Paragraph(transactionDescription)] }),
                    new DocxTableCell({ children: [new Paragraph(productCode || "-")] }),
                    new DocxTableCell({ children: [new Paragraph(unitOfMeasurement)] }),
                    new DocxTableCell({ children: [new Paragraph(String(quantity))] }),
                    new DocxTableCell({ children: [new Paragraph(statusLabel)] }),
                    new DocxTableCell({ children: [new Paragraph(deliveryTimeDisplay)] }),
                    new DocxTableCell({ children: [new Paragraph(String(unitPrice))] }),
                    new DocxTableCell({ children: [new Paragraph(String(total))] }),
                  ],
                })
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          // Stamp and Signature Section
          new DocxTable({
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Тэмдэг: ", bold: true }),
                      ],
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Нягтлан бодогч: ", bold: true }),
                        new TextRun({ text: "_________________ / _________________ / _________________" }),
                      ],
                    })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const fileDate = invoiceDate || new Date().toISOString().split("T")[0]
    const fileInvoiceNumber = invoiceNumber || `BU-INV-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-001`
    saveAs(blob, `Invoice - ${fileInvoiceNumber} - ${fileDate}.docx`)
  }

  // Generate Татаж авах document for Зарлагын баримт/Expense Receipt
  const handleDownloadSpentWord = async () => {
    if (!selectedQuote) return

    const selectedProducts = selectedQuote.selectedProducts.filter(
      (product, index) => selectedForSpent.has(getProductKey(product, index))
    )

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "ЗАРЛАГЫН БАРИМТ",
            heading: "Heading1",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Зарлагын баримтын дугаар: ", bold: true }),
              new TextRun({ text: spentNumber || `BU-EXP-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-001` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Огноо: ", bold: true }),
              new TextRun({ text: spentDate ? formatDate(spentDate) : formatDate(selectedQuote.createdAt) }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Худалдан авагчийн нэр: ", bold: true }),
              new TextRun({ text: `${selectedQuote.firstName} ${selectedQuote.lastName}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Албан тушаал: ", bold: true }),
              new TextRun({ text: selectedQuote.position || "-" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Компани: ", bold: true }),
              new TextRun({ text: selectedQuote.company }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Регистерийн №: ", bold: true }),
              new TextRun({ text: buyerRegNumber || "-" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Нэмэлт мэдээлэл: ", bold: true }),
              new TextRun({ text: selectedQuote.additionalInfo || "" }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Зарлагын баримт илгээгч компанийн мэдээлэл",
            heading: "Heading2",
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Компанийн нэр: ", bold: true }),
              new TextRun({ text: companyName }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Регистерийн №: ", bold: true }),
              new TextRun({ text: companyRegNumber }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Хаяг: ", bold: true }),
              new TextRun({ text: companyAddress }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Email: ", bold: true }),
              new TextRun({ text: companyEmail }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Утас, Факс: ", bold: true }),
              new TextRun({ text: companyPhone }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Гар утас: ", bold: true }),
              new TextRun({ text: companyMobile }),
            ],
          }),
          ...(companyNote ? [new Paragraph({
            children: [
              new TextRun({ text: "Компанийн тэмдэглэл: ", bold: true }),
              new TextRun({ text: companyNote }),
            ],
          })] : []),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Сонгосон бараа",
            heading: "Heading2",
          }),
          new DocxTable({
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph("№")] }),
                  new DocxTableCell({ children: [new Paragraph("Гүйлгээний утга")] }),
                  new DocxTableCell({ children: [new Paragraph("Код")] }),
                  new DocxTableCell({ children: [new Paragraph("Хэмжих нэгж")] }),
                  new DocxTableCell({ children: [new Paragraph("Тоо")] }),
                  new DocxTableCell({ children: [new Paragraph("Барааны төлөв")] }),
                  new DocxTableCell({ children: [new Paragraph("Нийлүүлэх хугацаа")] }),
                  new DocxTableCell({ children: [new Paragraph("Нэгжийн үнэ")] }),
                  new DocxTableCell({ children: [new Paragraph("Нийт дүн(НӨАТ орсон)")] }),
                ],
              }),
              ...selectedProducts.map((product, index) => {
                const productId = getProductKey(product, index)
                const fallbackPrice = (product as any).price || (product as any).priceNum || 0
                const unitPrice = parseFloat(spentPrices[productId] || String(fallbackPrice)) || 0
                const quantity = spentQuantities[productId] !== undefined 
                  ? spentQuantities[productId] 
                  : (product.quantity || 0)
                const total = unitPrice * quantity
                const productCode = (product as any).product_code || (product as any).productCode || ""
                const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                const deliveryTime = spentDeliveryTimes[productId] !== undefined
                  ? spentDeliveryTimes[productId]
                  : ((product as any).delivery_time || (product as any).deliveryTime || "")
                const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                const statusLabel = stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock
                
                // Format delivery time date if it exists
                let deliveryTimeDisplay = "-"
                if (deliveryTime) {
                  try {
                    const date = new Date(deliveryTime)
                    if (!isNaN(date.getTime())) {
                      deliveryTimeDisplay = date.toLocaleDateString("mn-MN")
                    } else {
                      deliveryTimeDisplay = deliveryTime
                    }
                  } catch {
                    deliveryTimeDisplay = deliveryTime
                  }
                }
                
                return new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph(String(index + 1))] }),
                    new DocxTableCell({ children: [new Paragraph(transactionDescription)] }),
                    new DocxTableCell({ children: [new Paragraph(productCode || "-")] }),
                    new DocxTableCell({ children: [new Paragraph(unitOfMeasurement)] }),
                    new DocxTableCell({ children: [new Paragraph(String(quantity))] }),
                    new DocxTableCell({ children: [new Paragraph(statusLabel)] }),
                    new DocxTableCell({ children: [new Paragraph(deliveryTimeDisplay)] }),
                    new DocxTableCell({ children: [new Paragraph(String(unitPrice))] }),
                    new DocxTableCell({ children: [new Paragraph(String(total))] }),
                  ],
                })
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Нэмэлт мэдээлэл: ", bold: true }),
              new TextRun({ text: selectedQuote.additionalInfo || "" }),
            ],
          }),
          ...(companyNote ? [new Paragraph({
            children: [
              new TextRun({ text: "Компанийн тэмдэглэл: ", bold: true }),
              new TextRun({ text: companyNote }),
            ],
          })] : []),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          // Stamp and Signature Section
          new DocxTable({
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Тэмдэг: ", bold: true }),
                      ],
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new DocxTableCell({
                    children: [new Paragraph({
                      children: [
                        new TextRun({ text: "Нягтлан бодогч: ", bold: true }),
                        new TextRun({ text: "_________________ / _________________ / _________________" }),
                      ],
                    })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const fileDate = spentDate || new Date().toISOString().split("T")[0]
    const fileSpentNumber = spentNumber || `BU-EXP-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-001`
    saveAs(blob, `Expense Receipt - ${fileSpentNumber} - ${fileDate}.docx`)
  }

  // Filter quotes by date range (client-side fallback if server-side filtering fails)
  const getFilteredQuotes = (): PriceQuote[] => {
    if (!startDate && !endDate) {
      return quotes
    }
    
    return quotes.filter((quote) => {
      try {
        // Parse quote date - handle various formats
        let quoteDate: Date
        const createdAt = quote.createdAt as any // Use 'as any' to handle different possible types
        
        if (createdAt) {
          if (typeof createdAt === 'string') {
            quoteDate = new Date(createdAt)
          } else if (createdAt instanceof Date) {
            quoteDate = createdAt
          } else if (createdAt.toDate && typeof createdAt.toDate === 'function') {
            quoteDate = createdAt.toDate()
          } else if (createdAt.seconds) {
            quoteDate = new Date(createdAt.seconds * 1000)
          } else {
            quoteDate = new Date(createdAt)
          }
        } else {
          return false // Skip quotes without createdAt
        }
        
        // Check if date is valid
        if (isNaN(quoteDate.getTime())) {
          return false
        }
        
        // Normalize to date only (remove time)
        const quoteDateOnly = new Date(quoteDate.getFullYear(), quoteDate.getMonth(), quoteDate.getDate())
        
        if (startDate && endDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return quoteDateOnly >= start && quoteDateOnly <= end
        } else if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          return quoteDateOnly >= start
        } else if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          return quoteDateOnly <= end
        }
        
        return true
      } catch (error) {
        console.error("Error filtering quote by date:", error, quote)
        return false
      }
    })
  }

  const filteredQuotes = getFilteredQuotes()

  // Select all functionality
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuotes(new Set(filteredQuotes.map(q => q.id)))
    } else {
      setSelectedQuotes(new Set())
    }
  }

  const handleSelectQuote = (quoteId: string, checked: boolean) => {
    const newSet = new Set(selectedQuotes)
    if (checked) {
      newSet.add(quoteId)
    } else {
      newSet.delete(quoteId)
    }
    setSelectedQuotes(newSet)
  }

  const handleDeleteSelected = async () => {
    if (selectedQuotes.size === 0) return

    if (!confirm(`Та ${selectedQuotes.size} үнийн саналыг устгахдаа итгэлтэй байна уу?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedQuotes).map(id =>
        fetch(`/api/quotes/${id}`, { method: "DELETE" })
      )
      
      const results = await Promise.allSettled(deletePromises)
      const failed = results.filter(r => r.status === "rejected" || !r.value.ok)
      
      if (failed.length > 0) {
        alert(`Зарим үнийн саналыг устгахад алдаа гарлаа. ${failed.length} алдаатай.`)
      } else {
        setSelectedQuotes(new Set())
        await fetchQuotes()
      }
    } catch (error) {
      console.error("Error deleting quotes:", error)
      alert("Үнийн саналыг устгахад алдаа гарлаа.")
    } finally {
      setIsDeleting(false)
    }
  }

  const isAllSelected = filteredQuotes.length > 0 && selectedQuotes.size === filteredQuotes.length
  const isIndeterminate = selectedQuotes.size > 0 && selectedQuotes.size < filteredQuotes.length

  const handleDownloadExcel = async () => {
    // Dynamically import xlsx to avoid SSR issues
    const XLSX = await import("xlsx")

    // Prepare data for Excel export (use filtered quotes)
    const excelData = filteredQuotes.map((quote) => {
      const products = quote.selectedProducts
        .map((p) => `${p.productName} (${p.quantity || "N/A"})`)
        .join("; ")

      return {
        "Огноо": formatDate(quote.createdAt),
        "Нэр": quote.firstName,
        "Овог": quote.lastName,
        "И-мэйл": quote.email,
        "Утас": quote.phone,
        "Албан тушаал": quote.position,
        "Компани": quote.company,
        "Нэмэлт мэдээлэл": quote.additionalInfo,
        "Сонгосон бараа": products,
        "Барааны тоо": (quote.selectedProducts || []).length,
        "Төлөв": statusLabels[quote.status] || statusLabels.pending,
        "Шинэчлэгдсэн огноо": quote.updatedAt
          ? formatDate(quote.updatedAt)
          : "",
      }
    })

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Үнийн санал")

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Огноо
      { wch: 15 }, // Нэр
      { wch: 15 }, // Овог
      { wch: 25 }, // И-мэйл
      { wch: 15 }, // Утас
      { wch: 20 }, // Албан тушаал
      { wch: 20 }, // Компани
      { wch: 40 }, // Нэмэлт мэдээлэл
      { wch: 50 }, // Сонгосон бараа
      { wch: 15 }, // Барааны тоо
      { wch: 15 }, // Төлөв
      { wch: 20 }, // Шинэчлэгдсэн огноо
    ]
    worksheet["!cols"] = columnWidths

    // Generate Excel file and download
    let fileName = `Үнийн_санал_${new Date().toISOString().split("T")[0]}`
    if (startDate || endDate) {
      const dateRange = `${startDate || "эхлэл"}_${endDate || "төгсгөл"}`
      fileName = `Үнийн_санал_${dateRange}`
    }
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }

  const handleDownloadSingleQuote = async (quote: PriceQuote) => {
    // Dynamically import xlsx to avoid SSR issues
    const XLSX = await import("xlsx")

    // Prepare data for Excel export - single quote with detailed breakdown
    const quoteData = [
      {
        "Талбар": "Огноо",
        "Утга": formatDate(quote.createdAt),
      },
      {
        "Талбар": "Нэр",
        "Утга": quote.firstName,
      },
      {
        "Талбар": "Овог",
        "Утга": quote.lastName,
      },
      {
        "Талбар": "И-мэйл",
        "Утга": quote.email,
      },
      {
        "Талбар": "Утас",
        "Утга": quote.phone,
      },
      {
        "Талбар": "Албан тушаал",
        "Утга": quote.position,
      },
      {
        "Талбар": "Компани",
        "Утга": quote.company,
      },
      {
        "Талбар": "Нэмэлт мэдээлэл",
        "Утга": quote.additionalInfo,
      },
      {
        "Талбар": "Төлөв",
        "Утга": statusLabels[quote.status] || statusLabels.pending,
      },
      {
        "Талбар": "Шинэчлэгдсэн огноо",
        "Утга": quote.updatedAt ? formatDate(quote.updatedAt) : "Байхгүй",
      },
      {
        "Талбар": "",
        "Утга": "",
      },
      {
        "Талбар": "Сонгосон бараа",
        "Утга": "",
      },
    ]

    // Add products as separate rows
    quote.selectedProducts.forEach((product, index) => {
      quoteData.push({
        "Талбар": `${index + 1}. ${product.productName}`,
        "Утга": `Тоо ширхэг: ${product.quantity || "N/A"}, Төлөв: ${product.status ? statusLabels[product.status] : statusLabels.pending}`,
      })
    })

    // Create workbook with two sheets: Summary and Products
    const summarySheet = XLSX.utils.json_to_sheet(quoteData)
    
    // Products sheet
    const productsData = quote.selectedProducts.map((product, index) => ({
      "Дугаар": index + 1,
      "Барааны нэр": product.productName,
      "Тоо ширхэг": product.quantity || "N/A",
      "Төлөв": product.status ? statusLabels[product.status] : statusLabels.pending,
    }))
    const productsSheet = XLSX.utils.json_to_sheet(productsData)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Дэлгэрэнгүй")
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Бараа")

    // Set column widths for summary sheet
    summarySheet["!cols"] = [{ wch: 25 }, { wch: 50 }]
    productsSheet["!cols"] = [{ wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 20 }]

    // Generate Excel file and download
    const fileName = `Үнийн_санал_${quote.firstName}_${quote.lastName}_${quote.id}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Үнийн санал</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Харилцагчаас ирсэн үнийн санал удирдах цэс
          </p>
          {filteredQuotes.length !== quotes.length && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Нийт: <span className="font-semibold text-foreground">{quotes.length}</span> үнийн санал
              (Харуулж байна: <span className="font-semibold text-foreground">{filteredQuotes.length}</span>)
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Label htmlFor="startDate" className="text-xs sm:text-sm font-medium whitespace-nowrap">
              Эхлэх огноо:
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-[160px] lg:w-[180px]"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Label htmlFor="endDate" className="text-xs sm:text-sm font-medium whitespace-nowrap">
              Дуусах огноо:
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-[160px] lg:w-[180px]"
              min={startDate || undefined}
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="outline"
              onClick={() => {
                setStartDate("")
                setEndDate("")
              }}
              className="w-full sm:w-auto"
            >
              Цэвэрлэх
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Үнийн саналууд</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {selectedQuotes.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Устгах ({selectedQuotes.size})
                </Button>
              )}
              <Button onClick={handleDownloadExcel} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Excel татах</span>
                <span className="sm:hidden">Excel</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </TableHead>
                <TableHead className="min-w-[120px]">Огноо</TableHead>
                <TableHead className="min-w-[150px]">Харилцагч</TableHead>
                <TableHead className="hidden md:table-cell min-w-[120px]">Албан тушаал</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[150px]">Компани</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[180px]">И-мэйл</TableHead>
                <TableHead className="hidden md:table-cell min-w-[120px]">Утас</TableHead>
                <TableHead className="min-w-[100px]">Барааны тоо</TableHead>
                <TableHead className="min-w-[100px]">Төлөв</TableHead>
                <TableHead className="text-right min-w-[100px]">Үйлдлүүд</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Уншиж байна...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-destructive">
                    {error}
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={fetchQuotes}
                    >
                      Дахин оролдох
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    {quotes.length === 0 
                      ? "No quote requests found."
                      : `No quotes found for selected date range${startDate || endDate ? ` (${startDate || "..."} - ${endDate || "..."})` : ""}.`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => {
                  // Use items from Firestore (mapped to selectedProducts in API)
                  const items = quote.selectedProducts || []
                  return (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedQuotes.has(quote.id)}
                          onChange={(e) => handleSelectQuote(quote.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </TableCell>
                      <TableCell className="min-w-[120px]">{formatDate(quote.createdAt)}</TableCell>
                      <TableCell className="font-medium min-w-[150px]">
                        {quote.firstName} {quote.lastName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell min-w-[120px]">{quote.position || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell min-w-[150px]">{quote.company}</TableCell>
                      <TableCell className="hidden lg:table-cell min-w-[180px]">{quote.email}</TableCell>
                      <TableCell className="hidden md:table-cell min-w-[120px]">{quote.phone}</TableCell>
                      <TableCell className="min-w-[100px]">{items.length}</TableCell>
                      <TableCell className="min-w-[100px]">
                        <Badge className={getDisplayStatus(quote).color}>
                          {getDisplayStatus(quote).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewQuote(quote)}
                            title="Дэлгэрэнгүй харах"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadSingleQuote(quote)}
                            title="Excel татах"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
          {selectedQuote && (
            <>
              <DialogHeader>
                <DialogTitle>Үнийн санал авах хүсэлт</DialogTitle>
              
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Customer Information */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Харилцагчийн мэдээлэл</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Нэр
                      </label>
                      <p className="text-sm">{selectedQuote.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Овог
                      </label>
                      <p className="text-sm">{selectedQuote.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        И-мэйл
                      </label>
                      <p className="text-sm">{selectedQuote.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Утас
                      </label>
                      <p className="text-sm">{selectedQuote.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Албан тушаал
                      </label>
                      <p className="text-sm">{selectedQuote.position}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Компани
                      </label>
                      <p className="text-sm">{selectedQuote.company}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information / Note */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Нэмэлт мэдээлэл (Note)
                  </label>
                  <div className="mt-1 p-3 bg-muted rounded-md min-h-[80px]">
                    {selectedQuote.additionalInfo ? (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {selectedQuote.additionalInfo}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Нэмэлт мэдээлэл байхгүй (No additional information)
                      </p>
                    )}
                  </div>
                </div>

                {/* Selected Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Сонгосон бараа</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Барааны нэр</TableHead>
                          <TableHead>Брэнд</TableHead>
                          <TableHead>Өнгө</TableHead>
                          <TableHead>Хэмжээ</TableHead>
                          <TableHead>Модель дугаар</TableHead>
                          <TableHead className="text-right">Үнэ</TableHead>
                          <TableHead className="text-right">Үнэ (тоо)</TableHead>
                          <TableHead className="text-right">Тоо ширхэг</TableHead>
                          <TableHead className="text-center">Төлөв</TableHead>
                          <TableHead className="text-center">Барааны нөөц</TableHead>
                          <TableHead className="text-center">Үнийн санал</TableHead>
                          <TableHead className="text-center">Нэхэмжлэл</TableHead>
                          <TableHead className="text-center">Зарлагын баримт</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Use items from Firestore (mapped to selectedProducts in API)
                          const items = selectedQuote.selectedProducts || []
                          
                          if (items.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={14} className="text-center text-muted-foreground py-4">
                                  Бараа олдсонгүй (No products found)
                                </TableCell>
                              </TableRow>
                            )
                          }
                          
                          return items.map((product: any, index: number) => {
                            // Type the status properly to avoid 'any' indexing errors
                            // Prefer status if present, otherwise fallback to status_type
                            type ProductStatus = "sent_offer" | "create_invoice" | "spent" | "pending"
                            const statusValue = product.status || product.status_type || "pending"
                            const productStatus: ProductStatus = 
                              (statusValue && ["sent_offer", "create_invoice", "spent", "pending"].includes(statusValue))
                                ? statusValue as ProductStatus
                                : "pending"
                            // Handle different field names from Firestore
                            const productName = product.productName || product.name || product.product || "Unknown Product"
                            const productId = getProductKey(product, index)
                            // Handle quantity from items array - check multiple field name variations
                            const quantity = product.quantity !== undefined && product.quantity !== null 
                              ? product.quantity 
                              : (product.qty !== undefined && product.qty !== null 
                                  ? product.qty 
                                  : (product.amount !== undefined && product.amount !== null 
                                      ? product.amount 
                                      : "N/A"))
                            
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  {product.id !== undefined ? product.id : productId}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {productName}
                                </TableCell>
                                <TableCell>{product.brand || "-"}</TableCell>
                                <TableCell>{product.color || "-"}</TableCell>
                                <TableCell>{product.size || "-"}</TableCell>
                                <TableCell>{product.modelNumber || "-"}</TableCell>
                                <TableCell className="text-right">
                                  {product.price ? product.price.toLocaleString("mn-MN") : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {product.priceNum !== undefined ? product.priceNum : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {quantity}
                                </TableCell>
                              <TableCell className="text-center">
                                <Badge className={statusColors[productStatus]}>
                                  {statusLabels[productStatus]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={stockStatusColors[(product.stockStatus || product.stock_status || "inStock") as keyof typeof stockStatusColors] || stockStatusColors.inStock}>
                                  {stockStatusLabels[(product.stockStatus || product.stock_status || "inStock") as keyof typeof stockStatusLabels] || stockStatusLabels.inStock}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedForSendOffer.has(productId)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedForSendOffer)
                                    if (e.target.checked) {
                                      newSet.add(productId)
                                    } else {
                                      newSet.delete(productId)
                                    }
                                    setSelectedForSendOffer(newSet)
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedForInvoice.has(productId)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedForInvoice)
                                    if (e.target.checked) {
                                      newSet.add(productId)
                                    } else {
                                      newSet.delete(productId)
                                    }
                                    setSelectedForInvoice(newSet)
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedForSpent.has(productId)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedForSpent)
                                    if (e.target.checked) {
                                      newSet.add(productId)
                                    } else {
                                      newSet.delete(productId)
                                    }
                                    setSelectedForSpent(newSet)
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                />
                              </TableCell>
                            </TableRow>
                          )
                          })
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedForSendOffer.size > 0) {
                        setIsSendOfferDialogOpen(true)
                      }
                    }}
                    disabled={selectedForSendOffer.size === 0}
                    className="w-full sm:w-auto"
                  >
                    Үнийн санал
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedForInvoice.size > 0) {
                        setIsCreateInvoiceDialogOpen(true)
                      }
                    }}
                    disabled={selectedForInvoice.size === 0}
                    className="w-full sm:w-auto"
                  >
                    Нэхэмжлэл
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedForSpent.size > 0) {
                        setIsSpentDialogOpen(true)
                      }
                    }}
                    disabled={selectedForSpent.size === 0}
                    className="w-full sm:w-auto"
                  >
                    Зарлагын баримт
                  </Button>
                </div>

                {/* Status and Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Төлөв
                    </label>
                    <div className="mt-1">
                      <Select
                        value={selectedQuote.quoteStatus || "new"}
                        onValueChange={(value: "new" | "pending" | "in_progress" | "completed" | "rejected") => {
                          handleQuoteStatusChange(selectedQuote.id, value)
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Огноо
                    </label>
                    <p className="text-sm mt-1">{formatDate(selectedQuote.createdAt)}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsDialogOpen(false)}>Хаах</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Offer Form Dialog */}
      <Dialog open={isSendOfferDialogOpen} onOpenChange={setIsSendOfferDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Үнийн санал илгээх форм</DialogTitle>
            <DialogDescription>
              Сонгосон бараануудын үнийн санал илгээх форм
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedQuote && (
              <>
                {/* Quote Information */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Үнийн саналын дугаар</Label>
                      <Input
                        value={quoteNumber}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <Label>Огноо</Label>
                      <Input
                        type="date"
                        value={quoteDate || new Date().toISOString().split("T")[0]}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label>Худалдан авагчийн нэр</Label>
                      <Input
                        value={`${selectedQuote.firstName} ${selectedQuote.lastName}`}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Албан тушаал</Label>
                      <Input value={selectedQuote.position || ""} disabled />
                    </div>
                    <div>
                      <Label>Компани</Label>
                      <Input value={selectedQuote.company} disabled />
                    </div>
                  
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={buyerRegNumber}
                        onChange={(e) => setBuyerRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                  </div>
                </div>

                {/* Products to Include */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Сонгосон бараанууд</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">№</TableHead>
                          <TableHead>Гүйлгээний утга</TableHead>
                          <TableHead>Код</TableHead>
                          <TableHead>Хэмжих нэгж</TableHead>
                          <TableHead className="text-right">Тоо</TableHead>
                          <TableHead>Барааны төлөв</TableHead>
                          <TableHead className="font-semibold min-w-[180px]">Нийлүүлэх хугацаа</TableHead>
                          <TableHead className="text-right font-semibold min-w-[140px]">Нэгжийн үнэ</TableHead>
                          <TableHead className="text-right font-semibold min-w-[180px]">Нийт дүн (НӨАТ орсон)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.selectedProducts
                          .filter((product, index) => selectedForSendOffer.has(getProductKey(product, index)))
                          .map((product, index) => {
                            const productId = getProductKey(product, index)
                            const unitPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                            const rawQuantity = sendOfferQuantities[productId] !== undefined 
                              ? sendOfferQuantities[productId] 
                              : product.quantity
                            const quantity = toNumber(rawQuantity)
                            const total = unitPrice * quantity
                            const productCode = (product as any).product_code || (product as any).productCode || ""
                            const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                            const deliveryTime = sendOfferDeliveryTimes[productId] !== undefined 
                              ? sendOfferDeliveryTimes[productId] 
                              : ((product as any).delivery_time || (product as any).deliveryTime || "")
                            const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                            const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="text-center">{index + 1}</TableCell>
                                <TableCell className="font-medium">{transactionDescription}</TableCell>
                                <TableCell>{productCode || "-"}</TableCell>
                                <TableCell>{unitOfMeasurement}</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseFloat(e.target.value) || 0
                                      setSendOfferQuantities({
                                        ...sendOfferQuantities,
                                        [productId]: newQuantity
                                      })
                                    }}
                                    className="w-20 text-right"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge className={stockStatusColors[stockStatus as keyof typeof stockStatusColors] || stockStatusColors.inStock}>
                                    {stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock}
                                  </Badge>
                                </TableCell>
                                <TableCell className="min-w-[180px]">
                                  <Input
                                    type="date"
                                    value={deliveryTime}
                                    onChange={(e) => {
                                      setSendOfferDeliveryTimes({
                                        ...sendOfferDeliveryTimes,
                                        [productId]: e.target.value
                                      })
                                    }}
                                    className="w-full"
                                  />
                                </TableCell>
                                <TableCell className="text-right min-w-[140px]">
                                  <Input
                                    type="number"
                                    value={unitPrice}
                                    readOnly
                                    className="w-full text-right bg-muted cursor-not-allowed font-medium"
                                  />
                                </TableCell>
                                <TableCell className="text-right min-w-[180px]">
                                  <Input
                                    type="number"
                                    value={total}
                                    readOnly
                                    className="w-full text-right bg-muted cursor-not-allowed font-semibold"
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Нэмэлт мэдээлэл */}
                <div>
                  <Label>Нэмэлт мэдээлэл</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                    placeholder="Нэмэлт мэдээлэл ..."
                    value={selectedQuote.additionalInfo || ""}
                    readOnly
                    disabled
                  />
                </div>

                {/* Our Company Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Үнийн санал илгээгч компанийн мэдээлэл </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Компанийн нэр</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={companyRegNumber}
                        onChange={(e) => setCompanyRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Хаяг</Label>
                      <Input
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Enter company address"
                      />
                    </div>
                    <div>
                      <Label>Имэйл хаяг</Label>
                      <Input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label>Утас</Label>
                      <Input
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="Enter phone/fax"
                      />
                    </div>
                    <div>
                      <Label>Гар утас </Label>
                      <Input
                        value={companyMobile}
                        onChange={(e) => setCompanyMobile(e.target.value)}
                        placeholder="Enter mobile phone"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Компанийн тэмдэглэл</Label>
                      <textarea
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Enter Компанийн тэмдэглэл"
                        value={companyNote}
                        onChange={(e) => setCompanyNote(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

              
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendOfferDialogOpen(false)}>
              Хаах
            </Button>
            <Button
              onClick={async () => {
                // Handle save action - update status to sent_offer and save Компанийн тэмдэглэл and company info
                if (selectedQuote) {
                  try {
                    // Update selected products with new quantities and delivery times
                    const updatedProducts = selectedQuote.selectedProducts.map((product, index) => {
                      const productId = getProductKey(product, index)
                      if (!productId) return product
                      if (selectedForSendOffer.has(productId)) {
                        return {
                          ...product,
                          productId,
                          quantity: sendOfferQuantities[productId] !== undefined 
                            ? sendOfferQuantities[productId] 
                            : (product.quantity || 0),
                          delivery_time: sendOfferDeliveryTimes[productId] !== undefined 
                            ? sendOfferDeliveryTimes[productId] 
                            : ((product as any).delivery_time || (product as any).deliveryTime || ""),
                          status: "sent_offer",
                        }
                      }
                      return { ...product, productId }
                    })
                    
                    // Save Компанийн тэмдэглэл, company info, and updated products
                    const hasChanges = 
                      companyBankName !== ((selectedQuote as any).companyBankName || "Худалдаа хөгжлийн банк") ||
                      companyAccountNumber !== ((selectedQuote as any).companyAccountNumber || "MN610004000 415148288") ||
                      companyName !== ((selectedQuote as any).companyName || "БАЯН ӨНДӨР ХХК") ||
                      companyNote !== ((selectedQuote as any).companyNote || "") ||
                      companyAddress !== ((selectedQuote as any).companyAddress || "") ||
                      companyEmail !== ((selectedQuote as any).companyEmail || "") ||
                      companyPhone !== ((selectedQuote as any).companyPhone || "") ||
                      companyMobile !== ((selectedQuote as any).companyMobile || "") ||
                      companyRegNumber !== ((selectedQuote as any).companyRegNumber || "5332044") ||
                      buyerRegNumber !== ((selectedQuote as any).buyerRegNumber || "") ||
                      JSON.stringify(updatedProducts) !== JSON.stringify(selectedQuote.selectedProducts)
                    
                    if (hasChanges) {
                      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          companyBankName: companyBankName,
                          companyAccountNumber: companyAccountNumber,
                          companyName: companyName,
                          companyNote: companyNote,
                          companyAddress: companyAddress,
                          companyEmail: companyEmail,
                          companyPhone: companyPhone,
                          companyMobile: companyMobile,
                          companyRegNumber: companyRegNumber,
                          buyerRegNumber: buyerRegNumber,
                          selectedProducts: updatedProducts,
                        }),
                      })
                      const result = await response.json()
                      if (!result.success) {
                        throw new Error(result.error || "Failed to save company information")
                      }
                    }
                    
                    // Update only selected products to "sent_offer" status
                    const updatePromises = selectedQuote.selectedProducts
                      .filter((product, index) => selectedForSendOffer.has(getProductKey(product, index)))
                      .map((product, index) => {
                        return handleProductStatusChange(selectedQuote.id, getProductKey(product, index), "sent_offer")
                      })
                    
                    await Promise.all(updatePromises)
                    setIsSendOfferDialogOpen(false)
                    await fetchQuotes() // Refresh quotes list
                  } catch (error) {
                    console.error("Error saving offer:", error)
                    alert("Failed to save. Please try again.")
                  }
                }
              }}
            >
              Хадгалах
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadSendOfferWord}
            >
              <FileText className="mr-2 h-4 w-4" />
              Татаж авах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Form Dialog */}
      <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>НЭХЭМЖЛЭЛ </DialogTitle>
         
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedQuote && (
              <>
                {/* Invoice Information */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Нэхэмжлэлийн дугаар</Label>
                      <Input
                        value={invoiceNumber}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label>Огноо</Label>
                      <Input
                        type="date"
                        value={invoiceDate || new Date().toISOString().split("T")[0]}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label>Худалдан авагчийн нэр</Label>
                      <Input
                        value={`${selectedQuote.firstName} ${selectedQuote.lastName}`}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Компани</Label>
                      <Input value={selectedQuote.company} disabled />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={buyerRegNumber}
                        onChange={(e) => setBuyerRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div>
                      <Label>Имэйл</Label>
                      <Input value={selectedQuote.email} disabled />
                    </div>
                    <div>
                      <Label>Утас</Label>
                      <Input value={selectedQuote.phone} disabled />
                    </div>
                    <div>
                      <Label>Албан тушаал</Label>
                      <Input value={selectedQuote.position || ""} disabled />
                    </div>
                  </div>
                </div>

                {/* Products to Include */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Сонгосон бараанууд</h3>
                  <div className="border rounded-md overflow-x-hidden">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">№</TableHead>
                          <TableHead>Гүйлгээний утга</TableHead>
                          <TableHead>Код</TableHead>
                          <TableHead>Хэмжих нэгж</TableHead>
                          <TableHead className="text-right">Тоо</TableHead>
                          <TableHead>Барааны төлөв</TableHead>
                          <TableHead className="font-semibold min-w-[180px]">Нийлүүлэх хугацаа</TableHead>
                          <TableHead className="text-right font-semibold min-w-[140px]">Нэгжийн үнэ</TableHead>
                          <TableHead className="text-right font-semibold min-w-[180px]">Нийт дүн (НӨАТ орсон)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.selectedProducts
                          .filter((product, index) => selectedForInvoice.has(getProductKey(product, index)))
                          .map((product, index) => {
                            const productId = getProductKey(product, index)
                            const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                            const unitPrice = invoicePrices[productId] ?? String(fallbackPrice)
                            const rawQuantity = invoiceQuantities[productId] !== undefined 
                              ? invoiceQuantities[productId] 
                              : product.quantity
                            const quantity = toNumber(rawQuantity)
                            const total = toNumber(unitPrice) * quantity
                            const productCode = (product as any).product_code || (product as any).productCode || ""
                            const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                            const deliveryTime = invoiceDeliveryTimes[productId] !== undefined
                              ? invoiceDeliveryTimes[productId]
                              : ((product as any).delivery_time || (product as any).deliveryTime || "")
                            const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                            const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="text-center">{index + 1}</TableCell>
                                <TableCell className="font-medium">{transactionDescription}</TableCell>
                                <TableCell>{productCode || "-"}</TableCell>
                                <TableCell>{unitOfMeasurement}</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseFloat(e.target.value) || 0
                                      setInvoiceQuantities({
                                        ...invoiceQuantities,
                                        [productId]: newQuantity
                                      })
                                    }}
                                    className="w-20 text-right"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge className={stockStatusColors[stockStatus as keyof typeof stockStatusColors] || stockStatusColors.inStock}>
                                    {stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock}
                                  </Badge>
                                </TableCell>
                                <TableCell className="min-w-[180px]">
                                  <Input
                                    type="date"
                                    value={deliveryTime}
                                    onChange={(e) => {
                                      setInvoiceDeliveryTimes({
                                        ...invoiceDeliveryTimes,
                                        [productId]: e.target.value
                                      })
                                    }}
                                    className="w-full"
                                  />
                                </TableCell>
                                <TableCell className="text-right min-w-[140px]">
                                  <Input
                                    type="number"
                                    value={unitPrice}
                                    onChange={(e) => {
                                      setInvoicePrices({
                                        ...invoicePrices,
                                        [productId]: e.target.value
                                      })
                                    }}
                                    className="w-full text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-right min-w-[180px]">
                                  <Input
                                    type="number"
                                    value={total}
                                    readOnly
                                    className="w-full text-right bg-muted cursor-not-allowed font-semibold"
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Нэмэлт мэдээлэл */}
                <div>
                  <Label>Нэмэлт мэдээлэл</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                    placeholder="Нэмэлт мэдээлэл ..."
                    value={selectedQuote.additionalInfo || ""}
                    readOnly
                    disabled
                  />
                </div>

                {/* Our Company Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Нэхэмжлэл илгээгч компанийн мэдээлэл</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Компанийн нэр</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={companyRegNumber}
                        onChange={(e) => setCompanyRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div>
                      <Label>Банкны нэр</Label>
                      <Input
                        value={companyBankName}
                        onChange={(e) => setCompanyBankName(e.target.value)}
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Дансны дугаар</Label>
                      <Input
                        value={companyAccountNumber}
                        onChange={(e) => setCompanyAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Хаяг</Label>
                      <Input
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Enter company address"
                      />
                    </div>
                    <div>
                      <Label>Имэйл хаяг</Label>
                      <Input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label>Утас, Факс</Label>
                      <Input
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="Enter phone/fax"
                      />
                    </div>
                    <div>
                      <Label>Гар утас</Label>
                      <Input
                        value={companyMobile}
                        onChange={(e) => setCompanyMobile(e.target.value)}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Компанийн тэмдэглэл</Label>
                      <textarea
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Enter Компанийн тэмдэглэл "
                        value={companyNote}
                        onChange={(e) => setCompanyNote(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
             
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateInvoiceDialogOpen(false)}>
              Хаах 
            </Button>
            <Button
              onClick={async () => {
                // Handle save action - update status to create_invoice
                if (selectedQuote) {
                  try {
                    const missingDeliveryTime = selectedQuote.selectedProducts.filter((product, index) => {
                      const productId = getProductKey(product, index)
                      if (!productId || !selectedForInvoice.has(productId)) return false
                      const deliveryTime =
                        invoiceDeliveryTimes[productId] ??
                        (product as any).delivery_time ??
                        (product as any).deliveryTime ??
                        ""
                      return !deliveryTime
                    })

                    if (missingDeliveryTime.length > 0) {
                      alert("Нийлүүлэх хугацаа заавал бөглөнө үү.")
                      return
                    }

                    const updatedProducts = selectedQuote.selectedProducts.map((product, index) => {
                      const productId = getProductKey(product, index)
                      if (!productId) return product
                      if (selectedForInvoice.has(productId)) {
                        return {
                          ...product,
                          productId,
                          quantity: invoiceQuantities[productId] !== undefined 
                            ? invoiceQuantities[productId] 
                            : (product.quantity || 0),
                          delivery_time: invoiceDeliveryTimes[productId] !== undefined
                            ? invoiceDeliveryTimes[productId]
                            : ((product as any).delivery_time || (product as any).deliveryTime || ""),
                        }
                      }
                      return { ...product, productId }
                    })

                    // Save invoice info, Компанийн тэмдэглэл, and company info if changed
                    const hasChanges = 
                      invoiceNumber !== ((selectedQuote as any).invoiceNumber || "") ||
                      invoiceDate !== ((selectedQuote as any).invoiceDate || "") ||
                      companyBankName !== ((selectedQuote as any).companyBankName || "Худалдаа хөгжлийн банк") ||
                      companyAccountNumber !== ((selectedQuote as any).companyAccountNumber || "MN610004000 415148288") ||
                      companyName !== ((selectedQuote as any).companyName || "БАЯН ӨНДӨР ХХК") ||
                      companyNote !== ((selectedQuote as any).companyNote || "") ||
                      companyAddress !== ((selectedQuote as any).companyAddress || "") ||
                      companyEmail !== ((selectedQuote as any).companyEmail || "") ||
                      companyPhone !== ((selectedQuote as any).companyPhone || "") ||
                      companyMobile !== ((selectedQuote as any).companyMobile || "") ||
                      companyRegNumber !== ((selectedQuote as any).companyRegNumber || "5332044") ||
                      buyerRegNumber !== ((selectedQuote as any).buyerRegNumber || "") ||
                      JSON.stringify(updatedProducts) !== JSON.stringify(selectedQuote.selectedProducts)

                    if (hasChanges) {
                      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          invoiceNumber: invoiceNumber,
                          invoiceDate: invoiceDate,
                          companyBankName: companyBankName,
                          companyAccountNumber: companyAccountNumber,
                          companyName: companyName,
                          companyNote: companyNote,
                          companyAddress: companyAddress,
                          companyEmail: companyEmail,
                          companyPhone: companyPhone,
                          companyMobile: companyMobile,
                          companyRegNumber: companyRegNumber,
                          buyerRegNumber: buyerRegNumber,
                          selectedProducts: updatedProducts,
                        }),
                      })
                      const result = await response.json()
                      if (!result.success) {
                        throw new Error(result.error || "Failed to save company information")
                      }
                    }

                    // Update only selected products to "create_invoice" status
                    const updatePromises = selectedQuote.selectedProducts
                      .filter((product, index) => selectedForInvoice.has(getProductKey(product, index)))
                      .map((product, index) => {
                        return handleProductStatusChange(selectedQuote.id, getProductKey(product, index), "create_invoice")
                      })
                    
                    await Promise.all(updatePromises)
                    setSelectedQuote((prev) => prev ? {
                      ...prev,
                      invoiceNumber,
                      invoiceDate,
                      companyNote,
                      companyAddress,
                      companyEmail,
                      companyPhone,
                      companyMobile,
                      selectedProducts: updatedProducts,
                    } : prev)
                    setQuotes((prev) => prev.map((quote) => 
                      quote.id === selectedQuote.id
                        ? {
                            ...quote,
                            invoiceNumber,
                            invoiceDate,
                            companyNote,
                            companyAddress,
                            companyEmail,
                            companyPhone,
                            companyMobile,
                            selectedProducts: updatedProducts,
                          }
                        : quote
                    ))
                    setIsCreateInvoiceDialogOpen(false)
                    await fetchQuotes() // Refresh quotes list
                  } catch (error) {
                    console.error("Error saving invoice:", error)
                  }
                }
              }}
            >
              Хадгалах 
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadInvoiceWord}
            >
              <FileText className="mr-2 h-4 w-4" />
              Татаж авах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Зарлагын баримт Form Dialog - Expense Receipt */}
      <Dialog open={isSpentDialogOpen} onOpenChange={setIsSpentDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>ЗАРЛАГЫН БАРИМТ</DialogTitle>

          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedQuote && (
              <>
                {/* Expense Receipt Information */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Зарлагын баримтын дугаар</Label>
                      <Input
                        value={spentNumber}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label>Огноо</Label>
                      <Input
                        type="date"
                        value={spentDate || new Date().toISOString().split("T")[0]}
                        readOnly
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <Label>Худалдан авагчийн нэр</Label>
                      <Input
                        value={`${selectedQuote.firstName} ${selectedQuote.lastName}`}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Компани</Label>
                      <Input value={selectedQuote.company} disabled />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={buyerRegNumber}
                        onChange={(e) => setBuyerRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div>
                      <Label>Имэйл</Label>
                      <Input value={selectedQuote.email} disabled />
                    </div>
                    <div>
                      <Label>Утас</Label>
                      <Input value={selectedQuote.phone} disabled />
                    </div>
                    <div>
                      <Label>Албан тушаал</Label>
                      <Input value={selectedQuote.position || ""} disabled />
                    </div>
                  </div>
                </div>

                {/* Products to Include */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Сонгосон бараанууд</h3>
                  <div className="border rounded-md overflow-x-hidden">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">№</TableHead>
                          <TableHead>Гүйлгээний утга</TableHead>
                          <TableHead>Код</TableHead>
                          <TableHead>Хэмжих нэгж</TableHead>
                          <TableHead className="text-right">Тоо</TableHead>
                          <TableHead>Барааны төлөв</TableHead>
                          <TableHead className="font-semibold min-w-[180px]">Нийлүүлэх хугацаа</TableHead>
                          <TableHead className="text-right font-semibold min-w-[140px]">Нэгжийн үнэ</TableHead>
                          <TableHead className="text-right font-semibold min-w-[180px]">Нийт дүн (НӨАТ орсон)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.selectedProducts
                          .filter((product, index) => selectedForSpent.has(getProductKey(product, index)))
                          .map((product, index) => {
                            const productId = getProductKey(product, index)
                            const fallbackPrice = toNumber((product as any).price ?? (product as any).priceNum ?? 0)
                            const unitPrice = spentPrices[productId] ?? String(fallbackPrice)
                            const rawQuantity = spentQuantities[productId] !== undefined 
                              ? spentQuantities[productId] 
                              : product.quantity
                            const quantity = toNumber(rawQuantity)
                            const total = toNumber(unitPrice) * quantity
                            const productCode = (product as any).product_code || (product as any).productCode || ""
                            const unitOfMeasurement = (product as any).unit_of_measurement || (product as any).unitOfMeasurement || (product as any).unit || "ш"
                            const deliveryTime = spentDeliveryTimes[productId] !== undefined
                              ? spentDeliveryTimes[productId]
                              : ((product as any).delivery_time || (product as any).deliveryTime || "")
                            const transactionDescription = (product as any).transaction_description || (product as any).transactionDescription || product.productName || ""
                            const stockStatus = (product as any).stockStatus || (product as any).stock_status || "inStock"
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="text-center">{index + 1}</TableCell>
                                <TableCell className="font-medium">{transactionDescription}</TableCell>
                                <TableCell>{productCode || "-"}</TableCell>
                                <TableCell>{unitOfMeasurement}</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseFloat(e.target.value) || 0
                                      setSpentQuantities({
                                        ...spentQuantities,
                                        [productId]: newQuantity
                                      })
                                    }}
                                    className="w-20 text-right"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge className={stockStatusColors[stockStatus as keyof typeof stockStatusColors] || stockStatusColors.inStock}>
                                    {stockStatusLabels[stockStatus as keyof typeof stockStatusLabels] || stockStatusLabels.inStock}
                                  </Badge>
                                </TableCell>
                                <TableCell className="min-w-[180px]">
                                  <Input
                                    type="date"
                                    value={deliveryTime}
                                    onChange={(e) => {
                                      setSpentDeliveryTimes({
                                        ...spentDeliveryTimes,
                                        [productId]: e.target.value
                                      })
                                    }}
                                    className="w-full"
                                  />
                                </TableCell>
                                <TableCell className="text-right min-w-[140px]">
                                  <Input
                                    type="number"
                                    value={unitPrice}
                                    onChange={(e) => {
                                      setSpentPrices({
                                        ...spentPrices,
                                        [productId]: e.target.value
                                      })
                                    }}
                                    className="w-full text-right"
                                  />
                                </TableCell>
                                <TableCell className="text-right min-w-[180px]">
                                  <Input
                                    type="number"
                                    value={total}
                                    readOnly
                                    className="w-full text-right bg-muted cursor-not-allowed font-semibold"
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Нэмэлт мэдээлэл */}
                <div>
                  <Label>Нэмэлт мэдээлэл</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                    placeholder="Нэмэлт мэдээлэл ..."
                    value={selectedQuote.additionalInfo || ""}
                    readOnly
                    disabled
                  />
                </div>

                {/* Our Company Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Зарлагын баримт илгээгч компанийн мэдээлэл</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Компанийн нэр</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="БАЯН ӨНДӨР ХХК"
                      />
                    </div>
                    <div>
                      <Label>Регистерийн №</Label>
                      <Input
                        value={companyRegNumber}
                        onChange={(e) => setCompanyRegNumber(e.target.value)}
                        placeholder="Enter registration number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Хаяг</Label>
                      <Input
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="Enter company address"
                      />
                    </div>
                    <div>
                      <Label>Имэйл хаяг</Label>
                      <Input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label>Утас, Факс</Label>
                      <Input
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="Enter phone/fax"
                      />
                    </div>
                    <div>
                      <Label>Гар утас</Label>
                      <Input
                        value={companyMobile}
                        onChange={(e) => setCompanyMobile(e.target.value)}
                        placeholder="Enter mobile number"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Компанийн тэмдэглэл</Label>
                      <textarea
                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Enter Компанийн тэмдэглэл (will be displayed in Invoice form)..."
                        value={companyNote}
                        onChange={(e) => setCompanyNote(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDownloadSpentWord}
            >
              <FileText className="mr-2 h-4 w-4" />
              Татаж авах
            </Button>
            <Button variant="outline" onClick={() => setIsSpentDialogOpen(false)}>
              Хаах 
            </Button>
            <Button
              onClick={async () => {
                // Handle save action - update status to spent
                if (selectedQuote) {
                  try {
                    const updatedProducts = selectedQuote.selectedProducts.map((product, index) => {
                      const productId = getProductKey(product, index)
                      if (!productId) return product
                      if (selectedForSpent.has(productId)) {
                        return {
                          ...product,
                          productId,
                          quantity: spentQuantities[productId] !== undefined 
                            ? spentQuantities[productId] 
                            : (product.quantity || 0),
                          delivery_time: spentDeliveryTimes[productId] !== undefined
                            ? spentDeliveryTimes[productId]
                            : ((product as any).delivery_time || (product as any).deliveryTime || ""),
                        }
                      }
                      return { ...product, productId }
                    })

                    const hasChanges = 
                      spentNumber !== ((selectedQuote as any).spentNumber || "") ||
                      spentDate !== ((selectedQuote as any).spentDate || "") ||
                      companyBankName !== ((selectedQuote as any).companyBankName || "Худалдаа хөгжлийн банк") ||
                      companyAccountNumber !== ((selectedQuote as any).companyAccountNumber || "MN610004000 415148288") ||
                      companyName !== ((selectedQuote as any).companyName || "БАЯН ӨНДӨР ХХК") ||
                      companyNote !== ((selectedQuote as any).companyNote || "") ||
                      companyAddress !== ((selectedQuote as any).companyAddress || "") ||
                      companyEmail !== ((selectedQuote as any).companyEmail || "") ||
                      companyPhone !== ((selectedQuote as any).companyPhone || "") ||
                      companyMobile !== ((selectedQuote as any).companyMobile || "") ||
                      companyRegNumber !== ((selectedQuote as any).companyRegNumber || "5332044") ||
                      buyerRegNumber !== ((selectedQuote as any).buyerRegNumber || "") ||
                      JSON.stringify(updatedProducts) !== JSON.stringify(selectedQuote.selectedProducts)

                    if (hasChanges) {
                      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          spentNumber: spentNumber,
                          spentDate: spentDate,
                          companyBankName: companyBankName,
                          companyAccountNumber: companyAccountNumber,
                          companyName: companyName,
                          companyNote: companyNote,
                          companyAddress: companyAddress,
                          companyEmail: companyEmail,
                          companyPhone: companyPhone,
                          companyMobile: companyMobile,
                          companyRegNumber: companyRegNumber,
                          buyerRegNumber: buyerRegNumber,
                          selectedProducts: updatedProducts,
                        }),
                      })
                      const result = await response.json()
                      if (!result.success) {
                        throw new Error(result.error || "Failed to save expense receipt information")
                      }
                    }

                    // Update only selected products to "spent" status
                    const updatePromises = selectedQuote.selectedProducts
                      .filter((product, index) => selectedForSpent.has(getProductKey(product, index)))
                      .map((product, index) => {
                        return handleProductStatusChange(selectedQuote.id, getProductKey(product, index), "spent")
                      })
                    
                    await Promise.all(updatePromises)
                    
                    // Decrement stock only for items newly marked as spent
                    const itemsToDecrement = selectedQuote.selectedProducts
                      .filter((product, index) => selectedForSpent.has(getProductKey(product, index)))
                      .filter((product) => {
                        const statusValue = product.status || (product as any).status_type || "pending"
                        return statusValue !== "spent"
                      })
                      .map((product, index) => {
                        const rawId =
                          (product as any).productId ||
                          (product as any).product_id ||
                          (product as any).id ||
                          ""
                        const resolvedId = String(rawId).trim()
                        const productCode =
                          (product as any).product_code ||
                          (product as any).productCode ||
                          ""
                        const quantity = spentQuantities[getProductKey(product, index)] !== undefined
                          ? spentQuantities[getProductKey(product, index)]
                          : (product as any).quantity || 0
                        return {
                          productId: resolvedId,
                          productCode: String(productCode).trim(),
                          quantity: Number(quantity) || 0,
                        }
                      })
                      .filter(
                        (item) =>
                          (item.productId || item.productCode) &&
                          (!item.productId || !item.productId.startsWith("product-")) &&
                          item.quantity > 0
                      )

                    if (itemsToDecrement.length > 0) {
                      const stockResponse = await fetch("/api/products/decrement-stock", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ items: itemsToDecrement }),
                      })
                      const stockResult = await stockResponse.json()
                      if (!stockResult.success) {
                        throw new Error(stockResult.error || "Failed to update product stock")
                      }
                      if (stockResult.missing && stockResult.missing.length > 0) {
                        console.warn("Missing products for stock update:", stockResult.missing)
                      }
                    }

                    setSelectedQuote((prev) => prev ? {
                      ...prev,
                      spentNumber,
                      spentDate,
                      companyNote,
                      companyAddress,
                      companyEmail,
                      companyPhone,
                      companyMobile,
                      selectedProducts: updatedProducts,
                    } : prev)
                    setQuotes((prev) => prev.map((quote) => 
                      quote.id === selectedQuote.id
                        ? {
                            ...quote,
                            spentNumber,
                            spentDate,
                            companyNote,
                            companyAddress,
                            companyEmail,
                            companyPhone,
                            companyMobile,
                            selectedProducts: updatedProducts,
                          }
                        : quote
                    ))
                    setIsSpentDialogOpen(false)
                    await fetchQuotes() // Refresh quotes list
                  } catch (error) {
                    console.error("Error saving spent:", error)
                  }
                }
              }}
            >
              Хадгалах 
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

