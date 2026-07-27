export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }
    return entities[char]
  })
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export function isInternalFileUrl(value: string) {
  return /^\/api\/files\/[a-z0-9]+$/i.test(value)
}

export function isTrustedLegacyImageUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && ["i.ibb.co", "images.unsplash.com"].includes(url.hostname)
  } catch {
    return false
  }
}

export function isSafeStoredImageUrl(value: string) {
  return isInternalFileUrl(value) || isTrustedLegacyImageUrl(value)
}
