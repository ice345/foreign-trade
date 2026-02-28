import { Prisma } from "@prisma/client"

export function toNumber(value: Prisma.Decimal | null | undefined): number {
  if (value == null) return 0
  return Number(value)
}

export function toNumberOrNull(value: Prisma.Decimal | null | undefined): number | null {
  if (value == null) return null
  return Number(value)
}

export function formatMoney(value: Prisma.Decimal | number | null | undefined): string {
  if (value == null) return "0.00"
  return Number(value).toFixed(2)
}
