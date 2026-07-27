import type { OrderStatus } from "@prisma/client"

const adminTransitions: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  PENDING: ["QUOTED"],
  QUOTED: ["QUOTED"],
  ACCEPTED: ["RUNNING"],
  RUNNING: ["POSTED"],
  POSTED: ["CONFIRMED"]
}

export function canAdminTransition(from: OrderStatus, to: OrderStatus) {
  return adminTransitions[from]?.includes(to) ?? false
}

export function isTerminalOrder(status: OrderStatus) {
  return status === "CANCELLED" || status === "REFUNDED" || status === "CONFIRMED"
}
