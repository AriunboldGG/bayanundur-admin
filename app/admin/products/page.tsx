"use client"

import { useState, useEffect } from "react"
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
import { Plus, Pencil, Trash2, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Product {
  id: string
  name: string
  price: number
  stock: number
  brand: string
  color: string
  size: string[] | string // Can be array or string
  category: string // Ангилал (Category)
  subcategory: string // Дэд ангилал (Subcategory)
  "model number"?: string // Модел дугаар (Model number)
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("all")
  const [selectedBrand, setSelectedBrand] = useState<string>("all")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    brand: "",
    color: "",
    size: "", // Will be stored as comma-separated string, converted to array
    category: "", // Ангилал
    subcategory: "", // Дэд ангилал
    modelNumber: "", // Модел дугаар
  })

  // Fetch products from Firestore
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/products")
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()

      if (result.success) {
        // Map Firestore data to Product interface
        const mappedProducts = result.data.map((product: any) => ({
          id: product.id,
          name: product.name || "",
          price: product.price || 0,
          stock: product.stock || 0,
          brand: product.brand || "",
          color: product.color || "",
          size: Array.isArray(product.size) 
            ? product.size 
            : typeof product.size === 'string' 
              ? product.size.split(',').map((s: string) => s.trim())
              : [],
          category: product.category || "",
          subcategory: product.subcategory || "",
          "model number": product["model number"] || product.modelNumber || "",
        }))
        setProducts(mappedProducts)
      } else {
        setError(result.error || "Failed to fetch products")
      }
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError(err?.message || "Failed to load products. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      const sizeValue = Array.isArray(product.size) 
        ? product.size.join(", ") 
        : product.size || ""
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        brand: product.brand,
        color: product.color,
        size: sizeValue,
        category: product.category,
        subcategory: product.subcategory,
        modelNumber: product["model number"] || "",
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        price: "",
        stock: "",
        brand: "",
        color: "",
        size: "",
        category: "",
        subcategory: "",
        modelNumber: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData({
      name: "",
      price: "",
      stock: "",
      brand: "",
      color: "",
      size: "",
      category: "",
      subcategory: "",
      modelNumber: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category || !formData.subcategory) {
      alert("Please fill in category (Ангилал) and subcategory (Дэд ангилал)")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Convert size string to array
      const sizeArray = formData.size
        ? formData.size.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : []
      
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        brand: formData.brand,
        color: formData.color,
        size: sizeArray,
        category: formData.category,
        subcategory: formData.subcategory,
        "model number": formData.modelNumber,
      }

      if (editingProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        })

        const result = await response.json()
        if (result.success) {
          await fetchProducts() // Refresh the list
          handleCloseDialog()
        } else {
          alert(result.error || "Failed to update product")
        }
      } else {
        // Create new product
        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        })

        const result = await response.json()
        if (result.success) {
          await fetchProducts() // Refresh the list
          handleCloseDialog()
        } else {
          alert(result.error || "Failed to create product")
        }
      }
    } catch (err) {
      console.error("Error saving product:", err)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        await fetchProducts() // Refresh the list
      } else {
        alert(result.error || "Failed to delete product")
      }
    } catch (err) {
      console.error("Error deleting product:", err)
      alert("An error occurred. Please try again.")
    }
  }

  // Get unique categories from products
  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ).sort()

  // Get unique brands from products
  const uniqueBrands = Array.from(
    new Set(products.map((p) => p.brand).filter(Boolean))
  ).sort()

  // Filter products based on selected filters
  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory
    const brandMatch = selectedBrand === "all" || product.brand === selectedBrand
    const stockMatch = 
      selectedStockStatus === "all" 
        ? true 
        : selectedStockStatus === "inStock" 
          ? product.stock > 0 
          : product.stock === 0
    
    return categoryMatch && brandMatch && stockMatch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Бүтээгдэхүүн удирдах цэс
          </p>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              Нийт: <span className="font-semibold text-foreground">{products.length}</span> бүтээгдэхүүн
              {filteredProducts.length !== products.length && (
                <span className="ml-2">
                  (Харуулж байна: <span className="font-semibold text-foreground">{filteredProducts.length}</span>)
                </span>
              )}
            </p>
          )}
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Бараа нэмэх
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Бүтээгдэхүүний нийт жагсаалт</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!isLoading && products.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Шүүлт (Filters)</h3>
                {(selectedCategory !== "all" || selectedStockStatus !== "all" || selectedBrand !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all")
                      setSelectedStockStatus("all")
                      setSelectedBrand("all")
                    }}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Цэвэрлэх
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ангилалаар шүүх</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Бүх ангилал" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүх ангилал</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Брэндээр шүүх</Label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Бүх брэнд" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүх брэнд</SelectItem>
                      {uniqueBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Нөөцөөр шүүх</Label>
                  <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Бүх нөөц" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүх нөөц</SelectItem>
                      <SelectItem value="inStock">Нөөцтэй (In Stock)</SelectItem>
                      <SelectItem value="outOfStock">Нөөцгүй (Out of Stock)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading products...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error}
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchProducts}
              >
                Retry
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Брэнд</TableHead>
                  <TableHead>Ангилал</TableHead>
                  <TableHead>Дэд ангилал</TableHead>
                  <TableHead>Модел дугаар</TableHead>
                  <TableHead>Өнгө</TableHead>
                  <TableHead>Хэмжээ</TableHead>
                  <TableHead>Үнэ</TableHead>
                  <TableHead>Нөөц</TableHead>
                  <TableHead className="text-right">Өөрчлөх</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      {products.length === 0 
                        ? "No products found. Add your first product to get started."
                        : "No products match the selected filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const sizeDisplay = Array.isArray(product.size) 
                      ? product.size.join(", ") 
                      : product.size || ""
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.subcategory}</TableCell>
                        <TableCell>{product["model number"] || "-"}</TableCell>
                        <TableCell>{product.color}</TableCell>
                        <TableCell>{sizeDisplay}</TableCell>
                        <TableCell>{product.price}₮</TableCell>
                        <TableCell>{product.stock}</TableCell>
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
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
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
                <Label htmlFor="name">Product Name (Нэр)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Ангилал</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="ХАБ хувцас хэрэгсэл"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Дэд ангилал</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) =>
                      setFormData({ ...formData, subcategory: e.target.value })
                    }
                    placeholder="Толгойн хамгаалалт"
                    required
                  />
                </div>
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
                  <Label htmlFor="modelNumber">Модел дугаар</Label>
                  <Input
                    id="modelNumber"
                    value={formData.modelNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, modelNumber: e.target.value })
                    }
                    placeholder="MC375xx/A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="grid gap-2">
                  <Label htmlFor="size">Size (Хэмжээ) - Comma separated</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    placeholder="M, L, XL, XXL"
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
                  <Label htmlFor="stock">Stock Quantity (Нөөц)</Label>
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
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? "Saving..." 
                  : editingProduct 
                    ? "Save Changes" 
                    : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

