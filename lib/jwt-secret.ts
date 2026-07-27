export function getJwtSecret() {
  const raw = process.env.JWT_SECRET

  if (!raw) {
    throw new Error("JWT_SECRET environment variable is required")
  }

  return new TextEncoder().encode(raw)
}

export function getVerificationSecret() {
  const raw = process.env.VERIFICATION_CODE_SECRET || process.env.JWT_SECRET

  if (!raw) {
    throw new Error("VERIFICATION_CODE_SECRET environment variable is required")
  }

  return raw
}
