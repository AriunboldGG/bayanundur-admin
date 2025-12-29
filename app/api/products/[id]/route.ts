import { NextRequest, NextResponse } from "next/server";
import { db, getStorageBucket } from "@/lib/firebase-admin";

// GET - Get a single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// Helper function to upload images to Firebase Storage
async function uploadImagesToStorage(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  
  let bucket;
  try {
    bucket = getStorageBucket();
    // Check if bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      console.warn(`Storage bucket "${bucket.name}" does not exist. Attempting to create it...`);
      try {
        // Try to create the bucket (this might fail if user doesn't have permissions)
        await bucket.create();
        console.log(`Successfully created storage bucket: ${bucket.name}`);
      } catch (createError: any) {
        console.error("Failed to create bucket:", createError);
        throw new Error(
          `Storage bucket "${bucket.name}" does not exist and could not be created automatically. ` +
          `Please enable Firebase Storage in Firebase Console: ` +
          `https://console.firebase.google.com/project/bayanundur-backend/storage ` +
          `The bucket will be created automatically when you enable Storage.`
        );
      }
    }
  } catch (error: any) {
    console.error("Error accessing storage bucket:", error);
    const bucketName = bucket?.name || 'unknown';
    
    // Provide helpful error message
    if (error.message.includes('does not exist')) {
      throw error; // Re-throw our custom error
    }
    
    throw new Error(`Storage bucket error (${bucketName}): ${error.message || 'Bucket not accessible. Please check Firebase Storage configuration.'}`);
  }
  
  const uploadPromises = files.map(async (file) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `products/${timestamp}-${randomString}.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Upload to Firebase Storage
      const fileRef = bucket.file(fileName);
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      return publicUrl;
    } catch (uploadError: any) {
      console.error(`Error uploading file ${file.name}:`, uploadError);
      throw new Error(`Failed to upload ${file.name}: ${uploadError.message || 'Unknown error'}`);
    }
  });

  return Promise.all(uploadPromises);
}

// PUT - Update a product (supports both JSON and FormData)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const contentType = request.headers.get("content-type") || "";
    
    let productData: any;
    let imageUrls: string[] = [];

    // Check if request is FormData (multipart/form-data)
    // Note: Browser automatically sets Content-Type with boundary when using FormData
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      
      // Get existing product to preserve existing images
      const existingProduct = await db.collection("products").doc(id).get();
      const existingData = existingProduct.exists ? existingProduct.data() : {};
      const existingImages = existingData?.images || [];
      
      // Extract product fields from FormData
      productData = {
        name: formData.get("name") as string,
        code: formData.get("code") as string || "",
        price: parseFloat(formData.get("price") as string),
        stock: parseInt(formData.get("stock") as string),
        brand: formData.get("brand") as string,
        color: formData.get("color") as string,
        size: formData.get("size") ? (formData.get("size") as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [],
        material: formData.get("material") as string || "",
        description: formData.get("description") as string || "",
        feature: formData.get("feature") as string || "",
        mainCategory: formData.get("mainCategory") as string || "",
        category: formData.get("category") as string,
        subcategory: formData.get("subcategory") as string || "",
        "model number": formData.get("modelNumber") as string || "",
        updatedAt: new Date().toISOString(),
      };

      // Extract image files from FormData
      const imageFiles: File[] = [];
      const imageFilesData = formData.getAll("images") as File[];
      
      for (const file of imageFilesData) {
        if (file instanceof File && file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }

      // Upload new images to Firebase Storage
      if (imageFiles.length > 0) {
        imageUrls = await uploadImagesToStorage(imageFiles);
      }

      // Get existing image URLs from FormData (if any were preserved)
      const existingImageUrls = formData.get("existingImages") as string;
      const preservedImages = existingImageUrls ? JSON.parse(existingImageUrls) : existingImages;

      // Combine preserved and newly uploaded images
      productData.images = [...preservedImages, ...imageUrls];
    } else {
      // Handle JSON request (backward compatibility)
      const body = await request.json();
      const { 
        name, 
        price, 
        stock, 
        brand, 
        color, 
        size, 
        category, 
        subcategory, 
        "model number": modelNumber,
        images,
        code,
        material,
        description,
        feature,
        mainCategory,
      } = body;

      productData = {
        name,
        code: code || "",
        price: typeof price === 'number' ? price : parseFloat(price),
        stock: typeof stock === 'number' ? stock : parseInt(stock),
        brand,
        color,
        size: Array.isArray(size) ? size : (size ? size.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : []),
        material: material || "",
        description: description || "",
        feature: feature || "",
        mainCategory: mainCategory || "",
        category: category || "",
        subcategory: subcategory || "",
        "model number": modelNumber || "",
        images: images || [],
        updatedAt: new Date().toISOString(),
      };
    }

    await db.collection("products").doc(id).update(productData);

    return NextResponse.json({
      success: true,
      data: { id, ...productData },
    });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await db.collection("products").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

