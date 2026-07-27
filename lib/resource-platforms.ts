export const RESOURCE_PLATFORMS = [
  "Reddit",
  "Facebook",
  "Telegram",
  "TikTok",
  "YouTube",
  "Instagram",
  "X",
  "Discord",
  "LinkedIn",
  "Pinterest",
  "Deal 站",
  "独立媒体"
] as const

export function resourcePlatformOptions(current?: string | null) {
  if (!current || RESOURCE_PLATFORMS.includes(current as (typeof RESOURCE_PLATFORMS)[number])) {
    return [...RESOURCE_PLATFORMS]
  }
  return [current, ...RESOURCE_PLATFORMS]
}
