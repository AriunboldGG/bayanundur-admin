"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportToExcel } from "@/lib/excel-export"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { PriceQuote } from "@/lib/types"

interface QuotesAnalysisReportProps {
  period: string
}

interface ChartData {
  date: string
  quotes: number
  sentOffer: number
  createInvoice: number
  spent: number
  pending: number
}

export function QuotesAnalysisReport({ period }: QuotesAnalysisReportProps) {
  const [quotes, setQuotes] = useState<PriceQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/quotes")
      const result = await response.json()

      if (result.success && result.data) {
        setQuotes(result.data)
      } else {
        setError(result.error || "Failed to fetch quotes")
      }
    } catch (err: any) {
      console.error("Error fetching quotes:", err)
      setError(err.message || "Failed to fetch quotes")
    } finally {
      setIsLoading(false)
    }
  }

  // Process quotes data based on period
  const chartData = useMemo(() => {
    if (!quotes.length) return []

    const now = new Date()
    let startDate: Date
    let groupBy: "month" | "quarter" | "year"

    switch (period) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1) // Last 6 months
        groupBy = "month"
        break
      case "halfyear":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1) // Last year
        groupBy = "quarter"
        break
      case "year":
        startDate = new Date(now.getFullYear() - 1, 0, 1) // Last 2 years
        groupBy = "year"
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        groupBy = "month"
    }

    // Filter quotes by date
    const filteredQuotes = quotes.filter((quote) => {
      const quoteDate = new Date(quote.createdAt)
      return quoteDate >= startDate
    })

    // Group quotes by period
    const grouped: Record<string, ChartData> = {}

    filteredQuotes.forEach((quote) => {
      const quoteDate = new Date(quote.createdAt)
      let key: string

      if (groupBy === "month") {
        const monthNames = [
          "1-р сар",
          "2-р сар",
          "3-р сар",
          "4-р сар",
          "5-р сар",
          "6-р сар",
          "7-р сар",
          "8-р сар",
          "9-р сар",
          "10-р сар",
          "11-р сар",
          "12-р сар",
        ]
        key = `${quoteDate.getFullYear()}-${quoteDate.getMonth()}`
        const displayKey = `${monthNames[quoteDate.getMonth()]} ${quoteDate.getFullYear()}`
        if (!grouped[key]) {
          grouped[key] = {
            date: displayKey,
            quotes: 0,
            sentOffer: 0,
            createInvoice: 0,
            spent: 0,
            pending: 0,
          }
        }
      } else if (groupBy === "quarter") {
        const quarter = Math.floor(quoteDate.getMonth() / 3) + 1
        key = `${quoteDate.getFullYear()}-Q${quarter}`
        const displayKey = `${quarter}-р улирал ${quoteDate.getFullYear()}`
        if (!grouped[key]) {
          grouped[key] = {
            date: displayKey,
            quotes: 0,
            sentOffer: 0,
            createInvoice: 0,
            spent: 0,
            pending: 0,
          }
        }
      } else {
        key = `${quoteDate.getFullYear()}`
        if (!grouped[key]) {
          grouped[key] = {
            date: key,
            quotes: 0,
            sentOffer: 0,
            createInvoice: 0,
            spent: 0,
            pending: 0,
          }
        }
      }

      grouped[key].quotes++
      if (quote.status === "sent_offer") {
        grouped[key].sentOffer++
      } else if (quote.status === "create_invoice") {
        grouped[key].createInvoice++
      } else if (quote.status === "spent") {
        grouped[key].spent++
      } else {
        grouped[key].pending++
      }
    })

    // Sort by date
    return Object.values(grouped).sort((a, b) => {
      const dateA = a.date
      const dateB = b.date
      return dateA.localeCompare(dateB)
    })
  }, [quotes, period])

  const handleExport = () => {
    const exportData = chartData.map((item) => ({
      Огноо: item.date,
      "Үнийн санал": item.quotes,
      "Илгээсэн санал": item.sentOffer,
      "Нэхэмжлэх": item.createInvoice,
      "Зарцуулсан": item.spent,
      "Хүлээгдэж буй": item.pending,
    }))
    exportToExcel(exportData, `quotes-analysis-${period}`, "Quotes Analysis")
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p>Уншиж байна...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          <p>Алдаа: {error}</p>
          <Button onClick={fetchQuotes} className="mt-4" variant="outline">
            Дахин оролдох
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Үнийн саналын шинжилгээ</CardTitle>
              <CardDescription>
                View quotes analysis over different time periods (
                {period === "month" ? "Сар" : period === "halfyear" ? "Хагас жил" : "Жил"})
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Excel татах
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Counts Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Үнийн саналын тооллого</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold">{quotes.length}</div>
                  <p className="text-sm text-muted-foreground mt-2">Нийт үнийн санал</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-blue-600">
                    {quotes.filter((q) => q.status === "sent_offer").length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Илгээсэн санал</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({quotes.length > 0 
                      ? Math.round((quotes.filter((q) => q.status === "sent_offer").length / quotes.length) * 100)
                      : 0}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-green-600">
                    {quotes.filter((q) => q.status === "create_invoice").length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Нэхэмжлэх</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({quotes.length > 0 
                      ? Math.round((quotes.filter((q) => q.status === "create_invoice").length / quotes.length) * 100)
                      : 0}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-orange-600">
                    {quotes.filter((q) => q.status === "spent").length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Зарцуулсан</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({quotes.length > 0 
                      ? Math.round((quotes.filter((q) => q.status === "spent").length / quotes.length) * 100)
                      : 0}%)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-gray-600">
                    {quotes.filter((q) => q.status === "pending" || !q.status).length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Хүлээгдэж буй</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({quotes.length > 0 
                      ? Math.round((quotes.filter((q) => q.status === "pending" || !q.status).length / quotes.length) * 100)
                      : 0}%)
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status Breakdown Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Үнийн саналын тооллого</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Төлөв</TableHead>
                        <TableHead className="text-center">Тоо</TableHead>
                        <TableHead className="text-center">Хувь</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Нийт үнийн санал</TableCell>
                        <TableCell className="text-center font-bold text-lg">{quotes.length}</TableCell>
                        <TableCell className="text-center">100%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-blue-600">Илгээсэн санал (Sent Offer)</TableCell>
                        <TableCell className="text-center font-bold text-lg text-blue-600">
                          {quotes.filter((q) => q.status === "sent_offer").length}
                        </TableCell>
                        <TableCell className="text-center">
                          {quotes.length > 0 
                            ? Math.round((quotes.filter((q) => q.status === "sent_offer").length / quotes.length) * 100)
                            : 0}%
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-green-600">Нэхэмжлэх үүсгэсэн (Invoice Created)</TableCell>
                        <TableCell className="text-center font-bold text-lg text-green-600">
                          {quotes.filter((q) => q.status === "create_invoice").length}
                        </TableCell>
                        <TableCell className="text-center">
                          {quotes.length > 0 
                            ? Math.round((quotes.filter((q) => q.status === "create_invoice").length / quotes.length) * 100)
                            : 0}%
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-orange-600">Зарцуулсан (Зарлагын баримт)</TableCell>
                        <TableCell className="text-center font-bold text-lg text-orange-600">
                          {quotes.filter((q) => q.status === "spent").length}
                        </TableCell>
                        <TableCell className="text-center">
                          {quotes.length > 0 
                            ? Math.round((quotes.filter((q) => q.status === "spent").length / quotes.length) * 100)
                            : 0}%
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-gray-600">Хүлээгдэж буй (Pending)</TableCell>
                        <TableCell className="text-center font-bold text-lg text-gray-600">
                          {quotes.filter((q) => q.status === "pending" || !q.status).length}
                        </TableCell>
                        <TableCell className="text-center">
                          {quotes.length > 0 
                            ? Math.round((quotes.filter((q) => q.status === "pending" || !q.status).length / quotes.length) * 100)
                            : 0}%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Chart */}
          {chartData.length > 0 && (
            <>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="quotes"
                      stroke="#8884d8"
                      name="Нийт үнийн санал"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="sentOffer"
                      stroke="#82ca9d"
                      name="Илгээсэн санал"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="createInvoice"
                      stroke="#0088fe"
                      name="Нэхэмжлэх"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="spent"
                      stroke="#ffc658"
                      name="Зарцуулсан"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke="#ff7300"
                      name="Хүлээгдэж буй"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quotes" fill="#8884d8" name="Нийт үнийн санал" />
                    <Bar dataKey="sentOffer" fill="#82ca9d" name="Илгээсэн санал" />
                    <Bar dataKey="createInvoice" fill="#0088fe" name="Нэхэмжлэх" />
                    <Bar dataKey="spent" fill="#ffc658" name="Зарцуулсан" />
                    <Bar dataKey="pending" fill="#ff7300" name="Хүлээгдэж буй" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Огноо/Хугацаа</TableHead>
                      <TableHead className="text-right">Нийт үнийн санал</TableHead>
                      <TableHead className="text-right">Илгээсэн санал</TableHead>
                      <TableHead className="text-right">Нэхэмжлэх</TableHead>
                      <TableHead className="text-right">Зарцуулсан</TableHead>
                      <TableHead className="text-right">Хүлээгдэж буй</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.date}</TableCell>
                        <TableCell className="text-right">{row.quotes}</TableCell>
                        <TableCell className="text-right">{row.sentOffer}</TableCell>
                        <TableCell className="text-right">{row.createInvoice}</TableCell>
                        <TableCell className="text-right">{row.spent}</TableCell>
                        <TableCell className="text-right">{row.pending}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {chartData.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Өгөгдөл олдсонгүй</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
