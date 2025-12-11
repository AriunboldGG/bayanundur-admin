"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"
import { HistoricalTrendsReport } from "@/components/reports/historical-trends"
import { PriceQuotesByCustomerReport } from "@/components/reports/price-quotes-by-customer"
import { PurchasesByCustomerReport } from "@/components/reports/purchases-by-customer"
import { PriceQuotesByProductReport } from "@/components/reports/price-quotes-by-product"
import { PageViewsReport } from "@/components/reports/page-views"

const timePeriods = [
  { value: "month", label: "Сар (Month)" },
  { value: "halfyear", label: "Хагас жил (Half Year)" },
  { value: "year", label: "Жил (Year)" },
]

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month")
  const [activeTab, setActiveTab] = useState<string>("historical")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Тайлан хянах удирдах цэс 
          </p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="historical">Хянах самбар</TabsTrigger>
          <TabsTrigger value="quotes-customer">Price Quotes by Customer</TabsTrigger>
          <TabsTrigger value="purchases-customer">Purchases by Customer</TabsTrigger>
          <TabsTrigger value="quotes-product">Price Quotes by Product</TabsTrigger>
          <TabsTrigger value="page-views">Page Views</TabsTrigger>
        </TabsList>

        <TabsContent value="historical" className="space-y-4">
          <HistoricalTrendsReport period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="quotes-customer" className="space-y-4">
          <PriceQuotesByCustomerReport period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="purchases-customer" className="space-y-4">
          <PurchasesByCustomerReport period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="quotes-product" className="space-y-4">
          <PriceQuotesByProductReport period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="page-views" className="space-y-4">
          <PageViewsReport period={selectedPeriod} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

