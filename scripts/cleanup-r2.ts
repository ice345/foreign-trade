import { prisma } from "../lib/prisma"
import { cleanupStorage } from "../lib/storage-cleanup"

async function main() {
  const result = await cleanupStorage()
  console.log(JSON.stringify(result))
  if (result.failures.length) process.exitCode = 1
}

main().finally(() => prisma.$disconnect())
