export function getJwtSecret() {
  const raw = process.env.JWT_SECRET

  if (!raw) {
    throw new Error("JWT_SECRET environment variable is required")
  }

  return new TextEncoder().encode(raw)
}
