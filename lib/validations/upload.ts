import { z } from "zod"

const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
const maxSize = 5 * 1024 * 1024 // 5MB

export const uploadSchema = z.object({
  filename: z.string().min(1, "文件名不能为空"),
  contentType: z.string().refine(
    (t) => allowedTypes.includes(t),
    "仅支持 JPEG / PNG / WebP 格式"
  ),
  folder: z.string().min(1).default("uploads")
})

export { maxSize, allowedTypes }
