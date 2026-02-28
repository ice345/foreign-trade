import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "分类名称不能为空").max(50, "分类名称过长"),
  sort: z.number().int().min(0).optional().default(0)
})

export type CategoryInput = z.infer<typeof categorySchema>
