import { z } from "zod"

export const updateProfileSchema = z.object({
  nickname: z.string().max(50, "昵称过长").optional(),
  avatar: z.string().url("头像链接格式不正确").optional().nullable()
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(8, "新密码至少 8 位").max(128, "密码过长")
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "新密码不能与当前密码相同",
  path: ["newPassword"]
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
