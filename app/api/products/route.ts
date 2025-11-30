import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// GET - Fetch all products (with optional filters)
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching products from Firestore...");
    
    // Check if db is initialized
    if (!db) {
      throw new Error("Firestore database is not initialized. Check Firebase Admin configuration.");
    }
    
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const stockStatus = searchParams.get("stockStatus");
    const cat = searchParams.get("cat");
    const subcat = searchParams.get("subcat");

    // Start with base query
    let query: admin.firestore.Query = db.collection("products");

    // Add filters if provided
    if (categoryId) {
      query = query.where("categoryId", "==", categoryId);
    }
    if (stockStatus) {
      query = query.where("stockStatus", "==", stockStatus);
    }
    if (cat) {
      query = query.where("cat", "==", cat);
    }
    if (subcat) {
      query = query.where("subcat", "==", subcat);
    }

    // Execute query
    console.log("Executing Firestore query...");
    const productsSnapshot = await query.get();
    console.log(`Found ${productsSnapshot.docs.length} products`);
    
    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ 
      success: true, 
      data: products,
      count: products.length 
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Failed to fetch products",
        code: error?.code,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price, stock, brand, color, size, cat, subcat, "model number": modelNumber } = body;

    const productData = {
      name,
      price: typeof price === 'number' ? price : parseFloat(price),
      stock: typeof stock === 'number' ? stock : parseInt(stock),
      brand,
      color,
      size: Array.isArray(size) ? size : size,
      cat,
      subcat,
      "model number": modelNumber || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("products").add(productData);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...productData },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}

