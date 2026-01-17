import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"

const DEFAULT_PRODUCT_SECTORS = [
  "Барилга",
  "Гагнуур",
  "Зам",
  "Уул уурхай",
  "Үйлдвэр",
  "Цахилгаан",
]

export async function GET() {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.")
    }

    const snapshot = await db.collection("product_sectors").orderBy("order", "asc").get()

    if (snapshot.empty) {
      const batch = db.batch()
      DEFAULT_PRODUCT_SECTORS.forEach((name, index) => {
        const docRef = db.collection("product_sectors").doc()
        batch.set(docRef, {
          name,
          order: index + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      })
      await batch.commit()
    }

    const refreshedSnapshot = await db.collection("product_sectors").orderBy("order", "asc").get()
    const sectors = refreshedSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({
      success: true,
      data: sectors,
      count: sectors.length,
    })
  } catch (error: any) {
    console.error("[Product Sectors API] Error fetching sectors:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch product sectors" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.")
    }

    const data = await request.json()
    if (!data?.name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      )
    }

    const docRef = await db.collection("product_sectors").add({
      name: data.name,
      order: data.order || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, name: data.name, order: data.order || 0 },
    })
  } catch (error: any) {
    console.error("[Product Sectors API] Error creating sector:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create product sector" },
      { status: 500 }
    )
  }
}
