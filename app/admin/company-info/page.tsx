"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2 } from "lucide-react"

type CompanyInfoItem = {
  id: string
  address?: string
  company_phone?: string
  email?: string
  fb?: string
  mobile_phone?: string
  wechat?: string
  whatsup?: string
  createdAt?: string
  updatedAt?: string
}

const emptyForm = {
  address: "",
  company_phone: "",
  email: "",
  fb: "",
  mobile_phone: "",
  wechat: "",
  whatsup: "",
}

export default function CompanyInfoPage() {
  const [items, setItems] = useState<CompanyInfoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CompanyInfoItem | null>(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCompanyInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/company-info")
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch company info")
      }
      setItems(result.data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load company info")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanyInfo()
  }, [])

  const openCreate = () => {
    setEditingItem(null)
    setFormData({ ...emptyForm })
    setIsDialogOpen(true)
  }

  const openEdit = (item: CompanyInfoItem) => {
    setEditingItem(item)
    setFormData({
      address: item.address || "",
      company_phone: item.company_phone || "",
      email: item.email || "",
      fb: item.fb || "",
      mobile_phone: item.mobile_phone || "",
      wechat: item.wechat || "",
      whatsup: item.whatsup || "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const url = editingItem ? `/api/company-info/${editingItem.id}` : "/api/company-info"
      const method = editingItem ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save company info")
      }
      setIsDialogOpen(false)
      setEditingItem(null)
      await fetchCompanyInfo()
    } catch (err: any) {
      alert(err?.message || "Failed to save company info")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: CompanyInfoItem) => {
    if (!confirm("Та энэ мэдээллийг устгахдаа итгэлтэй байна уу?")) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/company-info/${item.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete company info")
      }
      await fetchCompanyInfo()
    } catch (err: any) {
      alert(err?.message || "Failed to delete company info")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Company Info</h1>
          
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Company Info
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Info</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Уншиж байна...</p>
          ) : error ? (
            <div className="space-y-3">
              <p className="text-destructive">Алдаа: {error}</p>
              <Button variant="outline" onClick={fetchCompanyInfo}>
                Дахин оролдох
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">Өгөгдөл олдсонгүй</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Company Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Facebook</TableHead>
                    <TableHead>Mobile Phone</TableHead>
                    <TableHead>WeChat</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-[200px]">{item.address || "-"}</TableCell>
                      <TableCell>{item.company_phone || "-"}</TableCell>
                      <TableCell>{item.email || "-"}</TableCell>
                      <TableCell>{item.fb || "-"}</TableCell>
                      <TableCell>{item.mobile_phone || "-"}</TableCell>
                      <TableCell>{item.wechat || "-"}</TableCell>
                      <TableCell>{item.whatsup || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                            aria-label="Edit company info"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            disabled={isDeleting}
                            aria-label="Delete company info"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Company Info" : "Create Company Info"}</DialogTitle>
            <DialogDescription>Fill in the company info fields and save.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                placeholder="Company address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_phone">Company Phone</Label>
              <Input
                id="company_phone"
                value={formData.company_phone}
                onChange={(event) => setFormData({ ...formData, company_phone: event.target.value })}
                placeholder="Company phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile_phone">Mobile Phone</Label>
              <Input
                id="mobile_phone"
                value={formData.mobile_phone}
                onChange={(event) => setFormData({ ...formData, mobile_phone: event.target.value })}
                placeholder="Mobile phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder="Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb">Facebook</Label>
              <Input
                id="fb"
                value={formData.fb}
                onChange={(event) => setFormData({ ...formData, fb: event.target.value })}
                placeholder="Facebook"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wechat">WeChat</Label>
              <Input
                id="wechat"
                value={formData.wechat}
                onChange={(event) => setFormData({ ...formData, wechat: event.target.value })}
                placeholder="WeChat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsup">WhatsApp</Label>
              <Input
                id="whatsup"
                value={formData.whatsup}
                onChange={(event) => setFormData({ ...formData, whatsup: event.target.value })}
                placeholder="WhatsApp"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
