import crypto from "crypto"
import { writeFile } from "node:fs/promises"
import sharp from "sharp"
import { FilePurpose, FileVisibility, Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma"
import { deleteObject, putObject } from "../lib/r2-client"

const maxBytes = Number(process.env.R2_MAX_FILE_BYTES ?? 4 * 1024 * 1024)
const maxStorage = BigInt(process.env.R2_GLOBAL_STORAGE_BYTES ?? 8 * 1024 ** 3)
const maxWrites = Number(process.env.R2_MONTHLY_WRITE_OPS ?? 800_000)
const reportPath = process.env.MIGRATION_FAILURE_REPORT ?? "r2-migration-failures.json"

function monthKey() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
}

async function downloadAndNormalize(url: string) {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const declared = Number(response.headers.get("content-length") ?? 0)
  if (declared > maxBytes) throw new Error("source file exceeds 4 MB")
  const source = Buffer.from(await response.arrayBuffer())
  if (source.length > maxBytes) throw new Error("source file exceeds 4 MB")
  const image = sharp(source, { failOn: "error", limitInputPixels: 20_000_000 })
  const metadata = await image.metadata()
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > 20_000_000) {
    throw new Error("source image dimensions are invalid")
  }
  const output = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86, effort: 4 }).toBuffer()
  if (output.length > maxBytes) throw new Error("normalized file exceeds 4 MB")
  return output
}

async function reserve(ownerId: string | null, purpose: FilePurpose, visibility: FileVisibility, output: Buffer) {
  return prisma.$transaction(async (tx) => {
    const [stored, usage] = await Promise.all([
      tx.storedObject.aggregate({ where: { status: { in: ["PENDING", "READY"] } }, _sum: { size: true } }),
      tx.storageUsageMonth.findUnique({ where: { month_scope: { month: monthKey(), scope: "global" } } })
    ])
    if ((stored._sum.size ?? 0n) + BigInt(output.length) > maxStorage) throw new Error("global storage limit")
    if ((usage?.writeOps ?? 0) >= maxWrites) throw new Error("monthly write limit")
    const object = await tx.storedObject.create({ data: {
      key: `${purpose.toLowerCase()}/${monthKey()}/${crypto.randomUUID()}.webp`,
      ownerId,
      purpose,
      visibility,
      contentType: "image/webp",
      size: output.length,
      checksum: crypto.createHash("sha256").update(output).digest("hex")
    } })
    await tx.storageUsageMonth.upsert({
      where: { month_scope: { month: monthKey(), scope: "global" } },
      update: { writeOps: { increment: 1 } },
      create: { month: monthKey(), scope: "global", writeOps: 1 }
    })
    return object
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

type Candidate = {
  kind: string
  id: string
  url: string
  ownerId: string | null
  purpose: FilePurpose
  visibility: FileVisibility
  attach: (fileId: string, url: string) => Promise<unknown>
}

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } })
  const [users, resources, orders, requests, qrCodes] = await Promise.all([
    prisma.user.findMany({ where: { avatar: { startsWith: "https://" } }, select: { id: true, avatar: true } }),
    prisma.resource.findMany({ where: { image: { startsWith: "https://" } }, select: { id: true, image: true } }),
    prisma.order.findMany({ where: { screenshotUrl: { startsWith: "https://" } }, select: { id: true, userId: true, screenshotUrl: true } }),
    prisma.paymentRequest.findMany({ where: { screenshotUrl: { startsWith: "https://" } }, select: { id: true, userId: true, screenshotUrl: true } }),
    prisma.paymentQrCode.findMany({ where: { imageUrl: { startsWith: "https://" } }, select: { id: true, imageUrl: true } })
  ])

  const candidates: Candidate[] = [
    ...users.flatMap((item) => item.avatar ? [{ kind: "user-avatar", id: item.id, url: item.avatar, ownerId: item.id, purpose: FilePurpose.AVATAR, visibility: FileVisibility.PUBLIC, attach: (fileId: string, url: string) => prisma.user.update({ where: { id: item.id }, data: { avatar: url } }) }] : []),
    ...resources.flatMap((item) => item.image ? [{ kind: "resource-image", id: item.id, url: item.image, ownerId: admin?.id ?? null, purpose: FilePurpose.RESOURCE_IMAGE, visibility: FileVisibility.PUBLIC, attach: (fileId: string, url: string) => prisma.resource.update({ where: { id: item.id }, data: { image: url, imageFileId: fileId } }) }] : []),
    ...orders.flatMap((item) => item.screenshotUrl ? [{ kind: "order-screenshot", id: item.id, url: item.screenshotUrl, ownerId: item.userId, purpose: FilePurpose.ORDER_SCREENSHOT, visibility: FileVisibility.OWNER_ADMIN, attach: (fileId: string, url: string) => prisma.order.update({ where: { id: item.id }, data: { screenshotUrl: url, screenshotFileId: fileId } }) }] : []),
    ...requests.flatMap((item) => item.screenshotUrl ? [{ kind: "payment-screenshot", id: item.id, url: item.screenshotUrl, ownerId: item.userId, purpose: FilePurpose.PAYMENT_SCREENSHOT, visibility: FileVisibility.OWNER_ADMIN, attach: (_fileId: string, url: string) => prisma.paymentRequest.update({ where: { id: item.id }, data: { screenshotUrl: url } }) }] : []),
    ...qrCodes.map((item) => ({ kind: "payment-qr", id: item.id, url: item.imageUrl, ownerId: admin?.id ?? null, purpose: FilePurpose.PAYMENT_QR, visibility: FileVisibility.AUTHENTICATED, attach: (_fileId: string, url: string) => prisma.paymentQrCode.update({ where: { id: item.id }, data: { imageUrl: url } }) }))
  ]

  const failures: Array<{ kind: string; id: string; url: string; error: string }> = []
  let migrated = 0
  for (const candidate of candidates) {
    let object: { id: string; key: string } | null = null
    try {
      const output = await downloadAndNormalize(candidate.url)
      object = await reserve(candidate.ownerId, candidate.purpose, candidate.visibility, output)
      await putObject(object.key, output, "image/webp")
      await prisma.storedObject.update({ where: { id: object.id }, data: { status: "READY" } })
      await candidate.attach(object.id, `/api/files/${object.id}`)
      migrated += 1
    } catch (error) {
      if (object) {
        await Promise.allSettled([
          deleteObject(object.key),
          prisma.storedObject.updateMany({ where: { id: object.id }, data: { status: "FAILED" } })
        ])
      }
      failures.push({ kind: candidate.kind, id: candidate.id, url: candidate.url, error: error instanceof Error ? error.message : "unknown error" })
    }
  }

  await writeFile(reportPath, `${JSON.stringify(failures, null, 2)}\n`, { mode: 0o600 })
  console.log(JSON.stringify({ found: candidates.length, migrated, failed: failures.length, reportPath }))
  if (failures.length) process.exitCode = 1
}

main().finally(() => prisma.$disconnect())
