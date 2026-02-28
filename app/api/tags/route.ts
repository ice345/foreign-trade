import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { sort: "asc" }
  })
  return NextResponse.json(tags)
}
