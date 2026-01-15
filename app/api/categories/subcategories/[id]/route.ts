import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// GET - Fetch a single subcategory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const doc = await db.collection("subcategories").doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Subcategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error: any) {
    console.error("[Categories API] Error fetching subcategory:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch subcategory",
      },
      { status: 500 }
    );
  }
}

// PUT - Update a subcategory
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const data = await request.json();
    
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.mainCategoryId !== undefined) updateData.mainCategoryId = data.mainCategoryId;

    await db.collection("subcategories").doc(id).update(updateData);

    const updatedDoc = await db.collection("subcategories").doc(id).get();

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error: any) {
    console.error("[Categories API] Error updating subcategory:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update subcategory",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subcategory
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    await db.collection("subcategories").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error: any) {
    console.error("[Categories API] Error deleting subcategory:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete subcategory",
      },
      { status: 500 }
    );
  }
}
