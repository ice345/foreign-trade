import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { getObject } from "@/lib/r2"
import { consumeReadOperation } from "@/lib/storage"
import { canReadFile } from "@/lib/file-access"

export const runtime = "nodejs"

type Props = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  try {
    const { id } = await params
    const object = await prisma.storedObject.findFirst({
      where: { id, status: "READY" }
    })
    if (!object) return new NextResponse(null, { status: 404 })

    if (object.visibility !== "PUBLIC") {
      let user = null
      try {
        user = await requireUser()
      } catch {
        // Unauthorized private files deliberately look absent.
      }
      if (!canReadFile(object, user)) return new NextResponse(null, { status: 404 })
    }

    await consumeReadOperation()
    const result = await getObject(object.key)
    if (!result.Body) return new NextResponse(null, { status: 404 })
    const bytes = await result.Body.transformToByteArray()
    const responseBody = Uint8Array.from(bytes).buffer

    return new NextResponse(responseBody, {
      headers: {
        "Content-Type": object.contentType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": object.visibility === "PUBLIC"
          ? "public, max-age=31536000, immutable"
          : "private, no-store"
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === "STORAGE_READ_LIMIT") {
      return NextResponse.json({ error: "文件读取额度已达到安全上限" }, { status: 429 })
    }
    console.error("[R2 File Error]", error)
    return new NextResponse(null, { status: 500 })
  }
}
