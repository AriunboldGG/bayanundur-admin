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
import { Plus, Pencil, Trash2, X, Upload, XCircle, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { categories, Category } from "@/lib/categories"

interface Product {
  id: string
  name: string
  code?: string
  price: number
  stock: number
  brand: string
  color: string
  size: string[] | string // Can be array or string
  material?: string
  description?: string
  feature?: string
  mainCategory?: string
  category: string // Ангилал (Category)
  subcategory: string // Дэд ангилал (Subcategory)
  "model number"?: string // Модел дугаар (Model number)
  images?: string[] // Product images URLs
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("all")
  const [selectedBrand, setSelectedBrand] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "", // Барааны нэр: Код
    price: "",
    stock: "",
    brand: "",
    color: "",
    size: "", // Will be stored as comma-separated string, converted to array
    material: "", // Материал
    description: "", // Тодорхойлолт
    feature: "", // Онцлог
    mainCategory: "", // Main category ID
    category: "", // Ангилал (subcategory)
    subcategory: "", // Дэд ангилал (sub-subcategory if exists)
    modelNumber: "", // Модел дугаар
  })
  
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("")
  const [availableSubcategories, setAvailableSubcategories] = useState<Category[]>([])
  const [availableSubSubcategories, setAvailableSubSubcategories] = useState<Category[]>([])
  const [productImages, setProductImages] = useState<string[]>([]) // Array of image URLs
  const [imageFiles, setImageFiles] = useState<File[]>([]) // Array of File objects for new uploads
  const [imagePreviews, setImagePreviews] = useState<string[]>([]) // Array of preview URLs
  const [isUploadingImages, setIsUploadingImages] = useState(false)

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
          code: product.code || "",
          price: product.price || 0,
          stock: product.stock || 0,
          brand: product.brand || "",
          color: product.color || "",
          size: Array.isArray(product.size) 
            ? product.size 
            : typeof product.size === 'string' 
              ? product.size.split(',').map((s: string) => s.trim())
              : [],
          material: product.material || "",
          description: product.description || "",
          feature: product.feature || "",
          mainCategory: product.mainCategory || "",
          category: product.category || "",
          subcategory: product.subcategory || "",
          "model number": product["model number"] || product.modelNumber || "",
          images: product.images || [],
        }))
        setProducts(mappedProducts)
      } else {
        const errorMsg = result.error || "Failed to fetch products"
        // Provide more helpful error message for production issues
        if (errorMsg.includes("Firebase") || errorMsg.includes("environment") || errorMsg.includes("configuration")) {
          setError(`${errorMsg}. Please check that Firebase environment variables are configured in production.`)
        } else {
          setError(errorMsg)
        }
      }
    } catch (err: any) {
      console.error("Error fetching products:", err)
      let errorMsg = err?.message || "Failed to load products. Please try again."
      // Check if it's a network/API error
      if (err?.message?.includes("HTTP error") || err?.message?.includes("fetch")) {
        errorMsg = "Unable to connect to the server. Please check your network connection and try again."
      }
      setError(errorMsg)
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
      
      // Set all existing product data
      setFormData({
        name: product.name || "",
        code: product.code || "",
        price: product.price.toString(),
        stock: product.stock.toString(),
        brand: product.brand || "",
        color: product.color || "",
        size: sizeValue,
        material: product.material || "",
        description: product.description || "",
        feature: product.feature || "",
        mainCategory: product.mainCategory || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        modelNumber: product["model number"] || "",
      })
      
      // Set existing images
      setProductImages(product.images || [])
      setImagePreviews(product.images || [])
      setImageFiles([])
      
      // Set main category and load subcategories if mainCategory exists
      if (product.mainCategory) {
        setSelectedMainCategory(product.mainCategory)
        const mainCat = categories.find(cat => cat.id === product.mainCategory)
        if (mainCat && mainCat.children) {
          setAvailableSubcategories(mainCat.children)
          
          // If category is set, check for sub-subcategories
          if (product.category) {
            const subCat = mainCat.children.find(sub => sub.id === product.category)
            if (subCat && subCat.children) {
              setAvailableSubSubcategories(subCat.children)
            } else {
              setAvailableSubSubcategories([])
            }
          } else {
            setAvailableSubSubcategories([])
          }
        }
      } else {
        setSelectedMainCategory("")
        setAvailableSubcategories([])
        setAvailableSubSubcategories([])
      }
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        code: "",
        price: "",
        stock: "",
        brand: "",
        color: "",
        size: "",
        material: "",
        description: "",
        feature: "",
        mainCategory: "",
        category: "",
        subcategory: "",
        modelNumber: "",
      })
      setSelectedMainCategory("")
      setAvailableSubcategories([])
      setAvailableSubSubcategories([])
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData({
      name: "",
      code: "",
      price: "",
      stock: "",
      brand: "",
      color: "",
      size: "",
      material: "",
      description: "",
      feature: "",
      mainCategory: "",
      category: "",
      subcategory: "",
      modelNumber: "",
    })
    setSelectedMainCategory("")
    setAvailableSubcategories([])
    setAvailableSubSubcategories([])
    setProductImages([])
    setImageFiles([])
    setImagePreviews([])
  }
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const newFiles = Array.from(files)
    const totalImages = imagePreviews.length + newFiles.length
    
    if (totalImages > 5) {
      alert("Та хамгийн ихдээ 5 зураг нэмж болно (You can add maximum 5 images)")
      return
    }
    
    const newPreviews: string[] = []
    const validFiles: File[] = []
    
    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        validFiles.push(file)
        const preview = URL.createObjectURL(file)
        newPreviews.push(preview)
      }
    })
    
    setImageFiles([...imageFiles, ...validFiles])
    setImagePreviews([...imagePreviews, ...newPreviews])
    
    // Reset input
    e.target.value = ''
  }
  
  const handleRemoveImage = (index: number) => {
    // Remove from previews
    const newPreviews = [...imagePreviews]
    const previewToRemove = newPreviews[index]
    
    // Revoke object URL if it's a preview
    if (previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove)
    }
    
    newPreviews.splice(index, 1)
    setImagePreviews(newPreviews)
    
    // Remove from files if it's a new file
    if (index < imageFiles.length) {
      const newFiles = [...imageFiles]
      newFiles.splice(index, 1)
      setImageFiles(newFiles)
    } else {
      // Remove from existing images
      const newImages = [...productImages]
      newImages.splice(index - imageFiles.length, 1)
      setProductImages(newImages)
    }
  }
  
  const handleMainCategoryChange = (mainCategoryId: string) => {
    setSelectedMainCategory(mainCategoryId)
    setFormData({ ...formData, mainCategory: mainCategoryId, category: "", subcategory: "" })
    
    // Find the selected main category
    const mainCat = categories.find(cat => cat.id === mainCategoryId)
    if (mainCat && mainCat.children) {
      setAvailableSubcategories(mainCat.children)
      setAvailableSubSubcategories([])
    } else {
      setAvailableSubcategories([])
      setAvailableSubSubcategories([])
    }
  }
  
  const handleSubcategoryChange = (subcategoryId: string) => {
    setFormData({ ...formData, category: subcategoryId, subcategory: "" })
    
    // Find the selected subcategory
    const mainCat = categories.find(cat => cat.id === selectedMainCategory)
    if (mainCat && mainCat.children) {
      const subCat = mainCat.children.find(sub => sub.id === subcategoryId)
      if (subCat && subCat.children) {
        setAvailableSubSubcategories(subCat.children)
      } else {
        setAvailableSubSubcategories([])
      }
    }
  }
  
  const handleSubSubcategoryChange = (subSubcategoryId: string) => {
    setFormData({ ...formData, subcategory: subSubcategoryId })
  }
  
  // Check if fields should be shown based on main category selection or if editing
  const shouldShowFields = () => {
    // If editing, always show fields (main category is already set)
    if (editingProduct) {
      return true
    }
    // For new products, require main category selection
    return selectedMainCategory !== ""
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMainCategory) {
      alert("Үндсэн ангилал сонгоно уу (Please select main category)")
      return
    }
    
    if (!formData.category) {
      alert("Ангилал сонгоно уу (Please select category)")
      return
    }
    
    if (!shouldShowFields()) {
      alert("Үндсэн ангилал сонгоно уу (Please select main category first)")
      return
    }
    
    setIsSubmitting(true)
    setIsUploadingImages(true)
    
    try {
      // Convert size string to array
      const sizeArray = formData.size
        ? formData.size.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : []
      
      // Create FormData with product data and images
      const formDataToSend = new FormData()
      
      // Append product fields
      formDataToSend.append('name', formData.name)
      formDataToSend.append('code', formData.code)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('stock', formData.stock)
      formDataToSend.append('brand', formData.brand)
      formDataToSend.append('color', formData.color)
      formDataToSend.append('size', sizeArray.join(','))
      formDataToSend.append('material', formData.material)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('feature', formData.feature)
      formDataToSend.append('mainCategory', selectedMainCategory)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('subcategory', formData.subcategory || '')
      formDataToSend.append('modelNumber', formData.modelNumber)
      
      // Append new image files
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file)
      })
      
      // For updates, include existing images
      if (editingProduct && productImages.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(productImages))
      }

      if (editingProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          body: formDataToSend,
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
          body: formDataToSend,
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
      setIsUploadingImages(false)
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

  // Filter products based on selected filters and search query
  const filteredProducts = products.filter((product) => {
    // Search filter - search by product name (case-insensitive)
    const searchMatch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.code && product.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory
    const brandMatch = selectedBrand === "all" || product.brand === selectedBrand
    const stockMatch = 
      selectedStockStatus === "all" 
        ? true 
        : selectedStockStatus === "inStock" 
          ? product.stock > 0 
          : product.stock === 0
    
    return searchMatch && categoryMatch && brandMatch && stockMatch
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
                {(selectedCategory !== "all" || selectedStockStatus !== "all" || selectedBrand !== "all" || searchQuery !== "") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all")
                      setSelectedStockStatus("all")
                      setSelectedBrand("all")
                      setSearchQuery("")
                    }}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Цэвэрлэх
                  </Button>
                )}
              </div>
              
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Барааны нэрээр хайх... (Search by product name...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
              {/* Main Category Selection - Always show as dropdown (editable) */}
              <div className="grid gap-2">
                <Label htmlFor="mainCategory">Үндсэн ангилал (Main Category) *</Label>
                <Select
                  value={selectedMainCategory}
                  onValueChange={handleMainCategoryChange}
                  required
                >
                  <SelectTrigger id="mainCategory">
                    <SelectValue placeholder="Үндсэн ангилал сонгох" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory Selection - Show after main category is selected or when editing */}
              {((selectedMainCategory && availableSubcategories.length > 0) || (editingProduct && formData.category)) && (
                <div className="grid gap-2">
                  <Label htmlFor="category">Ангилал (Category) *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleSubcategoryChange}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Ангилал сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((subCat) => (
                        <SelectItem key={subCat.id} value={subCat.id}>
                          {subCat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Sub-subcategory Selection - Show if subcategory has children or when editing with subcategory */}
              {((formData.category && availableSubSubcategories.length > 0) || (editingProduct && formData.subcategory)) && (
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Дэд ангилал (Subcategory)</Label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={handleSubSubcategoryChange}
                  >
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Дэд ангилал сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubSubcategories.map((subSubCat) => (
                        <SelectItem key={subSubCat.id} value={subSubCat.id}>
                          {subSubCat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dynamic Fields - Show only after main category is selected */}
              {shouldShowFields() && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Барааны нэр (Product Name) *</Label>
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
                    <Label htmlFor="code">Код (Code)</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      placeholder="Product code"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="brand">Брэнд (Brand) *</Label>
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
                      <Label htmlFor="color">Өнгө (Color) *</Label>
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
                      <Label htmlFor="size">Хэмжээ (Size) *</Label>
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
                    <div className="grid gap-2">
                      <Label htmlFor="material">Материал (Material) *</Label>
                      <Input
                        id="material"
                        value={formData.material}
                        onChange={(e) =>
                          setFormData({ ...formData, material: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Тодорхойлолт (Description) *</Label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="feature">Онцлог (Feature) *</Label>
                    <textarea
                      id="feature"
                      value={formData.feature}
                      onChange={(e) =>
                        setFormData({ ...formData, feature: e.target.value })
                      }
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="modelNumber">Модел дугаар (Model Number)</Label>
                      <Input
                        id="modelNumber"
                        value={formData.modelNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, modelNumber: e.target.value })
                        }
                        placeholder="MC375xx/A"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Үнэ (Price) (₮) *</Label>
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
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="stock">Нөөц (Stock Quantity) *</Label>
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

                  {/* Image Upload Section */}
                  <div className="grid gap-2">
                    <Label>Зураг (Images) - Хамгийн ихдээ 5 (Maximum 5)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={imagePreviews.length >= 5 || isUploadingImages}
                        />
                        <label
                          htmlFor="image-upload"
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            imagePreviews.length >= 5 || isUploadingImages
                              ? "border-muted-foreground/25 bg-muted/50 cursor-not-allowed"
                              : "border-primary/50 bg-muted/30 hover:bg-muted/50"
                          }`}
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground text-center">
                            {imagePreviews.length >= 5
                              ? "Хамгийн ихдээ 5 зураг нэмж болно (Maximum 5 images)"
                              : "Зураг сонгох эсвэл энд чирнэ үү (Click or drag images here)"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {imagePreviews.length}/5 зураг (images)
                          </p>
                        </label>
                      </div>

                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-5 gap-2 mt-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-md border"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={isUploadingImages}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
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

