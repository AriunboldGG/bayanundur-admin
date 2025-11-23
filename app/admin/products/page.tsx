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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategorySelector } from "@/components/admin/category-selector"
import { getCategoryPath } from "@/lib/categories"

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  categoryId: string
  category: string // Full path for display
  brand: string
  color: string
  size: string
  style: string
  stockStatus: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Sample Product 1",
      description: "This is a sample product description",
      price: 338,
      stock: 0,
      categoryId: "1-1-1",
      category: "Хувь хүнийг хамгаалах хувцас хэрэгсэл / Толгойн хамгаалалт / Малгай, каск",
      brand: "Swootech",
      color: "Улаан",
      size: "S",
      style: "Classic",
      stockStatus: "Захиалгаар",
    },
    {
      id: "2",
      name: "Sample Product 2",
      description: "Another sample product",
      price: 149.99,
      stock: 30,
      categoryId: "1-2",
      category: "Хувь хүнийг хамгаалах хувцас хэрэгсэл / Хамгаалалтын хувцас",
      brand: "Brand 2",
      color: "Blue",
      size: "M",
      style: "Modern",
      stockStatus: "Байгаа",
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    brand: "",
    color: "",
    size: "",
    style: "",
    stockStatus: "Байгаа",
  })

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        stock: product.stock.toString(),
        categoryId: product.categoryId,
        brand: product.brand,
        color: product.color,
        size: product.size,
        style: product.style,
        stockStatus: product.stockStatus,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "",
        categoryId: "",
        brand: "",
        color: "",
        size: "",
        style: "",
        stockStatus: "Байгаа",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      categoryId: "",
      brand: "",
      color: "",
      size: "",
      style: "",
      stockStatus: "Байгаа",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.categoryId) {
      alert("Please select a category")
      return
    }
    
    const categoryPath = getCategoryPath(formData.categoryId)
    
    if (editingProduct) {
      // Update existing product
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                categoryId: formData.categoryId,
                category: categoryPath,
                brand: formData.brand,
                color: formData.color,
                size: formData.size,
                style: formData.style,
                stockStatus: formData.stockStatus,
              }
            : p
        )
      )
    } else {
      // Create new product
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categoryId: formData.categoryId,
        category: categoryPath,
        brand: formData.brand,
        color: formData.color,
        size: formData.size,
        style: formData.style,
        stockStatus: formData.stockStatus,
      }
      setProducts([...products, newProduct])
    }
    
    handleCloseDialog()
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Бүтээгдэхүүн удирдах цэс
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Бараа нэмэх
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Бүтээгдэхүүний нийт жагсаалт</CardTitle>
         
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Брэнд</TableHead>
                <TableHead>Ангилал</TableHead>
                <TableHead>Өнгө</TableHead>
                <TableHead>Хэмжээ</TableHead>
                <TableHead>Үнэ</TableHead>
                <TableHead>Нөөц</TableHead>
                <TableHead className="text-right">Өөрчлөх</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No products found. Add your first product to get started.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {product.category}
                    </TableCell>
                    <TableCell>{product.color}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell>{product.price}₮</TableCell>
                    <TableCell>{product.stockStatus}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Make changes to the product details below."
                  : "Fill in the details to add a new product to your inventory."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category (Ангилал)</Label>
                <CategorySelector
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand (Брэнд)</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color (Өнгө)</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="size">Size (Хэмжээ)</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="style">Style/Model (Загвар)</Label>
                  <Input
                    id="style"
                    value={formData.style}
                    onChange={(e) =>
                      setFormData({ ...formData, style: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (₮)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stockStatus">Stock Status (Нөөц)</Label>
                <Select
                  value={formData.stockStatus}
                  onValueChange={(value) =>
                    setFormData({ ...formData, stockStatus: value })
                  }
                  required
                >
                  <SelectTrigger id="stockStatus">
                    <SelectValue placeholder="Select stock status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Байгаа">Байгаа (In Stock)</SelectItem>
                    <SelectItem value="Захиалгаар">Захиалгаар (By Order)</SelectItem>
                    <SelectItem value="Дууссан">Дууссан (Out of Stock)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? "Save Changes" : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

