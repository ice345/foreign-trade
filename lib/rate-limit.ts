type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 5 * 60 * 1000

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  cleanup()

  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterMs: existing.resetAt - now
    }
  }

  existing.count += 1
  return { allowed: true, retryAfterMs: 0 }
}

export async function rateLimitByIp(
  request: Request,
  prefix: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || "unknown"
  return rateLimitByKey(`${prefix}:ip:${ip}`, maxRequests, windowMs)
}

export async function rateLimitByKey(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  try {
    const [{ prisma }, { Prisma }] = await Promise.all([
      import("@/lib/prisma"),
      import("@prisma/client")
    ])
    const now = new Date()
    const resetAt = new Date(Date.now() + windowMs)

    const [entry] = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>(Prisma.sql`
      INSERT INTO "RateLimitEntry" ("key", "count", "resetAt", "updatedAt")
      VALUES (${key}, 1, ${resetAt}, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitEntry"."resetAt" <= ${now} THEN 1
          ELSE "RateLimitEntry"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimitEntry"."resetAt" <= ${now} THEN ${resetAt}
          ELSE "RateLimitEntry"."resetAt"
        END,
        "updatedAt" = NOW()
      RETURNING "count", "resetAt"
    `)

    const allowed = entry.count <= maxRequests
    return {
      allowed,
      retryAfterMs: allowed ? 0 : Math.max(0, entry.resetAt.getTime() - now.getTime())
    }
  } catch (error) {
    console.error("[RateLimit Persistent Error]", error)
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, retryAfterMs: windowMs }
    }
    return rateLimit(key, maxRequests, windowMs)
  }
}
