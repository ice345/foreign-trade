import "server-only"

import crypto from "crypto"
import { FilePurpose, FileVisibility, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
export { getUploadPolicy } from "@/lib/storage-policy"

const GiB = 1024n * 1024n * 1024n
const MiB = 1024n * 1024n

function envBigInt(name: string, fallback: bigint) {
  const value = process.env[name]
  if (!value) return fallback
  try {
    return BigInt(value)
  } catch {
    throw new Error(`Invalid integer configuration: ${name}`)
  }
}

function envInt(name: string, fallback: number) {
  const value = process.env[name]
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Invalid integer configuration: ${name}`)
  }
  return parsed
}

export const storageLimits = {
  maxFileBytes: envInt("R2_MAX_FILE_BYTES", 4 * 1024 * 1024),
  globalStorageBytes: envBigInt("R2_GLOBAL_STORAGE_BYTES", 8n * GiB),
  userStorageBytes: envBigInt("R2_USER_STORAGE_BYTES", 200n * MiB),
  userDailyBytes: envBigInt("R2_USER_DAILY_BYTES", 40n * MiB),
  userDailyFiles: envInt("R2_USER_DAILY_FILES", 20),
  monthlyWriteOps: envInt("R2_MONTHLY_WRITE_OPS", 800_000),
  monthlyReadOps: envInt("R2_MONTHLY_READ_OPS", 8_000_000)
}

function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function startOfUtcDay() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

async function serializable<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) {
        continue
      }
      throw error
    }
  }
  throw new Error("STORAGE_CONFLICT")
}

export async function reserveObject(input: {
  ownerId: string
  purpose: FilePurpose
  visibility: FileVisibility
  size: number
  checksum: string
}) {
  return serializable(() => prisma.$transaction(async (tx) => {
    const size = BigInt(input.size)
    const [globalUsage, userUsage, dailyUsage, monthly] = await Promise.all([
      tx.storedObject.aggregate({
        where: { status: { in: ["PENDING", "READY"] } },
        _sum: { size: true }
      }),
      tx.storedObject.aggregate({
        where: { ownerId: input.ownerId, status: { in: ["PENDING", "READY"] } },
        _sum: { size: true }
      }),
      tx.storedObject.aggregate({
        where: {
          ownerId: input.ownerId,
          status: { in: ["PENDING", "READY"] },
          createdAt: { gte: startOfUtcDay() }
        },
        _sum: { size: true },
        _count: true
      }),
      tx.storageUsageMonth.findUnique({
        where: { month_scope: { month: monthKey(), scope: "global" } }
      })
    ])

    if ((globalUsage._sum.size ?? 0n) + size > storageLimits.globalStorageBytes) {
      throw new Error("STORAGE_GLOBAL_LIMIT")
    }
    if ((userUsage._sum.size ?? 0n) + size > storageLimits.userStorageBytes) {
      throw new Error("STORAGE_USER_LIMIT")
    }
    if ((dailyUsage._sum.size ?? 0n) + size > storageLimits.userDailyBytes) {
      throw new Error("STORAGE_DAILY_BYTES_LIMIT")
    }
    if (dailyUsage._count >= storageLimits.userDailyFiles) {
      throw new Error("STORAGE_DAILY_FILES_LIMIT")
    }
    if ((monthly?.writeOps ?? 0) >= storageLimits.monthlyWriteOps) {
      throw new Error("STORAGE_WRITE_LIMIT")
    }

    const key = `${input.purpose.toLowerCase()}/${monthKey()}/${crypto.randomUUID()}.webp`
    const object = await tx.storedObject.create({
      data: {
        key,
        ownerId: input.ownerId,
        purpose: input.purpose,
        visibility: input.visibility,
        contentType: "image/webp",
        size,
        checksum: input.checksum,
        status: "PENDING"
      }
    })

    await tx.storageUsageMonth.upsert({
      where: { month_scope: { month: monthKey(), scope: "global" } },
      update: { writeOps: { increment: 1 } },
      create: { month: monthKey(), scope: "global", writeOps: 1 }
    })

    return object
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))
}

export async function markObjectReady(id: string) {
  return prisma.storedObject.update({ where: { id }, data: { status: "READY" } })
}

export async function markObjectFailed(id: string) {
  return prisma.storedObject.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "FAILED" }
  })
}

export async function consumeReadOperation() {
  return serializable(() => prisma.$transaction(async (tx) => {
    const usage = await tx.storageUsageMonth.findUnique({
      where: { month_scope: { month: monthKey(), scope: "global" } }
    })
    if ((usage?.readOps ?? 0) >= storageLimits.monthlyReadOps) {
      throw new Error("STORAGE_READ_LIMIT")
    }
    await tx.storageUsageMonth.upsert({
      where: { month_scope: { month: monthKey(), scope: "global" } },
      update: { readOps: { increment: 1 } },
      create: { month: monthKey(), scope: "global", readOps: 1 }
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))
}

export function fileUrl(id: string) {
  return `/api/files/${id}`
}

export function fileIdFromUrl(url: string) {
  const match = /^\/api\/files\/([a-z0-9]+)$/i.exec(url)
  return match?.[1] ?? null
}

export async function validateFileReference(input: {
  url: string
  purposes: FilePurpose[]
  ownerId?: string
  allowAdmin?: boolean
}) {
  const id = fileIdFromUrl(input.url)
  if (!id) return false
  const object = await prisma.storedObject.findFirst({
    where: {
      id,
      status: "READY",
      purpose: { in: input.purposes },
      ...(input.ownerId && { ownerId: input.ownerId })
    },
    select: { id: true }
  })
  return Boolean(object)
}
