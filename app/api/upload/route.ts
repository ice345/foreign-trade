import crypto from "crypto"
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { deleteObject, putObject } from "@/lib/r2"
import {
  fileUrl,
  getUploadPolicy,
  markObjectFailed,
  markObjectReady,
  reserveObject,
  storageLimits
} from "@/lib/storage"
import { normalizeUploadedImage } from "@/lib/image-processing"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let reserved: { id: string; key: string } | null = null
  try {
    const user = await requireUser()
    const formData = await req.formData()
    const file = formData.get("file")
    const folder = formData.get("folder")

    if (!(file instanceof File) || typeof folder !== "string") {
      return NextResponse.json({ error: "缺少文件或上传用途" }, { status: 400 })
    }

    const policy = getUploadPolicy(folder)
    if (!policy || (policy.adminOnly && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "不允许的上传用途" }, { status: 403 })
    }
    if (file.size < 1 || file.size > storageLimits.maxFileBytes) {
      return NextResponse.json({ error: "文件大小不能超过 4MB" }, { status: 413 })
    }

    const source = Buffer.from(await file.arrayBuffer())
    const output = await normalizeUploadedImage(source, {
      maxBytes: storageLimits.maxFileBytes,
      screenshot: policy.purpose.includes("SCREENSHOT")
    })

    const checksum = crypto.createHash("sha256").update(output).digest("hex")
    reserved = await reserveObject({
      ownerId: user.id,
      purpose: policy.purpose,
      visibility: policy.visibility,
      size: output.length,
      checksum
    })

    await putObject(reserved.key, output, "image/webp")
    await markObjectReady(reserved.id)

    return NextResponse.json({ fileId: reserved.id, url: fileUrl(reserved.id) })
  } catch (error) {
    if (reserved) {
      await Promise.allSettled([markObjectFailed(reserved.id), deleteObject(reserved.key)])
    }
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      if (error.message === "UNSUPPORTED_IMAGE") {
        return NextResponse.json({ error: "仅支持真实的 JPEG / PNG / WebP 图片" }, { status: 400 })
      }
      if (error.message === "IMAGE_DIMENSIONS") {
        return NextResponse.json({ error: "图片尺寸过大" }, { status: 400 })
      }
      if (error.message === "NORMALIZED_FILE_TOO_LARGE") {
        return NextResponse.json({ error: "压缩后的图片仍超过 4MB" }, { status: 413 })
      }
      if (error.message.startsWith("STORAGE_")) {
        return NextResponse.json({ error: "存储额度已达到安全上限" }, { status: 429 })
      }
    }
    console.error("[R2 Upload Error]", error)
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 })
  }
}
