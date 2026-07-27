type FileRecord = {
  visibility: "PUBLIC" | "AUTHENTICATED" | "OWNER_ADMIN"
  ownerId: string | null
}

type Viewer = { id: string; role: "USER" | "ADMIN" } | null

export function canReadFile(file: FileRecord, viewer: Viewer) {
  if (file.visibility === "PUBLIC") return true
  if (!viewer) return false
  if (file.visibility === "AUTHENTICATED") return true
  return viewer.role === "ADMIN" || file.ownerId === viewer.id
}
