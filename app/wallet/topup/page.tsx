import { buildMetadata } from "@/lib/metadata"
import Link from "next/link"

export const metadata = buildMetadata({
  title: "充值已关闭 — GlobalPush",
  description: "GlobalPush 已切换为询价与撮合模式。",
  robots: { index: false, follow: false },
})

export default function TopupPage() {
  return (
    <div className="page-container py-16">
      <h1 className="mb-4 text-3xl font-semibold">充值功能已关闭</h1>
      <p className="max-w-2xl text-white/65">
        平台当前采用询价与撮合模式，不再接受微信、支付宝扫码充值，也不会形成新的平台余额。
        历史余额和流水仍会保留，供查询、审计和后续人工清退。
      </p>
      <Link href="/explore" className="btn-primary mt-8">浏览推广资源</Link>
    </div>
  )
}
