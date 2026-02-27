import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { uploadToImgBB } from "@/lib/imgbb"
import { allowedTypes, maxSize } from "@/lib/validations/upload"

export async function POST(req: Request) {
  try {
    await requireUser()

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "缺少文件" }, { status: 400 })
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 JPEG / PNG / WebP 格式" },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "文件大小不能超过 5MB" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    const name = file.name.replace(/\.[^.]+$/, "")

    const result = await uploadToImgBB(base64, name)

    return NextResponse.json({ url: result.url })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : "上传失败"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
