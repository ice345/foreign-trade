import { z } from "zod"

export const tagSchema = z.object({
  name: z.string().min(1, "标签名称不能为空").max(50, "标签名称过长"),
  sort: z.number().int().min(0).optional().default(0)
})

export type TagInput = z.infer<typeof tagSchema>
