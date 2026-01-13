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
import { Plus, Pencil, Trash2, X, Upload, XCircle, Search, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { categories, Category } from "@/lib/categories"

interface Product {
  id: string
  name: string
  price: number
  stock: number
  brand: string
  color: string[] | string // Can be array or string
  size: string[] | string // Can be array or string
  material?: string
  description?: string
  feature?: string
  mainCategory?: string
  category: string // Ангилал (Category)
  subcategory: string // Дэд ангилал (Subcategory)
  "model number"?: string // Модел дугаар (Model number)
  productTypes?: string[] // Product types array (BEST SELLER, NEW, etc.)
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
    productTypes: [] as string[], // Product types array
  })
  
  // Product types options
  const productTypeOptions = [
    { value: "BEST SELLER", label: "BEST SELLER" },
    { value: "NEW", label: "ШИНЭ (NEW)" },
    { value: "DISCOUNTED", label: "ХЯМДРАЛТАЙ (DISCOUNTED)" },
    { value: "PROMOTION", label: "ПРОМОУШН (PROMOTION)" },
    { value: "RECOMMEND", label: "САНАЛ БОЛГОХ (RECOMMEND)" },
  ]
  
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("")
  const [availableSubcategories, setAvailableSubcategories] = useState<Category[]>([])
  const [availableSubSubcategories, setAvailableSubSubcategories] = useState<Category[]>([])
  const [productImages, setProductImages] = useState<string[]>([]) // Array of image URLs
  const [imageFiles, setImageFiles] = useState<File[]>([]) // Array of File objects for new uploads
  const [imagePreviews, setImagePreviews] = useState<string[]>([]) // Array of preview URLs
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  
  // Separate state for colors and sizes arrays
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [colorInput, setColorInput] = useState("")
  const [sizeInput, setSizeInput] = useState("")

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
          color: Array.isArray(product.color) 
            ? product.color 
            : typeof product.color === 'string' 
              ? product.color.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
              : [],
          size: Array.isArray(product.size) 
            ? product.size 
            : typeof product.size === 'string' 
              ? product.size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
              : [],
          material: product.material || "",
          description: product.description || "",
          feature: product.feature || "",
          mainCategory: product.mainCategory || "",
          category: product.category || "",
          subcategory: product.subcategory || "",
          "model number": product["model number"] || product.model_number || product.modelNumber || "",
          productTypes: Array.isArray(product.productTypes) ? product.productTypes : [],
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
      // Convert size and color to arrays for the UI
      const sizeArray = Array.isArray(product.size) 
        ? product.size 
        : (product.size ? product.size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [])
      const colorArray = Array.isArray(product.color) 
        ? product.color 
        : (product.color ? product.color.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0) : [])
      
      setColors(colorArray)
      setSizes(sizeArray)
      setColorInput("")
      setSizeInput("")
      
      // Set all existing product data
      setFormData({
        name: product.name || "",
        price: product.price.toString(),
        stock: product.stock.toString(),
        brand: product.brand || "",
        color: "", // Will be managed by colors array
        size: "", // Will be managed by sizes array
        material: product.material || "",
        description: product.description || "",
        feature: product.feature || "",
        mainCategory: product.mainCategory || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        modelNumber: product["model number"] || "",
        productTypes: Array.isArray(product.productTypes) ? product.productTypes : [],
      })
      
      // Set existing images
      setProductImages(product.images || [])
      setImagePreviews(product.images || [])
      setImageFiles([])
      
      // Set main category and load subcategories if mainCategory exists
      // Handle both names (new format) and IDs (old format) for backward compatibility
      if (product.mainCategory) {
        // Try to find by ID first, then by name
        const mainCategoryId = getCategoryIdByName(product.mainCategory)
        setSelectedMainCategory(mainCategoryId)
        const mainCat = categories.find(cat => cat.id === mainCategoryId || cat.name === product.mainCategory)
        if (mainCat && mainCat.children) {
          setAvailableSubcategories(mainCat.children)
          
          // If category is set, check for sub-subcategories
          if (product.category) {
            const categoryId = getCategoryIdByName(product.category)
            // Update formData with ID for proper selection
            setFormData(prev => ({ ...prev, category: categoryId }))
            const subCat = mainCat.children.find(sub => sub.id === categoryId || sub.name === product.category)
            if (subCat && subCat.children) {
              setAvailableSubSubcategories(subCat.children)
              
              // If subcategory is set, update formData with ID
              if (product.subcategory) {
                const subcategoryId = getCategoryIdByName(product.subcategory)
                setFormData(prev => ({ ...prev, subcategory: subcategoryId }))
              }
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
        productTypes: [],
      })
      setSelectedMainCategory("")
      setAvailableSubcategories([])
      setAvailableSubSubcategories([])
      setColors([])
      setSizes([])
      setColorInput("")
      setSizeInput("")
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setColors([])
    setSizes([])
    setColorInput("")
    setSizeInput("")
    setFormData({
      name: "",
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
      productTypes: [],
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
  
  // Helper function to get category name by ID
  const getCategoryNameById = (categoryId: string): string => {
    if (!categoryId) return ""
    
    // If it's already a name (doesn't match ID pattern), return as is
    // ID patterns: "1", "1-2", "1-2-3" (numbers with optional dashes)
    const isIdPattern = /^\d+(-\d+)*$/.test(categoryId)
    if (!isIdPattern) {
      // Already a name, return as is
      return categoryId
    }
    
    // Check main categories (single digit like "1", "2", "3")
    const mainCat = categories.find(cat => cat.id === categoryId)
    if (mainCat) return mainCat.name
    
    // Check subcategories (format like "1-2", "2-1") and sub-subcategories (format like "1-2-3", "2-2-1")
    for (const mainCat of categories) {
      if (mainCat.children) {
        for (const subCat of mainCat.children) {
          // Check if this is the subcategory we're looking for
          if (subCat.id === categoryId) {
            return subCat.name
          }
          
          // Check sub-subcategories
          if (subCat.children) {
            const subSubCat = subCat.children.find(subSub => subSub.id === categoryId)
            if (subSubCat) return subSubCat.name
          }
        }
      }
    }
    
    // If not found, return the ID (shouldn't happen if IDs are correct)
    console.warn(`Category ID "${categoryId}" not found in categories structure`)
    return categoryId
  }
  
  // Helper function to find category ID by name (for loading existing products)
  const getCategoryIdByName = (categoryName: string): string => {
    if (!categoryName) return ""
    
    // Check main categories
    const mainCat = categories.find(cat => cat.name === categoryName)
    if (mainCat) return mainCat.id
    
    // Check subcategories and sub-subcategories
    for (const mainCat of categories) {
      if (mainCat.children) {
        for (const subCat of mainCat.children) {
          // Check if this is the subcategory we're looking for
          if (subCat.name === categoryName) {
            return subCat.id
          }
          
          // Check sub-subcategories
          if (subCat.children) {
            const subSubCat = subCat.children.find(subSub => subSub.name === categoryName)
            if (subSubCat) return subSubCat.id
          }
        }
      }
    }
    
    return categoryName // Fallback to name if not found (might be an ID from old data)
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
      // Use the arrays from state instead of parsing strings
      const sizeArray = sizes.filter(s => s.length > 0)
      const colorArray = colors.filter(c => c.length > 0)
      
      // Validate required fields including colors and sizes
      if (colorArray.length === 0 || sizeArray.length === 0) {
        alert("Өнгө болон хэмжээ нэмнэ үү (Please add at least one color and size)")
        setIsSubmitting(false)
        setIsUploadingImages(false)
        return
      }
      
      // Get category names from IDs - always convert IDs to names
      // The function will return the name if ID is found, or return the value as-is if it's already a name
      const mainCategoryName = getCategoryNameById(selectedMainCategory)
      const categoryName = getCategoryNameById(formData.category)
      const subcategoryName = formData.subcategory ? getCategoryNameById(formData.subcategory) : ""
      
      // Debug logging to verify conversion
      console.log("Category conversion:", {
        selectedMainCategory,
        mainCategoryName,
        categoryId: formData.category,
        categoryName,
        subcategoryId: formData.subcategory,
        subcategoryName
      })
      
      // Create FormData with product data and images
      const formDataToSend = new FormData()
      
      // Append product fields
      formDataToSend.append('name', formData.name)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('stock', formData.stock)
      formDataToSend.append('brand', formData.brand)
      formDataToSend.append('color', colorArray.join(','))
      formDataToSend.append('size', sizeArray.join(','))
      formDataToSend.append('material', formData.material)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('feature', formData.feature)
      formDataToSend.append('mainCategory', mainCategoryName) // Send name instead of ID
      formDataToSend.append('category', categoryName) // Send name instead of ID
      formDataToSend.append('subcategory', subcategoryName) // Send name instead of ID
      formDataToSend.append('model_number', formData.modelNumber)
      formDataToSend.append('productTypes', JSON.stringify(formData.productTypes))
      
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
                  <TableHead>Үндсэн ангилал</TableHead>
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
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
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
                    const colorDisplay = Array.isArray(product.color) 
                      ? product.color.join(", ") 
                      : product.color || ""
                    // Convert category IDs to names for display (handle both old IDs and new names)
                    // Check if it looks like an ID
                    // Main category: single digit like "1", "2", "3"
                    // Category: format like "1-2", "2-1"
                    // Subcategory: format like "1-2-3", "2-2-1"
                    const isMainCategoryId = product.mainCategory && /^\d+$/.test(product.mainCategory) && product.mainCategory.length <= 2
                    const isCategoryId = product.category && /^\d+-\d+$/.test(product.category)
                    const isSubcategoryId = product.subcategory && /^\d+-\d+-\d+$/.test(product.subcategory)
                    
                    const mainCategoryDisplay = product.mainCategory 
                      ? (isMainCategoryId ? getCategoryNameById(product.mainCategory) : product.mainCategory)
                      : ""
                    const categoryDisplay = product.category 
                      ? (isCategoryId ? getCategoryNameById(product.category) : product.category)
                      : ""
                    const subcategoryDisplay = product.subcategory 
                      ? (isSubcategoryId ? getCategoryNameById(product.subcategory) : product.subcategory)
                      : ""
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>{mainCategoryDisplay}</TableCell>
                        <TableCell>{categoryDisplay}</TableCell>
                        <TableCell>{subcategoryDisplay}</TableCell>
                        <TableCell>{product["model number"] || "-"}</TableCell>
                        <TableCell>{colorDisplay}</TableCell>
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
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          placeholder="Enter color (e.g., Red)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (colorInput.trim() && !colors.includes(colorInput.trim())) {
                                setColors([...colors, colorInput.trim()])
                                setColorInput("")
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (colorInput.trim() && !colors.includes(colorInput.trim())) {
                              setColors([...colors, colorInput.trim()])
                              setColorInput("")
                            }
                          }}
                          variant="outline"
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {colors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {colors.map((color, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                            >
                              <span>{color}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setColors(colors.filter((_, i) => i !== index))
                                }}
                                className="hover:text-blue-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {colors.length === 0 && (
                        <p className="text-xs text-muted-foreground">Add at least one color</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="size">Хэмжээ (Size) *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="size"
                          value={sizeInput}
                          onChange={(e) => setSizeInput(e.target.value)}
                          placeholder="Enter size (e.g., M)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
                                setSizes([...sizes, sizeInput.trim()])
                                setSizeInput("")
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) {
                              setSizes([...sizes, sizeInput.trim()])
                              setSizeInput("")
                            }
                          }}
                          variant="outline"
                          size="icon"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {sizes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sizes.map((size, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                            >
                              <span>{size}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSizes(sizes.filter((_, i) => i !== index))
                                }}
                                className="hover:text-green-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {sizes.length === 0 && (
                        <p className="text-xs text-muted-foreground">Add at least one size</p>
                      )}
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

                  {/* Product Types Multiselect */}
                  <div className="grid gap-2">
                    <Label>Бүтээгдэхүүний төрөл (Product Type)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {formData.productTypes.length > 0
                            ? `${formData.productTypes.length} төрөл сонгогдсон (${formData.productTypes.length} selected)`
                            : "Төрөл сонгох (Select types)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <div className="p-2 space-y-2">
                          {productTypeOptions.map((option) => {
                            const isSelected = formData.productTypes.includes(option.value);
                            return (
                              <div
                                key={option.value}
                                className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormData({
                                      ...formData,
                                      productTypes: formData.productTypes.filter(
                                        (type) => type !== option.value
                                      ),
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      productTypes: [...formData.productTypes, option.value],
                                    });
                                  }
                                }}
                              >
                                <div
                                  className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                    isSelected
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-input"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                <Label className="cursor-pointer flex-1">
                                  {option.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {formData.productTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.productTypes.map((type) => {
                          const option = productTypeOptions.find((opt) => opt.value === type);
                          return (
                            <div
                              key={type}
                              className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                            >
                              <span>{option?.label || type}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    productTypes: formData.productTypes.filter((t) => t !== type),
                                  });
                                }}
                                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

