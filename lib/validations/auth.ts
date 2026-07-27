import { z } from "zod"

export const sendCodeSchema = z
  .object({
    target: z.string().min(1, "请输入邮箱或手机号").max(254, "账号过长"),
    type: z.enum(["EMAIL", "PHONE"], { message: "类型必须为 EMAIL 或 PHONE" })
  })
  .refine(
    (data) => {
      if (data.type === "EMAIL") return /^\S+@\S+\.\S+$/.test(data.target)
      return /^\+?[0-9]{6,15}$/.test(data.target)
    },
    { message: "格式不正确", path: ["target"] }
  )

export const registerSchema = z
  .object({
    type: z.enum(["EMAIL", "PHONE"]),
    target: z.string().min(1, "请输入邮箱或手机号").max(254, "账号过长"),
    code: z
      .string()
      .length(6, "验证码为 6 位数字")
      .regex(/^\d{6}$/, "验证码为 6 位数字"),
    password: z.string().min(8, "密码至少 8 位").max(128, "密码过长"),
    confirmPassword: z.string().min(1, "请确认密码").max(128, "密码过长")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"]
  })
  .refine(
    (data) => {
      if (data.type === "EMAIL") return /^\S+@\S+\.\S+$/.test(data.target)
      return /^\+?[0-9]{6,15}$/.test(data.target)
    },
    { message: "格式不正确", path: ["target"] }
  )

export type SendCodeInput = z.infer<typeof sendCodeSchema>
export type RegisterInput = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z
  .object({
    target: z.string().min(1, "请输入邮箱或手机号").max(254, "账号过长"),
    type: z.enum(["EMAIL", "PHONE"], { message: "类型必须为 EMAIL 或 PHONE" })
  })
  .refine(
    (data) => {
      if (data.type === "EMAIL") return /^\S+@\S+\.\S+$/.test(data.target)
      return /^\+?[0-9]{6,15}$/.test(data.target)
    },
    { message: "格式不正确", path: ["target"] }
  )

export const resetPasswordSchema = z
  .object({
    type: z.enum(["EMAIL", "PHONE"]),
    target: z.string().min(1, "请输入邮箱或手机号").max(254, "账号过长"),
    code: z
      .string()
      .length(6, "验证码为 6 位数字")
      .regex(/^\d{6}$/, "验证码为 6 位数字"),
    password: z.string().min(8, "密码至少 8 位").max(128, "密码过长"),
    confirmPassword: z.string().min(1, "请确认密码").max(128, "密码过长")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"]
  })
  .refine(
    (data) => {
      if (data.type === "EMAIL") return /^\S+@\S+\.\S+$/.test(data.target)
      return /^\+?[0-9]{6,15}$/.test(data.target)
    },
    { message: "格式不正确", path: ["target"] }
  )

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
