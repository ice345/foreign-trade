import { Prisma } from "@prisma/client"

type DecimalLike = Prisma.Decimal | number | string | null | undefined

export function toNumber(value: DecimalLike): number {
  if (value == null) return 0
  return Number(value)
}

export function toNumberOrNull(value: DecimalLike): number | null {
  if (value == null) return null
  return Number(value)
}

export function formatMoney(value: DecimalLike): string {
  if (value == null) return "0.00"
  return Number(value).toFixed(2)
}
