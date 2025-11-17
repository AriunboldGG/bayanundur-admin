"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const mockData = [
  { product: "Малгай, каск", quotes: 125, totalAmount: 18500000 },
  { product: "Нүүрний хамгаалалт, нүдний шил", quotes: 98, totalAmount: 14200000 },
  { product: "Хамгаалалтын хувцас", quotes: 156, totalAmount: 23400000 },
  { product: "Гар хамгаалалтын хувцас хэрэгсэл", quotes: 87, totalAmount: 12800000 },
  { product: "Хөл хамгаалалтын хувцас хэрэгсэл", quotes: 112, totalAmount: 16800000 },
  { product: "Амьсгал хамгаалах маск, хошуувч", quotes: 134, totalAmount: 19800000 },
  { product: "Гагнуурын баг, дагалдах хэрэгсэлт", quotes: 76, totalAmount: 11200000 },
  { product: "Чихэвч, чихний бөглөө", quotes: 92, totalAmount: 13500000 },
]

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00c49f", "#ffbb28", "#8884d8"]

export function PriceQuotesByProductReport() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Үнийн санал авсан барааны нэр төрлөөр</CardTitle>
          <CardDescription>
            Price quotes by product name/type - Table and Graph
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="product"
                  angle={-45}
                  textAnchor="end"
                  height={150}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quotes" fill="#8884d8" name="Үнийн санал тоо" />
                <Bar dataKey="totalAmount" fill="#82ca9d" name="Нийт дүн (₮)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ product, quotes }) => `${product.substring(0, 15)}: ${quotes}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="quotes"
                  nameKey="product"
                >
                  {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Барааны нэр/Төрөл</TableHead>
                  <TableHead className="text-right">Үнийн санал тоо</TableHead>
                  <TableHead className="text-right">Нийт дүн (₮)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.product}</TableCell>
                    <TableCell className="text-right">{row.quotes}</TableCell>
                    <TableCell className="text-right">
                      {row.totalAmount.toLocaleString()}₮
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

