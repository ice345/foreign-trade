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
    const { prisma } = await import("@/lib/prisma")
    const now = new Date()
    const resetAt = new Date(Date.now() + windowMs)

    return await prisma.$transaction(async (tx) => {
      const entry = await tx.rateLimitEntry.findUnique({ where: { key } })

      if (!entry || entry.resetAt <= now) {
        await tx.rateLimitEntry.upsert({
          where: { key },
          update: { count: 1, resetAt },
          create: { key, count: 1, resetAt }
        })
        return { allowed: true, retryAfterMs: 0 }
      }

      if (entry.count >= maxRequests) {
        return {
          allowed: false,
          retryAfterMs: entry.resetAt.getTime() - now.getTime()
        }
      }

      await tx.rateLimitEntry.update({
        where: { key },
        data: { count: { increment: 1 } }
      })

      return { allowed: true, retryAfterMs: 0 }
    })
  } catch (error) {
    console.error("[RateLimit Persistent Error]", error)
    return rateLimit(key, maxRequests, windowMs)
  }
}
