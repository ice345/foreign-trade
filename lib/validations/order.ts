import { z } from "zod"

const validStatuses = ["PENDING", "RUNNING", "POSTED", "CONFIRMED"] as const

export const updateOrderSchema = z.object({
  status: z.enum(validStatuses).optional(),
  postLink: z.string().url().optional().nullable(),
  screenshotUrl: z.string().url().optional().nullable()
})

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
