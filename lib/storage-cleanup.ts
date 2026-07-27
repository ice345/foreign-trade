import { prisma } from "@/lib/prisma"
import { deleteObject } from "@/lib/r2-client"

async function remove(id: string, key: string) {
  await deleteObject(key)
  await prisma.storedObject.updateMany({
    where: { id, status: { not: "DELETED" } },
    data: { status: "DELETED", deletedAt: new Date() }
  })
}

export async function cleanupStorage() {
  const now = Date.now()
  const pendingCutoff = new Date(now - 24 * 60 * 60 * 1000)
  const orphanCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const [stale, ordinary, references] = await Promise.all([
    prisma.storedObject.findMany({ where: { status: { in: ["PENDING", "FAILED"] }, createdAt: { lt: pendingCutoff } }, select: { id: true, key: true } }),
    prisma.storedObject.findMany({ where: { status: "READY", purpose: { in: ["AVATAR", "RESOURCE_IMAGE"] }, createdAt: { lt: orphanCutoff } }, select: { id: true, key: true } }),
    Promise.all([
      prisma.user.findMany({ where: { avatar: { startsWith: "/api/files/" } }, select: { avatar: true } }),
      prisma.resource.findMany({ where: { image: { startsWith: "/api/files/" } }, select: { image: true } })
    ])
  ])
  const linked = new Set(references.flat().flatMap((item) => {
    const value = "avatar" in item ? item.avatar : item.image
    const id = value?.match(/^\/api\/files\/([a-z0-9]+)$/i)?.[1]
    return id ? [id] : []
  }))
  const targets = [...stale, ...ordinary.filter((item) => !linked.has(item.id))]
  const failures: string[] = []
  for (const target of targets) {
    try { await remove(target.id, target.key) } catch { failures.push(target.id) }
  }
  return { candidates: targets.length, deleted: targets.length - failures.length, failures }
}
