const raw = process.env.JWT_SECRET

if (!raw) {
  throw new Error("JWT_SECRET environment variable is required")
}

export const jwtSecret = new TextEncoder().encode(raw)
