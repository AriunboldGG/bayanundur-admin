"use client"

import { useState } from "react"
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
import { Eye, CheckCircle, XCircle, Download, FileDown, FileText } from "lucide-react"
import { PriceQuote } from "@/lib/types"
import { Document, Packer, Paragraph, TextRun, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType } from "docx"
import { saveAs } from "file-saver"

// Mock data for price quotes
const mockQuotes: PriceQuote[] = [
  {
    id: "1",
    firstName: "Бат",
    lastName: "Дорж",
    email: "bat.dorj@example.com",
    phone: "99112233",
    additionalInfo: "Бид 50 ширхэг малгай, каск захиалах гэж байна.",
    position: "Худалдан авах менежер",
    company: "ABC ХХК",
    selectedProducts: [
      { productId: "1", productName: "Sample Product 1", quantity: 50, status: "sent_offer" },
      { productId: "2", productName: "Sample Product 2", quantity: 30, status: "sent_offer" },
    ],
    status: "sent_offer",
    quoteStatus: "new",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    firstName: "Сараа",
    lastName: "Болд",
    email: "saraa.bold@example.com",
    phone: "99223344",
    additionalInfo: "Хурдан хүргэлт хэрэгтэй байна.",
    position: "Директор",
    company: "XYZ Корпораци",
    selectedProducts: [
      { productId: "1", productName: "Sample Product 1", quantity: 100, status: "create_invoice" },
    ],
    status: "create_invoice",
    quoteStatus: "in_progress",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: "3",
    firstName: "Энх",
    lastName: "Мөнх",
    email: "enkh.munkh@example.com",
    phone: "99334455",
    additionalInfo: "Үнийн санал шаардлагатай.",
    position: "Худалдан авах ажилтан",
    company: "DEF Хувьцаат",
    selectedProducts: [
      { productId: "2", productName: "Sample Product 2", quantity: 25, status: "spent" },
      { productId: "3", productName: "Sample Product 3", quantity: 15, status: "sent_offer" },
    ],
    status: "sent_offer",
    quoteStatus: "pending",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
  },
]

