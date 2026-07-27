export function isAllowedRequestOrigin(input: {
  origin: string | null
  fetchSite: string | null
  requestOrigin: string
  configuredSiteUrl?: string
  vercelUrl?: string
}) {
  if (input.fetchSite && !["same-origin", "same-site", "none"].includes(input.fetchSite)) return false
  if (!input.origin) return true
  const allowed = new Set([input.requestOrigin.replace(/\/$/, "")])
  if (input.configuredSiteUrl) allowed.add(input.configuredSiteUrl.replace(/\/$/, ""))
  if (input.vercelUrl) allowed.add(`https://${input.vercelUrl}`.replace(/\/$/, ""))
  return allowed.has(input.origin.replace(/\/$/, ""))
}
