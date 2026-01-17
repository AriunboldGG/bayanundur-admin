import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

type DecrementItem = {
  productId: string;
  quantity: number;
};

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Firestore database is not initialized.");
    }

    const body = await request.json();
    const items: DecrementItem[] = Array.isArray(body?.items) ? body.items : [];

    const normalizedItems = items
      .map((item) => ({
        productId: String(item.productId || "").trim(),
        quantity: Number(item.quantity || 0),
      }))
      .filter((item) => item.productId && item.quantity > 0);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid items provided" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await db.runTransaction(async (transaction) => {
      for (const item of normalizedItems) {
        const productRef = db.collection("products").doc(item.productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const data = productSnap.data() || {};
        const currentStock = Number(data.stock ?? 0);
        const nextStock = Math.max(0, currentStock - item.quantity);

        transaction.update(productRef, {
          stock: nextStock,
          updatedAt: now,
        });
      }
    });

    return NextResponse.json({ success: true, count: normalizedItems.length });
  } catch (error: any) {
    console.error("[Products API] Error decrementing stock:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to decrement stock",
        code: error?.code,
      },
      { status: 500 }
    );
  }
}
