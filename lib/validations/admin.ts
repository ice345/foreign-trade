import { z } from "zod"

export const deleteUserSchema = z.object({
  userId: z.string().min(1, "用户 ID 不能为空"),
  reason: z
    .string()
    .min(1, "请填写删除原因")
    .max(500, "删除原因不能超过 500 字")
})

export type DeleteUserInput = z.infer<typeof deleteUserSchema>
