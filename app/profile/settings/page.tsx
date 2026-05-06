import ProfileSettings from "./ProfileSettings"
import { buildMetadata } from "@/lib/metadata"

export const metadata = buildMetadata({
  title: "个人设置 — GlobalPush",
  description: "管理你的 GlobalPush 个人资料和账号设置。",
  robots: { index: false, follow: false },
})

export default function ProfileSettingsPage() {
  return (
    <div className="page-container py-16">
      <h1 className="mb-8 text-3xl font-semibold">个人设置</h1>
      <ProfileSettings />
    </div>
  )
}
