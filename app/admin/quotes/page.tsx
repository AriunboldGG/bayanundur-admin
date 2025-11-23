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
import { Eye, CheckCircle, XCircle, Mail, Download, FileDown } from "lucide-react"
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
      { productId: "1", productName: "Sample Product 1", quantity: 50 },
      { productId: "2", productName: "Sample Product 2", quantity: 30 },
    ],
    status: "pending",
    createdAt: "2024-01-15T10:30:00",
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
      { productId: "1", productName: "Sample Product 1", quantity: 100 },
    ],
    status: "approved",
    createdAt: "2024-01-14T14:20:00",
    updatedAt: "2024-01-14T16:45:00",
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
      { productId: "2", productName: "Sample Product 2", quantity: 25 },
      { productId: "3", productName: "Sample Product 3", quantity: 15 },
    ],
    status: "sent",
    createdAt: "2024-01-13T09:15:00",
    updatedAt: "2024-01-13T11:30:00",
  },
]

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
}

const statusLabels = {
  pending: "Хүлээгдэж буй",
  approved: "Зөвшөөрсөн",
  rejected: "Татгалзсан",
  sent: "Илгээсэн",
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<PriceQuote[]>(mockQuotes)
  const [selectedQuote, setSelectedQuote] = useState<PriceQuote | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleViewQuote = (quote: PriceQuote) => {
    setSelectedQuote(quote)
    setIsDialogOpen(true)
  }

  const handleStatusChange = (quoteId: string, newStatus: PriceQuote["status"]) => {
    setQuotes(
      quotes.map((quote) =>
        quote.id === quoteId
          ? { ...quote, status: newStatus, updatedAt: new Date().toISOString() }
          : quote
      )
    )
    if (selectedQuote?.id === quoteId) {
      setSelectedQuote({
        ...selectedQuote,
        status: newStatus,
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

  const handleDownloadExcel = async () => {
    // Dynamically import xlsx to avoid SSR issues
    const XLSX = await import("xlsx")

    // Prepare data for Excel export
    const excelData = quotes.map((quote) => {
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
    const fileName = `Үнийн_санал_${new Date().toISOString().split("T")[0]}.xlsx`
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
      <div>
        <h1 className="text-3xl font-bold">Үнийн санал</h1>
        <p className="text-muted-foreground">
          Харилцагчаас ирсэн үнийн санал удирдах цэс
        </p>
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
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No quote requests found.
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
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
                      <Badge className={statusColors[quote.status]}>
                        {statusLabels[quote.status]}
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.selectedProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {product.productName}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.quantity || "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
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
                      <Badge className={statusColors[selectedQuote.status]}>
                        {statusLabels[selectedQuote.status]}
                      </Badge>
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
                    onClick={() => handleStatusChange(selectedQuote.id, "rejected")}
                    disabled={selectedQuote.status === "rejected"}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Татгалзах
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange(selectedQuote.id, "approved")}
                    disabled={selectedQuote.status === "approved"}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Зөвшөөрөх
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange(selectedQuote.id, "sent")}
                    disabled={selectedQuote.status === "sent"}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Илгээсэн
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

