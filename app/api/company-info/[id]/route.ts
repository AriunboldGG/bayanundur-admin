import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"

const COLLECTION = "companyInfo"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const doc = await db.collection(COLLECTION).doc(id).get()
    if (!doc.exists) {
      return NextResponse.json({ success: false, error: "Company info not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: { id: doc.id, ...doc.data() } })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error fetching company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch company info" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const body = await request.json()

    const updateData: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    }

    if (body?.address !== undefined) updateData.address = String(body.address).trim()
    if (body?.company_phone !== undefined) updateData.company_phone = String(body.company_phone).trim()
    if (body?.email !== undefined) updateData.email = String(body.email).trim()
    if (body?.fb !== undefined) updateData.fb = String(body.fb).trim()
    if (body?.mobile_phone !== undefined) updateData.mobile_phone = String(body.mobile_phone).trim()
    if (body?.wechat !== undefined) updateData.wechat = String(body.wechat).trim()
    if (body?.whatsup !== undefined) updateData.whatsup = String(body.whatsup).trim()

    await db.collection(COLLECTION).doc(id).update(updateData)
    const updatedDoc = await db.collection(COLLECTION).doc(id).get()
    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error updating company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update company info" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    await db.collection(COLLECTION).doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error deleting company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete company info" },
      { status: 500 }
    )
  }
}
