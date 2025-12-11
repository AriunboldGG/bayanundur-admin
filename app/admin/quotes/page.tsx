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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, CheckCircle, XCircle, Download, FileDown } from "lucide-react"
import { PriceQuote } from "@/lib/types"

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
      { productId: "1", productName: "Sample Product 1", quantity: 50, status: "pending" },
      { productId: "2", productName: "Sample Product 2", quantity: 30, status: "pending" },
    ],
    status: "pending",
    isReviewed: false,
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
      { productId: "1", productName: "Sample Product 1", quantity: 100, status: "approved" },
    ],
    status: "approved",
    isReviewed: true,
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
      { productId: "2", productName: "Sample Product 2", quantity: 25, status: "approved" },
      { productId: "3", productName: "Sample Product 3", quantity: 15, status: "rejected" },
    ],
    status: "pending",
    isReviewed: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
  },
]

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
}

const statusLabels = {
  pending: "Хүлээгдэж буй",
  approved: "Зөвшөөрсөн",
  rejected: "Татгалзсан",
}

const timePeriods = [
  { value: "all", label: "Бүгд (All)" },
  { value: "month", label: "Сар (Month)" },
  { value: "halfyear", label: "Хагас жил (Half Year)" },
  { value: "year", label: "Жил (Year)" },
]

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<PriceQuote[]>(mockQuotes)
  const [selectedQuote, setSelectedQuote] = useState<PriceQuote | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all")

  const handleViewQuote = (quote: PriceQuote) => {
    setSelectedQuote(quote)
    setIsDialogOpen(true)
  }

  // Calculate overall quote status based on product statuses
  const calculateQuoteStatus = (products: PriceQuote["selectedProducts"]): PriceQuote["status"] => {
    if (products.length === 0) return "pending"
    const allApproved = products.every((p) => p.status === "approved")
    const allRejected = products.every((p) => p.status === "rejected")
    const hasPending = products.some((p) => p.status === "pending" || !p.status)
    
    if (allApproved) return "approved"
    if (allRejected) return "rejected"
    if (hasPending) return "pending"
    return "pending"
  }

  // Get display status for main table (New or Reviewed)
  const getDisplayStatus = (quote: PriceQuote): { label: string; color: string } => {
    const reviewed = quote.isReviewed || false
    if (reviewed) {
      return {
        label: "Reviewed",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      }
    }
    return {
      label: "New",
      color: "bg-gray-100 text-gray-800 border-gray-200",
    }
  }

  const handleProductStatusChange = (
    quoteId: string,
    productId: string,
    newStatus: "approved" | "rejected"
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

  const handleQuoteReviewStatusChange = (quoteId: string, isReviewed: boolean) => {
    // Only update the quote review status, not product statuses
    setQuotes(
      quotes.map((quote) => {
        if (quote.id === quoteId) {
          return {
            ...quote,
            isReviewed: isReviewed,
            updatedAt: new Date().toISOString(),
          }
        }
        return quote
      })
    )
    if (selectedQuote?.id === quoteId) {
      setSelectedQuote({
        ...selectedQuote,
        isReviewed: isReviewed,
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

  // Filter quotes by period
  const getFilteredQuotes = (): PriceQuote[] => {
    if (selectedPeriod === "all") {
      return quotes
    }
    
    const now = new Date()
    const quoteDate = new Date()
    
    let startDate: Date
    
    switch (selectedPeriod) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "halfyear":
        const currentMonth = now.getMonth()
        const halfYearStartMonth = currentMonth < 6 ? 0 : 6
        startDate = new Date(now.getFullYear(), halfYearStartMonth, 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        return quotes
    }
    
    return quotes.filter((quote) => {
      quoteDate.setTime(new Date(quote.createdAt).getTime())
      return quoteDate >= startDate && quoteDate <= now
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
        "Төлөв": statusLabels[quote.status],
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
    const periodLabel = timePeriods.find(p => p.value === selectedPeriod)?.label || selectedPeriod
    const fileName = `Үнийн_санал_${periodLabel}_${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
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
        "Утга": statusLabels[quote.status],
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
        "Утга": `Тоо ширхэг: ${product.quantity || "N/A"}`,
      })
    })

    // Create workbook with two sheets: Summary and Products
    const summarySheet = XLSX.utils.json_to_sheet(quoteData)
    
    // Products sheet
    const productsData = quote.selectedProducts.map((product, index) => ({
      "Дугаар": index + 1,
      "Барааны нэр": product.productName,
      "Тоо ширхэг": product.quantity || "N/A",
    }))
    const productsSheet = XLSX.utils.json_to_sheet(productsData)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Дэлгэрэнгүй")
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Бараа")

    // Set column widths for summary sheet
    summarySheet["!cols"] = [{ wch: 25 }, { wch: 50 }]
    productsSheet["!cols"] = [{ wch: 10 }, { wch: 40 }, { wch: 15 }]

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
            <Label htmlFor="period" className="text-sm font-medium">
              Хугацаа:
            </Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger id="period" className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {timePeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                      : `No quotes found for selected period (${timePeriods.find(p => p.value === selectedPeriod)?.label || selectedPeriod}).`}
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
                          <TableHead className="text-right">Үйлдэл</TableHead>
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
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleProductStatusChange(
                                        selectedQuote.id,
                                        product.productId,
                                        "approved"
                                      )
                                    }
                                    disabled={productStatus === "approved"}
                                    className="h-8"
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleProductStatusChange(
                                        selectedQuote.id,
                                        product.productId,
                                        "rejected"
                                      )
                                    }
                                    disabled={productStatus === "rejected"}
                                    className="h-8"
                                  >
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Status and Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Төлөв
                    </label>
                    <div className="mt-1">
                      {selectedQuote.isReviewed ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Reviewed
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                          New
                        </Badge>
                      )}
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

              <DialogFooter className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleQuoteReviewStatusChange(selectedQuote.id, false)}
                    disabled={selectedQuote.isReviewed === false}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    New
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQuoteReviewStatusChange(selectedQuote.id, true)}
                    disabled={selectedQuote.isReviewed === true}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Reviewed
                  </Button>
                </div>
                <Button onClick={() => setIsDialogOpen(false)}>Хаах</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

