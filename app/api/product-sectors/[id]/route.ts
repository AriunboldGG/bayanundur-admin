import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.")
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const data = await request.json()

    if (!data?.name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      )
    }

    await db.collection("product_sectors").doc(id).update({
      name: data.name,
      order: data.order || 0,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Product Sectors API] Error updating sector:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update product sector" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.")
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    await db.collection("product_sectors").doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Product Sectors API] Error deleting sector:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete product sector" },
      { status: 500 }
    )
  }
}
