import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { sort: "asc" }
    })
    return NextResponse.json(tags)
  } catch (error) {
    return handleApiError(error)
  }
}
