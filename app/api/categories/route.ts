import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sort: "asc" }
    })
    return NextResponse.json(categories)
  } catch (error) {
    return handleApiError(error)
  }
}
