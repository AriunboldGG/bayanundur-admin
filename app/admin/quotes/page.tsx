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
  const [spentPrices, setSpentPrices] = useState<Record<string, string>>({})
  const [selectedForSendOffer, setSelectedForSendOffer] = useState<Set<string>>(new Set())
  const [selectedForInvoice, setSelectedForInvoice] = useState<Set<string>>(new Set())
  const [selectedForSpent, setSelectedForSpent] = useState<Set<string>>(new Set())
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

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
    // Initialize selections - start empty, user will select
    setSelectedForSendOffer(new Set())
    setSelectedForInvoice(new Set())
    setSelectedForSpent(new Set())
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

      const updatedProducts = quote.selectedProducts.map((product) =>
        product.productId === productId
          ? { ...product, status: newStatus }
          : product
      )
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
      product => selectedForSendOffer.has(product.productId)
    )

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "SENT OFFER FORM",
            heading: "Heading1",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Quote Number: ", bold: true }),
              new TextRun({ text: `Q-${selectedQuote.id}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Date: ", bold: true }),
              new TextRun({ text: formatDate(selectedQuote.createdAt) }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Customer: ", bold: true }),
              new TextRun({ text: `${selectedQuote.firstName} ${selectedQuote.lastName}` }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Company: ", bold: true }),
              new TextRun({ text: selectedQuote.company }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Selected Products",
            heading: "Heading2",
          }),
          new DocxTable({
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph("Product Name")] }),
                  new DocxTableCell({ children: [new Paragraph("Quantity")] }),
                ],
              }),
              ...selectedProducts.map(product =>
                new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph(product.productName)] }),
                    new DocxTableCell({ children: [new Paragraph(String(product.quantity || "N/A"))] }),
                  ],
                })
              ),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Additional Notes: ", bold: true }),
              new TextRun({ text: selectedQuote.additionalInfo }),
            ],
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Send_Offer_${selectedQuote.id}_${new Date().toISOString().split("T")[0]}.docx`)
  }

  // Generate Татаж авах document for Invoice
  const handleDownloadInvoiceWord = async () => {
    if (!selectedQuote) return

    const selectedProducts = selectedQuote.selectedProducts.filter(
      product => selectedForInvoice.has(product.productId)
    )

    const subtotal = selectedProducts.reduce((sum, product) => {
      const unitPrice = parseFloat(invoicePrices[product.productId] || "0")
      const quantity = product.quantity || 0
      return sum + (unitPrice * quantity)
    }, 0)
    const vat = subtotal * 0.1
    const grandTotal = subtotal + vat

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "НЭХЭМЖЛЭЛ (INVOICE)",
            heading: "Heading1",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Нэхэмжлэгч (Sender): ", bold: true }),
              new TextRun({ text: "БАЯН ӨНДӨР ХХК" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Төлөгч (Buyer): ", bold: true }),
              new TextRun({ text: selectedQuote.company }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Бараа, үйлчилгээ",
            heading: "Heading2",
          }),
          new DocxTable({
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph("№")] }),
                  new DocxTableCell({ children: [new Paragraph("Барааны нэр")] }),
                  new DocxTableCell({ children: [new Paragraph("Тоо")] }),
                  new DocxTableCell({ children: [new Paragraph("Нэгжийн үнэ")] }),
                  new DocxTableCell({ children: [new Paragraph("Нийт дүн")] }),
                ],
              }),
              ...selectedProducts.map((product, index) => {
                const unitPrice = invoicePrices[product.productId] || "0"
                const quantity = product.quantity || 0
                const total = (parseFloat(unitPrice) * quantity).toFixed(2)
                return new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph(String(index + 1))] }),
                    new DocxTableCell({ children: [new Paragraph(product.productName)] }),
                    new DocxTableCell({ children: [new Paragraph(String(quantity))] }),
                    new DocxTableCell({ children: [new Paragraph(unitPrice)] }),
                    new DocxTableCell({ children: [new Paragraph(total)] }),
                  ],
                })
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),

        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Invoice_${selectedQuote.id}_${new Date().toISOString().split("T")[0]}.docx`)
  }

  // Generate Татаж авах document for Зарлагын баримт/Expense Receipt
  const handleDownloadSpentWord = async () => {
    if (!selectedQuote) return

    const selectedProducts = selectedQuote.selectedProducts.filter(
      product => selectedForSpent.has(product.productId)
    )

    const grandTotal = selectedProducts.reduce((sum, product) => {
      const unitPrice = parseFloat(spentPrices[product.productId] || "0")
      const quantity = product.quantity || 0
      return sum + (unitPrice * quantity)
    }, 0)

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: "ЗАРЛАГЫН БАРИМТ (EXPENSE RECEIPT)",
            heading: "Heading1",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "БАЯН ӨНДӨР ХХК", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Худалдан авагч (Buyer): ", bold: true }),
              new TextRun({ text: selectedQuote.company }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Материалын үнэт зүйл (Valuable Materials)",
            heading: "Heading2",
          }),
          new DocxTable({
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({ children: [new Paragraph("№")] }),
                  new DocxTableCell({ children: [new Paragraph("Материалын нэр")] }),
                  new DocxTableCell({ children: [new Paragraph("Тоо")] }),
                  new DocxTableCell({ children: [new Paragraph("Нэгжийн үн")] }),
                  new DocxTableCell({ children: [new Paragraph("Нийт дүн")] }),
                ],
              }),
              ...selectedProducts.map((product, index) => {
                const unitPrice = spentPrices[product.productId] || "0"
                const quantity = product.quantity || 0
                const total = (parseFloat(unitPrice) * quantity).toFixed(2)
                return new DocxTableRow({
                  children: [
                    new DocxTableCell({ children: [new Paragraph(String(index + 1))] }),
                    new DocxTableCell({ children: [new Paragraph(product.productName)] }),
                    new DocxTableCell({ children: [new Paragraph(String(quantity))] }),
                    new DocxTableCell({ children: [new Paragraph(unitPrice)] }),
                    new DocxTableCell({ children: [new Paragraph(total)] }),
                  ],
                })
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "Нийт дүн (Grand Total): ", bold: true }),
              new TextRun({ text: grandTotal.toFixed(2) }),
            ],
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Expense_Receipt_${selectedQuote.id}_${new Date().toISOString().split("T")[0]}.docx`)
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
                          <TableHead>Зураг</TableHead>
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
                                <TableCell colSpan={15} className="text-center text-muted-foreground py-4">
                                  Бараа олдсонгүй (No products found)
                                </TableCell>
                              </TableRow>
                            )
                          }
                          
                          return items.map((product: any, index: number) => {
                            // Type the status properly to avoid 'any' indexing errors
                            // Use status_type from backend, fallback to status
                            type ProductStatus = "sent_offer" | "create_invoice" | "spent" | "pending"
                            const statusValue = product.status_type || product.status || "pending"
                            const productStatus: ProductStatus = 
                              (statusValue && ["sent_offer", "create_invoice", "spent", "pending"].includes(statusValue))
                                ? statusValue as ProductStatus
                                : "pending"
                            // Handle different field names from Firestore
                            const productName = product.productName || product.name || product.product || "Unknown Product"
                            const productId = product.productId || product.id || `product-${index}`
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
                                <TableCell>
                                  {product.img ? (
                                    <img 
                                      src={product.img} 
                                      alt={productName}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
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
                                <Badge className={statusColors[productStatus]}>
                                  {statusValue}
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
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sent Offer Form</DialogTitle>
            <DialogDescription>
              Create and send price offer for selected products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedQuote && (
              <>
                {/* Quote Information */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Quote Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Quote Number</Label>
                      <Input
                        placeholder="Auto-generated or enter manually"
                        defaultValue={`Q-${selectedQuote.id}`}
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <Label>Customer</Label>
                      <Input
                        value={`${selectedQuote.firstName} ${selectedQuote.lastName}`}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input value={selectedQuote.company} disabled />
                    </div>
                  </div>
                </div>

                {/* Products to Include */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Select Products</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.selectedProducts
                          .filter(product => selectedForSendOffer.has(product.productId))
                          .map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{product.productName}</TableCell>
                            <TableCell className="text-right">{product.quantity || "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                placeholder="0"
                                className="w-24 text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <Label>Additional Notes</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Add any additional notes or terms..."
                    defaultValue={selectedQuote.additionalInfo}
                  />
                </div>

              
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDownloadSendOfferWord}
            >
              <FileText className="mr-2 h-4 w-4" />
              Татаж авах
            </Button>
            <Button variant="outline" onClick={() => setIsSendOfferDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                // Handle save action - update status to sent_offer
                if (selectedQuote) {
                  try {
                    // Update only selected products to "sent_offer" status
                    const updatePromises = selectedQuote.selectedProducts
                      .filter(product => selectedForSendOffer.has(product.productId))
                      .map((product) => {
                        return handleProductStatusChange(selectedQuote.id, product.productId, "sent_offer")
                      })
                    
                    await Promise.all(updatePromises)
                    setIsSendOfferDialogOpen(false)
                    await fetchQuotes() // Refresh quotes list
                  } catch (error) {
                    console.error("Error saving offer:", error)
                  }
                }
              }}
            >
              Хадгалах 
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Form Dialog */}
      <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>НЭХЭМЖЛЭЛ (Invoice)</DialogTitle>
            <DialogDescription>
              НХМаягт БМ-3 Т-1 | Сангийн сайдын 2017оны 12 дугаар сарын 5ны өдрийн 34 тоот тушаалын хавсралт
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedQuote && (
              <>
                {/* Invoice Number and Date */}
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <Label className="text-lg font-bold">НЭХЭМЖЛЭЛ №</Label>
                    <Input
                      placeholder="Invoice number"
                      className="w-48 mt-1"
                      defaultValue={`INV-${selectedQuote.id}`}
                    />
                  </div>
                  <div>
                    <Label>Огноо (Date)</Label>
                    <Input
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Sender Information (Нэхэмжлэгч) */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 border-b pb-1">Нэхэмжлэгч (Sender/Seller)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Байгууллагын нэр (Company Name)</Label>
                      <Input value="БАЯН ӨНДӨР ХХК" disabled />
                    </div>
                    <div>
                      <Label>Регистерийн № (Registration No.)</Label>
                      <Input value="5332044" disabled />
                    </div>
                    <div className="col-span-2">
                      <Label>Хаяг (Address)</Label>
                      <Input
                        value="УБ хот, Хан-Уул дүүрэг, 20-р хороо, Чингисийн өргөн чөлөө, Мишээл сити оффис М1 тауэр, 11 давхарт, 1107, 1108 тоот"
                        disabled
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value="sales1@bayan-undur.mn" disabled />
                    </div>
                    <div>
                      <Label>Утас, Факс (Phone, Fax)</Label>
                      <Input value="70118585" disabled />
                    </div>
                    <div>
                      <Label>Банкны нэр (Bank Name)</Label>
                      <Input value="Худалдаа хөгжлийн банк" disabled />
                    </div>
                    <div>
                      <Label>Дансны дугаар (Account Number)</Label>
                      <Input value="MN610004000 415148288" disabled />
                    </div>
                  </div>
                </div>

                {/* Receiver Information (Төлөгч) */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 border-b pb-1">Төлөгч (Payer/Buyer)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Худалдан авагчийн нэр (Buyer Name)</Label>
                      <Input
                        value={selectedQuote.company}
                        onChange={(e) => {
                          // Handle company name change if needed
                        }}
                      />
                    </div>
                    <div>
                      <Label>Регистерийн № (Registration No.)</Label>
                      <Input placeholder="Enter registration number" />
                    </div>
                    <div className="col-span-2">
                      <Label>Хаяг (Address)</Label>
                      <Input placeholder="Enter buyer address" />
                    </div>
                    <div>
                      <Label>Гэрээний дугаар (Agreement Number)</Label>
                      <Input placeholder="Enter agreement number" />
                    </div>
                    <div>
                      <Label>Нэхэмжилсэн огноо (Invoice Date)</Label>
                      <Input
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <Label>Төлбөр хийх хугацаа (Payment Due Date)</Label>
                      <Input type="date" />
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Бараа, үйлчилгээ (Products/Services)</h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">№</TableHead>
                          <TableHead>Гүйлгээний утга</TableHead>
                          <TableHead className="w-24">Код</TableHead>
                          <TableHead className="w-24">Хэмжих нэгж</TableHead>
                          <TableHead className="text-right w-24">Тоо</TableHead>
                          <TableHead className="text-right w-32">Нэгжийн үнэ</TableHead>
                          <TableHead className="text-right w-32">Нийт дүн</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.selectedProducts
                          .filter(product => selectedForInvoice.has(product.productId))
                          .map((product, index) => {
                          const unitPrice = invoicePrices[product.productId] || ""
                          const quantity = product.quantity || 0
                          const total = unitPrice ? (parseFloat(unitPrice) * quantity).toFixed(2) : "0.00"
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{product.productName}</TableCell>
                              <TableCell>
                                <Input
                                  placeholder="Code"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  defaultValue="TH"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell className="text-right">{quantity}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className="w-28 text-right"
                                  value={unitPrice}
                                  onChange={(e) => {
                                    setInvoicePrices({
                                      ...invoicePrices,
                                      [product.productId]: e.target.value,
                                    })
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {parseFloat(total).toLocaleString("mn-MN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
             
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDownloadInvoiceWord}
            >
              <FileText className="mr-2 h-4 w-4" />
              Татаж авах
            </Button>
            <Button variant="outline" onClick={() => setIsCreateInvoiceDialogOpen(false)}>
              Цуцлах 
            </Button>
            <Button
              onClick={async () => {
                // Handle save action - update status to create_invoice
                if (selectedQuote) {
                  try {
                    // Update only selected products to "create_invoice" status
                    const updatePromises = selectedQuote.selectedProducts
                      .filter(product => selectedForInvoice.has(product.productId))
                      .map((product) => {
                        return handleProductStatusChange(selectedQuote.id, product.productId, "create_invoice")
                      })
                    
                    await Promise.all(updatePromises)
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Зарлагын баримт Form Dialog - Expense Receipt */}
      <Dialog open={isSpentDialogOpen} onOpenChange={setIsSpentDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ЗАРЛАГЫН БАРИМТ (Expense Receipt)</DialogTitle>
            <DialogDescription>
              НХМаягт БМ-3 | Сангийн сайдын 2017 оны ....тоот тушаалын хавсралт
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedQuote && (
              <>
                {/* Expense Receipt Number and Date */}
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <Label className="text-lg font-bold">ЗАРЛАГЫН БАРИМТ №</Label>
                    <Input
                      placeholder="Expense receipt number"
                      className="w-48 mt-1"
                      defaultValue={`EXP-${selectedQuote.id}`}
                    />
                  </div>
                  <div>
                    <Label>Огноо (Date)</Label>
                    <Input
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Sender and Receiver Information Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sender Information (Left) */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 border-b pb-1">
                      БАЯН ӨНДӨР ХХК
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">(Байгууллагын нэр)</p>
                    <div className="space-y-3">
                      <div>
                        <Label>Регистерийн № (Registration No.)</Label>
                        <div className="flex gap-1 mt-1">
                          {["5", "3", "3", "2", "0", "4", "4"].map((digit, idx) => (
                            <Input
                              key={idx}
                              value={digit}
                              disabled
                              className="w-10 text-center"
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Огноо (Date)</Label>
                        <Input
                          type="date"
                          defaultValue={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Receiver Information (Right) */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 border-b pb-1">
                      Худалдан авагч
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">(Худалдан авагчийн нэр)</p>
                    <div className="space-y-3">
                      <div>
                        <Label>Худалдан авагчийн нэр (Buyer Name)</Label>
                        <Input
                          value={selectedQuote.company}
                        />
                      </div>
                      <div>
                        <Label>Регистерийн № (Registration No.)</Label>
                        <div className="flex gap-1 mt-1">
                          {Array.from({ length: 8 }).map((_, idx) => (
                            <Input
                              key={idx}
                              placeholder=""
                              className="w-10 text-center"
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>(тээвэрлэгчийн хаяг, албан тушаал, нэр)</Label>
                        <Input
                          placeholder="Carrier's address, position, name"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Материалын үнэт зүйл (Valuable Materials)</h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">№</TableHead>
                          <TableHead>Материалын үнэт зүйлийн нэр, зэрэг дугаар</TableHead>
                          <TableHead className="w-24">Код</TableHead>
                          <TableHead className="w-24">Хэмжих нэгж</TableHead>
                          <TableHead className="text-right w-24">Тоо</TableHead>
                          <TableHead className="text-right w-32">
                            <div className="text-center">Худалдах</div>
                            <div className="text-sm mt-1">Нэгжийн үн</div>
                          </TableHead>
                          <TableHead className="text-right w-32">
                            <div className="text-center">Худалдах</div>
                            <div className="text-sm mt-1">Нийт дүн</div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.selectedProducts
                          .filter(product => selectedForSpent.has(product.productId))
                          .map((product, index) => {
                          const unitPrice = spentPrices[product.productId] || ""
                          const quantity = product.quantity || 0
                          const total = unitPrice ? (parseFloat(unitPrice) * quantity).toFixed(2) : "0.00"
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{product.productName}</TableCell>
                              <TableCell>
                                <Input
                                  placeholder="Code"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  defaultValue="TH"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell className="text-right">{quantity}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className="w-28 text-right"
                                  value={unitPrice}
                                  onChange={(e) => {
                                    setSpentPrices({
                                      ...spentPrices,
                                      [product.productId]: e.target.value,
                                    })
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {parseFloat(total).toLocaleString("mn-MN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Grand Total */}
                {(() => {
                  const grandTotal = selectedQuote.selectedProducts
                    .filter(product => selectedForSpent.has(product.productId))
                    .reduce((sum, product) => {
                    const unitPrice = parseFloat(spentPrices[product.productId] || "0")
                    const quantity = product.quantity || 0
                    return sum + (unitPrice * quantity)
                  }, 0)
                  
                  return (
                    <div className="border rounded-md p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <Label className="text-lg font-bold">Нийт дүн (Grand Total):</Label>
                        <span className="text-lg font-bold">
                          {grandTotal.toLocaleString("mn-MN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* Signature Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <Label>Тэмдэг (Stamp)</Label>
                    <div className="mt-2 h-20 border rounded-md"></div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>Хүлээлгэн өгсөн эд хариуцагч (Property custodian who handed over)</Label>
                      <div className="mt-1 border-b-2 border-dotted pb-1">
                        <span className="text-sm text-muted-foreground">Signature / Name</span>
                      </div>
                    </div>
                    <div>
                      <Label>Хүлээн авагч (Recipient)</Label>
                      <div className="mt-1 border-b-2 border-dotted pb-1">
                        <span className="text-sm text-muted-foreground">Signature / Name</span>
                      </div>
                    </div>
                    <div>
                      <Label>Шалгасан нягтлан бодогч (Accountant who checked)</Label>
                      <div className="mt-1 border-b-2 border-dotted pb-1">
                        <span className="text-sm text-muted-foreground">Signature / Name</span>
                      </div>
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
              Цуцлах 
            </Button>
            <Button
              onClick={async () => {
                // Handle save action - update status to spent
                if (selectedQuote) {
                  try {
                    // Update only selected products to "spent" status
                    const updatePromises = selectedQuote.selectedProducts
                      .filter(product => selectedForSpent.has(product.productId))
                      .map((product) => {
                        return handleProductStatusChange(selectedQuote.id, product.productId, "spent")
                      })
                    
                    await Promise.all(updatePromises)
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

