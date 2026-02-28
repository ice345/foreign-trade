import { z } from "zod"

export const createResourceSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题过长"),
  description: z.string().min(1, "描述不能为空").max(5000, "描述过长"),
  category: z.string().min(1, "分类不能为空"),
  country: z.string().min(1, "国家不能为空"),
  platform: z.string().min(1, "平台不能为空"),
  link: z.string().url("链接格式不正确").refine(
    (url) => url.startsWith("https://"),
    { message: "链接必须以 https:// 开头" }
  ),
  image: z.string().url().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  badge: z.string().max(50).optional().nullable(),
  followers: z.number().int().min(0).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  status: z.enum(["ACTIVE", "HIDDEN", "SOLD_OUT"]).optional().default("ACTIVE"),
  categoryId: z.string().optional().nullable()
})

export const updateResourceSchema = createResourceSchema.partial()

export type CreateResourceInput = z.infer<typeof createResourceSchema>
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>
