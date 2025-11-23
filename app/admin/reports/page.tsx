"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HistoricalTrendsReport } from "@/components/reports/historical-trends"
import { PriceQuotesByCustomerReport } from "@/components/reports/price-quotes-by-customer"
import { PurchasesByCustomerReport } from "@/components/reports/purchases-by-customer"
import { PriceQuotesByProductReport } from "@/components/reports/price-quotes-by-product"
import { PageViewsReport } from "@/components/reports/page-views"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Тайлан хянах удирдах цэс 
        </p>
      </div>

      <Tabs defaultValue="historical" className="space-y-4">
        <TabsList>
          <TabsTrigger value="historical">Historical Trends</TabsTrigger>
          <TabsTrigger value="quotes-customer">Price Quotes by Customer</TabsTrigger>
          <TabsTrigger value="purchases-customer">Purchases by Customer</TabsTrigger>
          <TabsTrigger value="quotes-product">Price Quotes by Product</TabsTrigger>
          <TabsTrigger value="page-views">Page Views</TabsTrigger>
        </TabsList>

        <TabsContent value="historical" className="space-y-4">
          <HistoricalTrendsReport />
        </TabsContent>

        <TabsContent value="quotes-customer" className="space-y-4">
          <PriceQuotesByCustomerReport />
        </TabsContent>

        <TabsContent value="purchases-customer" className="space-y-4">
          <PurchasesByCustomerReport />
        </TabsContent>

        <TabsContent value="quotes-product" className="space-y-4">
          <PriceQuotesByProductReport />
        </TabsContent>

        <TabsContent value="page-views" className="space-y-4">
          <PageViewsReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}

