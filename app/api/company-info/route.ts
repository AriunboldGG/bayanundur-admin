import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"

const COLLECTION = "companyInfo"

export async function GET() {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy("createdAt", "desc").get()
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error fetching company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch company info" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const now = new Date().toISOString()

    const payload = {
      address: String(body?.address || "").trim(),
      company_phone: String(body?.company_phone || "").trim(),
      email: String(body?.email || "").trim(),
      fb: String(body?.fb || "").trim(),
      mobile_phone: String(body?.mobile_phone || "").trim(),
      wechat: String(body?.wechat || "").trim(),
      whatsup: String(body?.whatsup || "").trim(),
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await db.collection(COLLECTION).add(payload)
    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...payload },
    })
  } catch (error: any) {
    console.error("[CompanyInfo API] Error creating company info:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create company info" },
      { status: 500 }
    )
  }
}
