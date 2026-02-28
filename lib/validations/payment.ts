import { z } from "zod"

export const paymentQrCodeSchema = z.object({
  type: z.enum(["WECHAT", "ALIPAY"], { message: "支付方式必须为 WECHAT 或 ALIPAY" }),
  imageUrl: z.string().url("二维码图片链接格式不正确"),
  label: z.string().max(100).optional().nullable(),
  active: z.boolean().optional().default(true)
})

export const paymentRequestSchema = z.object({
  amount: z.number().positive("金额必须大于 0").max(100000, "单次充值金额不能超过 100000"),
  paymentMethod: z.enum(["WECHAT", "ALIPAY"], { message: "支付方式必须为 WECHAT 或 ALIPAY" }),
  qrCodeId: z.string().optional(),
  note: z.string().max(500, "备注不能超过 500 字").optional()
})

export const approvePaymentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], { message: "状态必须为 APPROVED 或 REJECTED" }),
  note: z.string().max(500).optional()
})

export type PaymentQrCodeInput = z.infer<typeof paymentQrCodeSchema>
export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>
export type ApprovePaymentInput = z.infer<typeof approvePaymentSchema>