const statusColors = {
  sent_offer: "bg-blue-100 text-blue-800 border-blue-200",
  create_invoice: "bg-purple-100 text-purple-800 border-purple-200",
  spent: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels = {
  sent_offer: "Sent offer",
  create_invoice: "Create invoice",
  spent: "Spent",
  pending: "Хүлээгдэж буй",
}


export default function QuotesPage() {
  const [quotes, setQuotes] = useState<PriceQuote[]>(mockQuotes)
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

  const handleProductStatusChange = (
    quoteId: string,
    productId: string,
    newStatus: "sent_offer" | "create_invoice" | "spent"
  ) => {
    setQuotes(
      quotes.map((quote) => {
        if (quote.id === quoteId) {
          const updatedProducts = quote.selectedProducts.map((product) =>
            product.productId === productId
              ? { ...product, status: newStatus }
              : product
          )
          const newQuoteStatus = calculateQuoteStatus(updatedProducts)
          return {
            ...quote,
            selectedProducts: updatedProducts,
            status: newQuoteStatus,
            updatedAt: new Date().toISOString(),
          }
        }
        return quote
      })
    )
    
    if (selectedQuote?.id === quoteId) {
      const updatedProducts = selectedQuote.selectedProducts.map((product) =>
        product.productId === productId
          ? { ...product, status: newStatus }
          : product
      )
      const newQuoteStatus = calculateQuoteStatus(updatedProducts)
      setSelectedQuote({
        ...selectedQuote,
        selectedProducts: updatedProducts,
        status: newQuoteStatus,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const handleQuoteStatusChange = (quoteId: string, newStatus: "new" | "pending" | "in_progress" | "completed" | "rejected") => {
    // Update the quote status
    setQuotes(
      quotes.map((quote) => {
        if (quote.id === quoteId) {
          return {
            ...quote,
            quoteStatus: newStatus,
            updatedAt: new Date().toISOString(),
          }
        }
        return quote
      })
    )
    if (selectedQuote?.id === quoteId) {
      setSelectedQuote({
        ...selectedQuote,
        quoteStatus: newStatus,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Generate Word document for Send Offer
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

  // Generate Word document for Invoice
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
            text: "Бараа, үйлчилгээ (Products/Services)",
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
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "ДҮН (Subtotal): ", bold: true }),
              new TextRun({ text: subtotal.toFixed(2) }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "НӨАТ (VAT): ", bold: true }),
              new TextRun({ text: vat.toFixed(2) }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "НИЙТ ДҮН (Grand Total): ", bold: true }),
              new TextRun({ text: grandTotal.toFixed(2) }),
            ],
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `Invoice_${selectedQuote.id}_${new Date().toISOString().split("T")[0]}.docx`)
  }

  // Generate Word document for Spent/Expense Receipt
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

  // Filter quotes by date range
  const getFilteredQuotes = (): PriceQuote[] => {
    if (!startDate && !endDate) {
      return quotes
    }
    
    return quotes.filter((quote) => {
      const quoteDate = new Date(quote.createdAt)
      const quoteDateOnly = new Date(quoteDate.getFullYear(), quoteDate.getMonth(), quoteDate.getDate())
      
      if (startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        // Set time to end of day for endDate to include the entire day
        end.setHours(23, 59, 59, 999)
        return quoteDateOnly >= start && quoteDateOnly <= end
      } else if (startDate) {
        const start = new Date(startDate)
        return quoteDateOnly >= start
      } else if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        return quoteDateOnly <= end
      }
      
      return true
    })
  }

  const filteredQuotes = getFilteredQuotes()

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
        "Барааны тоо": quote.selectedProducts.length,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Үнийн санал</h1>
          <p className="text-muted-foreground">
            Харилцагчаас ирсэн үнийн санал удирдах цэс
          </p>
          {filteredQuotes.length !== quotes.length && (
            <p className="text-sm text-muted-foreground mt-1">
              Нийт: <span className="font-semibold text-foreground">{quotes.length}</span> үнийн санал
              (Харуулж байна: <span className="font-semibold text-foreground">{filteredQuotes.length}</span>)
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate" className="text-sm font-medium">
              Эхлэх огноо:
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate" className="text-sm font-medium">
              Дуусах огноо:
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[180px]"
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
            >
              Цэвэрлэх
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Үнийн саналууд</CardTitle>
             
            </div>
            <Button onClick={handleDownloadExcel}>
              <Download className="mr-2 h-4 w-4" />
              Excel татах
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Огноо</TableHead>
                <TableHead>Харилцагч</TableHead>
                <TableHead>Компани</TableHead>
                <TableHead>И-мэйл</TableHead>
                <TableHead>Утас</TableHead>
                <TableHead>Барааны тоо</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead className="text-right">Үйлдлүүд</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {quotes.length === 0 
                      ? "No quote requests found."
                      : `No quotes found for selected date range${startDate || endDate ? ` (${startDate || "..."} - ${endDate || "..."})` : ""}.`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>{formatDate(quote.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                      {quote.firstName} {quote.lastName}
                    </TableCell>
                    <TableCell>{quote.company}</TableCell>
                    <TableCell>{quote.email}</TableCell>
                    <TableCell>{quote.phone}</TableCell>
                    <TableCell>{quote.selectedProducts.length}</TableCell>
                    <TableCell>
                      <Badge className={getDisplayStatus(quote).color}>
                        {getDisplayStatus(quote).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedQuote && (
            <>
              <DialogHeader>
                <DialogTitle>Үнийн санал авах хүсэлт</DialogTitle>
                <DialogDescription>
                  Quote request details and selected products
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Харилцагчийн мэдээлэл</h3>
                  <div className="grid grid-cols-2 gap-4">
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

                {/* Additional Information */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Нэмэлт мэдээлэл
                  </label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedQuote.additionalInfo}
                  </p>
                </div>

                {/* Selected Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Сонгосон бараа</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Барааны нэр</TableHead>
                          <TableHead className="text-right">Тоо ширхэг</TableHead>
                          <TableHead className="text-center">Төлөв</TableHead>
                          <TableHead className="text-center">Sent offer</TableHead>
                          <TableHead className="text-center">Create invoice</TableHead>
                          <TableHead className="text-center">Spent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.selectedProducts.map((product, index) => {
                          const productStatus = product.status || "pending"
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {product.productName}
                              </TableCell>
                              <TableCell className="text-right">
                                {product.quantity || "N/A"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={statusColors[productStatus]}>
                                  {statusLabels[productStatus]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedForSendOffer.has(product.productId)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedForSendOffer)
                                    if (e.target.checked) {
                                      newSet.add(product.productId)
                                    } else {
                                      newSet.delete(product.productId)
                                    }
                                    setSelectedForSendOffer(newSet)
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedForInvoice.has(product.productId)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedForInvoice)
                                    if (e.target.checked) {
                                      newSet.add(product.productId)
                                    } else {
                                      newSet.delete(product.productId)
                                    }
                                    setSelectedForInvoice(newSet)
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedForSpent.has(product.productId)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedForSpent)
                                    if (e.target.checked) {
                                      newSet.add(product.productId)
                                    } else {
                                      newSet.delete(product.productId)
                                    }
                                    setSelectedForSpent(newSet)
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedForSendOffer.size > 0) {
                        setIsSendOfferDialogOpen(true)
                      }
                    }}
                    disabled={selectedForSendOffer.size === 0}
                  >
                    Sent offer
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedForInvoice.size > 0) {
                        setIsCreateInvoiceDialogOpen(true)
                      }
                    }}
                    disabled={selectedForInvoice.size === 0}
                  >
                    Create invoice
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedForSpent.size > 0) {
                        setIsSpentDialogOpen(true)
                      }
                    }}
                    disabled={selectedForSpent.size === 0}
                  >
                    Spent
                  </Button>
                </div>

                {/* Status and Dates */}
                <div className="grid grid-cols-2 gap-4">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  <h3 className="text-lg font-semibold mb-3">Quote Information</h3>
                  <div className="grid grid-cols-2 gap-4">
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

                {/* Validity Period */}
                <div>
                  <Label>Quote Validity (Days)</Label>
                  <Input
                    type="number"
                    defaultValue="30"
                    className="w-32"
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
              Download Word
            </Button>
            <Button variant="outline" onClick={() => setIsSendOfferDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Handle send offer action
                if (selectedQuote) {
                  // Update only selected products to "sent_offer" status
                  selectedQuote.selectedProducts
                    .filter(product => selectedForSendOffer.has(product.productId))
                    .forEach((product) => {
                      handleProductStatusChange(selectedQuote.id, product.productId, "sent_offer")
                    })
                }
                setIsSendOfferDialogOpen(false)
              }}
            >
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Form Dialog */}
      <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                  <h3 className="text-lg font-semibold mb-3 border-b pb-1">Нэхэмжлэгч (Sender/Seller)</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                  <h3 className="text-lg font-semibold mb-3 border-b pb-1">Төлөгч (Payer/Buyer)</h3>
                  <div className="grid grid-cols-2 gap-4">
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

                {/* Summary Section */}
                {(() => {
                  const subtotal = selectedQuote.selectedProducts
                    .filter(product => selectedForInvoice.has(product.productId))
                    .reduce((sum, product) => {
                    const unitPrice = parseFloat(invoicePrices[product.productId] || "0")
                    const quantity = product.quantity || 0
                    return sum + (unitPrice * quantity)
                  }, 0)
                  const vat = subtotal * 0.1 // 10% VAT
                  const grandTotal = subtotal + vat
                  
                  return (
                    <div className="border rounded-md p-4 bg-gray-50">
                      <div className="flex justify-end">
                        <div className="w-80 space-y-2">
                          <div className="flex justify-between">
                            <Label className="font-semibold">ДҮН (Subtotal):</Label>
                            <span className="font-semibold">
                              {subtotal.toLocaleString("mn-MN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <Label className="font-semibold">НӨАТ (VAT):</Label>
                            <span className="font-semibold">
                              {vat.toLocaleString("mn-MN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <Label className="text-lg font-bold">НИЙТ ДҮН (Grand Total):</Label>
                            <span className="text-lg font-bold">
                              {grandTotal.toLocaleString("mn-MN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Textual Grand Total */}
                <div>
                  <Label>Мөнгөн дүн (Үсгээр) - Amount in Words:</Label>
                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                    <p className="text-sm italic">Amount will be displayed here in words</p>
                  </div>
                </div>

                {/* Signature Fields */}
                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <Label>Тэмдэг (Stamp)</Label>
                    <div className="mt-2 h-20 border rounded-md"></div>
                  </div>
                  <div>
                    <Label>Захирал (Director)</Label>
                    <div className="mt-2 h-20 border rounded-md flex items-end p-2">
                      <span className="text-xs text-muted-foreground">Signature</span>
                    </div>
                  </div>
                  <div>
                    <Label>Нягтлан бодогч (Accountant)</Label>
                    <div className="mt-2 h-20 border rounded-md flex items-end p-2">
                      <span className="text-xs text-muted-foreground">Signature</span>
                    </div>
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
              Download Word
            </Button>
            <Button variant="outline" onClick={() => setIsCreateInvoiceDialogOpen(false)}>
              Цуцлах (Cancel)
            </Button>
            <Button
              onClick={() => {
                // Handle create invoice action
                if (selectedQuote) {
                  // Update only selected products to "create_invoice" status
                  selectedQuote.selectedProducts
                    .filter(product => selectedForInvoice.has(product.productId))
                    .forEach((product) => {
                      handleProductStatusChange(selectedQuote.id, product.productId, "create_invoice")
                    })
                }
                setIsCreateInvoiceDialogOpen(false)
              }}
            >
              Нэхэмжлэл үүсгэх (Create Invoice)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spent Form Dialog - Expense Receipt */}
      <Dialog open={isSpentDialogOpen} onOpenChange={setIsSpentDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
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
              Download Word
            </Button>
            <Button variant="outline" onClick={() => setIsSpentDialogOpen(false)}>
              Цуцлах (Cancel)
            </Button>
            <Button
              onClick={() => {
                // Handle mark as spent action
                if (selectedQuote) {
                  // Update only selected products to "spent" status
                  selectedQuote.selectedProducts
                    .filter(product => selectedForSpent.has(product.productId))
                    .forEach((product) => {
                      handleProductStatusChange(selectedQuote.id, product.productId, "spent")
                    })
                }
                setIsSpentDialogOpen(false)
              }}
            >
              Зарлага баримтлах (Mark as Spent)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

