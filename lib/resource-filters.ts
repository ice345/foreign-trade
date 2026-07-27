export function parseOptionalMaxPrice(value: string | null) {
  if (value == null || value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, 10_000_000) : null
}

export function parseOptionalLeadTime(value: string | null) {
  if (value == null || value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 365) : null
}
