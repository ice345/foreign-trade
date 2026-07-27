import type { FilePurpose, FileVisibility } from "@prisma/client"

export type UploadPolicy = {
  purpose: FilePurpose
  visibility: FileVisibility
  adminOnly: boolean
}

const policies: Record<string, UploadPolicy> = {
  avatars: { purpose: "AVATAR", visibility: "PUBLIC", adminOnly: false },
  resources: { purpose: "RESOURCE_IMAGE", visibility: "PUBLIC", adminOnly: true },
  screenshots: { purpose: "ORDER_SCREENSHOT", visibility: "OWNER_ADMIN", adminOnly: true }
}

export function getUploadPolicy(folder: string) {
  return policies[folder] ?? null
}
