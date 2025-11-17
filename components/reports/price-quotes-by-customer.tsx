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
  { customer: "ABC ХХК", quotes: 45, totalAmount: 12500000 },
  { customer: "XYZ Корпораци", quotes: 38, totalAmount: 9800000 },
  { customer: "DEF Хувьцаат", quotes: 52, totalAmount: 15200000 },
  { customer: "GHI Бизнес", quotes: 28, totalAmount: 7200000 },
  { customer: "JKL Групп", quotes: 41, totalAmount: 11800000 },
  { customer: "MNO Холдинг", quotes: 35, totalAmount: 8900000 },
  { customer: "PQR Компани", quotes: 48, totalAmount: 13500000 },
]

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00c49f", "#ffbb28"]

export function PriceQuotesByCustomerReport() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Үнийн санал авсан харилцагчаар</CardTitle>
          <CardDescription>
            Price quotes by customer - Table and Graph
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="customer" angle={-45} textAnchor="end" height={100} />
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
                  label={({ customer, quotes }) => `${customer}: ${quotes}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="quotes"
                  nameKey="customer"
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
                  <TableHead>Харилцагч</TableHead>
                  <TableHead className="text-right">Үнийн санал тоо</TableHead>
                  <TableHead className="text-right">Нийт дүн (₮)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.customer}</TableCell>
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

