import { z } from "zod"
import { isSafeStoredImageUrl } from "@/lib/security"

const validStatuses = ["QUOTED", "RUNNING", "POSTED", "CONFIRMED"] as const

const optionalHttpsUrl = z.string().max(2048).refine((value) => {
  if (!value) return true
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}, "必须是有效的 HTTPS 链接")

export const createOrderSchema = z.object({
  resourceId: z.string().min(1).max(100),
  message: z.string().max(2000).optional().nullable(),
  productLink: optionalHttpsUrl.optional().nullable(),
  discountCode: z.string().max(100).optional().nullable(),
  finalPrice: z.number().min(0).max(10_000_000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable()
}).refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
  message: "结束日期不能早于开始日期",
  path: ["endDate"]
})

export const batchOrderSchema = z.object({
  items: z.array(createOrderSchema).min(1).max(20)
})

export const updateOrderSchema = z.object({
  status: z.enum(validStatuses).optional(),
  amount: z.number().positive().max(10_000_000).optional(),
  quoteNote: z.string().max(1000).optional().nullable(),
  postLink: optionalHttpsUrl.optional().nullable(),
  screenshotUrl: z.string().refine(isSafeStoredImageUrl, "截图必须来自安全上传").optional().nullable()
}).refine((data) => data.status !== "QUOTED" || data.amount !== undefined, {
  message: "报价时必须填写金额",
  path: ["amount"]
})

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
