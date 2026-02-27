const raw = process.env.JWT_SECRET

if (!raw && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production")
}

export const jwtSecret = new TextEncoder().encode(raw ?? "dev-secret")
