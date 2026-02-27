import { z } from "zod"

export const createReviewSchema = z.object({
  orderId: z.string().min(1, "订单 ID 不能为空"),
  rating: z.number().int().min(1, "评分最低为 1").max(5, "评分最高为 5"),
  comment: z.string().max(500, "评论不能超过 500 字").optional()
})
