import { z } from "zod"

export const topUpSchema = z.object({
  userId: z.string().min(1, "用户 ID 不能为空"),
  amount: z.number().positive("金额必须大于 0"),
  description: z.string().min(1, "描述不能为空").max(200)
})
