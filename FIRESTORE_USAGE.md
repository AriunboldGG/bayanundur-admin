# Firestore Connection Guide

This guide explains how to connect and use Firestore Cloud Database in your Next.js application.

## Setup

The Firebase Admin SDK is already configured in `lib/firebase-admin.ts`. It uses the service account credentials from `permissions.json`.

## Connection

The Firestore database instance is exported from `lib/firebase-admin.ts`:

```typescript
import { db } from "@/lib/firebase-admin";
```

## Usage Examples

### 1. In API Routes (Server-Side)

Firebase Admin SDK only works on the server side. Use it in API routes:

```typescript
// app/api/products/route.ts
import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all products
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### 2. Create a Document

```typescript
const docRef = await db.collection("products").add({
  name: "Product Name",
  price: 100,
  stock: 50,
  createdAt: new Date().toISOString(),
});

console.log("Document ID:", docRef.id);
```

### 3. Read a Document

```typescript
// Get by ID
const doc = await db.collection("products").doc("document-id").get();
if (doc.exists) {
  console.log("Document data:", doc.data());
}

// Get all documents
const snapshot = await db.collection("products").get();
snapshot.forEach((doc) => {
  console.log(doc.id, "=>", doc.data());
});
```

### 4. Update a Document

```typescript
await db.collection("products").doc("document-id").update({
  price: 150,
  updatedAt: new Date().toISOString(),
});
```

### 5. Delete a Document

```typescript
await db.collection("products").doc("document-id").delete();
```

### 6. Query Documents

```typescript
// Query by field
const snapshot = await db
  .collection("products")
  .where("categoryId", "==", "1-1-1")
  .get();

// Query with multiple conditions
const snapshot = await db
  .collection("products")
  .where("stockStatus", "==", "Байгаа")
  .where("price", ">", 100)
  .get();
```

### 7. Using Helper Functions

Helper functions are available in `lib/firestore-helpers.ts`:

```typescript
import { 
  getAllDocuments, 
  getDocumentById, 
  createDocument,
  updateDocument,
  deleteDocument,
  getProductsByCategory 
} from "@/lib/firestore-helpers";

// Get all products
const products = await getAllDocuments("products");

// Get product by ID
const product = await getDocumentById("products", "product-id");

// Create product
const newProduct = await createDocument("products", {
  name: "New Product",
  price: 100,
});

// Update product
await updateDocument("products", "product-id", {
  price: 150,
});

// Delete product
await deleteDocument("products", "product-id");

// Get products by category
const categoryProducts = await getProductsByCategory("1-1-1");
```

## API Routes

API routes have been created for products:

- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product
- `PUT /api/products/[id]` - Update a product
- `DELETE /api/products/[id]` - Delete a product

### Example: Using API Routes from Client Components

```typescript
// In a client component
"use client";

const fetchProducts = async () => {
  const response = await fetch("/api/products");
  const result = await response.json();
  if (result.success) {
    setProducts(result.data);
  }
};

const createProduct = async (productData) => {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  const result = await response.json();
  return result;
};
```

## Important Notes

1. **Server-Side Only**: Firebase Admin SDK cannot be used in client components. Always use it in:
   - API routes (`app/api/*/route.ts`)
   - Server components
   - Server actions

2. **Client-Side**: Use API routes or the Firebase Client SDK for client-side operations.

3. **Security**: Never expose your `permissions.json` file. It's already in `.gitignore` for security.

4. **Data Structure**: Based on your Firestore console, products have:
   - `cat`: Category
   - `name`: Product name
   - `subcat`: Subcategory

   You may want to map these fields to match your application's data structure.

