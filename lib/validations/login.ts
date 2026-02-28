import { z } from "zod"

export const loginSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, "请输入密码").max(128, "密码过长")
}).refine(
  (data) => data.identifier || data.email || data.phone,
  { message: "请输入邮箱或手机号", path: ["identifier"] }
)

export type LoginInput = z.infer<typeof loginSchema>
